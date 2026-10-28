import io
import json
import zipfile
from datetime import date

import ai_agent
import erse

HEAD_P = "COM;Pot_Cont;Escalao;ORD;COD_Proposta;Contagem;TF;TV|TVFV|TVP;TVV|TVC;TVVz;TFGN;TVGN"
HEAD_C = ("COM;COD_Proposta;NomeProposta;Segmento;TipoContagem;ConsIni_ELE;ConsFim_ELE;Fornecimento;DuracaoContrato;"
          "Data ini;Data fim;FiltroFidelização;FiltroRestrições;FiltroPrecosIndex_ELE;CustoServicos_s/IVA (€/ano);"
          "ReembFixo (€/ano);ReembTF_ELE (%);ReembTW_ELE (%);ReembW_ELE (€/kWh);LinkOfertaCom;LinkCOM")
PRICES = [
    "A;6,9;;;A1;1;0,5;0,15;;;;",
    "A;6,9;;;A2;1;0,5;0,14;;;;",  # mais barata do mesmo comercializador
    "B;6,9;;;B1;1;0,4;0,16;;;;",
    "C;6,9;;;C1;1;0,1;0,05;;;;",  # indexada
    "D;6,9;;;D1;1;0,1;0,05;;;;",  # dual
    "E;6,9;;;E1;1;0,1;0,05;;;;",  # com restrições
    "F;6,9;;;F1;1;0,1;0,05;;;;",  # já acabou
    "G;6,9;;;G1;1;0,1;0,05;;;;",  # só empresas
    "A;6,9;;;A1;2;0,5;0,20;0,10;;;",
    "H;6,9;;DUR;H1;1;0,1;0,05;;;;",  # só numa região
]
COND = [
    "A;A1;Oferta A1;Dom;12;;;ELE;12;01/01/2026;;S;N;N;;;;;;https://a.pt/a1;",
    "A;A2;Oferta A2;Tod;1;;;ELE;12;01/01/2026;31/12/2026;N;N;N;;;;;;;a.pt",
    "B;B1;Oferta B1;Dom;1;;;ELE;12;01/01/2026;;N;N;N;12;;;;;;",
    "C;C1;C;Dom;1;;;ELE;12;01/01/2026;;N;N;S;;;;;;;",
    "D;D1;D;Dom;1;;;DUAL;12;01/01/2026;;N;N;N;;;;;;;",
    "E;E1;E;Dom;1;;;ELE;12;01/01/2026;;N;S;N;;;;;;;",
    "F;F1;F;Dom;1;;;ELE;12;01/01/2026;30/06/2026;N;N;N;;;;;;;",
    "G;G1;G;Ndom;1;;;ELE;12;01/01/2026;;N;N;N;;;;;;;",
    "H;H1;H;Dom;1;;;ELE;12;01/01/2026;;N;N;N;;;;;;;",
]
TODAY = date(2026, 10, 28)


def _zip(tmp_path):
    path = tmp_path / "erse.zip"
    with zipfile.ZipFile(path, "w") as z:
        z.writestr("csv/Precos_ELEGN.csv", "﻿" + "\r\n".join([HEAD_P] + PRICES))
        z.writestr("csv/CondComerciais.csv", "﻿" + "\r\n".join([HEAD_C] + COND))
    return erse.load(path)


def test_only_domestic_fixed_price_electricity_offers_one_per_supplier(tmp_path):
    prices, cond = _zip(tmp_path)
    result = erse.compare(prices, cond, 6.9, "simples", 245, 31, total_paid=70, today=TODAY)
    assert [o["supplier"] for o in result["offers"]] == ["A", "B"]
    a = result["offers"][0]
    assert a["offer"] == "Oferta A2" and a["link"] == "https://a.pt" and a["loyaltyMonths"] == 0
    assert a["saving"] == round(70 - a["estimatedTotal"], 2)


def test_bill_total_adds_taxes_and_vat_like_the_erse_simulator():
    # 6,9 kVA, 30 dias, 100 kWh a 0,15 €: toda a energia com IVA a 6%
    total = erse.bill_total(0.5, 15.0, 100, 30, 6.9)
    expected = (15 + 0.1 + 0.07) * 1.23 + 15 * 1.06 + 2.85 * 1.06
    assert total == round(expected, 2)
    # acima de 6,9 kVA a energia paga sempre 23%
    assert erse.bill_total(0.5, 15.0, 100, 30, 10.35) == round((15 + 15 + 0.1 + 0.07) * 1.23 + 2.85 * 1.06, 2)


def test_extra_services_count_against_the_offer(tmp_path):
    prices, cond = _zip(tmp_path)
    b = next(o for o in erse.compare(prices, cond, 6.9, "simples", 245, 31, today=TODAY)["offers"] if o["supplier"] == "B")
    assert b["estimatedTotal"] == erse.bill_total(0.4, 0.16 * 245, 245, 31, 6.9, 12)


def test_two_period_uses_the_off_peak_split_and_says_when_it_is_assumed(tmp_path):
    prices, cond = _zip(tmp_path)
    given = erse.compare(prices, cond, 6.9, "bi-horaria", 200, 30, off_peak_kwh=50, today=TODAY)
    assert given["offers"][0]["estimatedTotal"] == erse.bill_total(0.5, 0.20 * 150 + 0.10 * 50, 200, 30, 6.9)
    assert len(given["notes"]) == 1
    assumed = erse.compare(prices, cond, 6.9, "bi-horaria", 200, 30, today=TODAY)
    assert assumed["offers"][0]["estimatedTotal"] == erse.bill_total(0.5, 0.20 * 120 + 0.10 * 80, 200, 30, 6.9)
    assert len(assumed["notes"]) == 2


def test_no_comparison_without_the_data_it_needs(tmp_path):
    prices, cond = _zip(tmp_path)
    for args in [(6.9, "tri-horaria", 245, 31), (6.9, "simples", 245, None), (0, "simples", 245, 31)]:
        result = erse.compare(prices, cond, *args, today=TODAY)
        assert result["offers"] == [] and result["reason"]


def test_analysis_still_works_when_erse_is_down():
    result = ai_agent.supplier_comparison({"contractedPower": 6.9, "tariffType": "simples",
                                           "consumptionKwh": 245, "billingDays": 31, "totalAmount": 61.3})
    assert result["offers"] == [] and result["reason"]
