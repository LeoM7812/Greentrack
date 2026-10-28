"""
Comparar comercializadores de eletricidade com os preços oficiais do simulador da ERSE.

Fonte: https://simuladorprecos.erse.pt (campo csvPath em /config/Settings.json, um .zip com
Precos_ELEGN.csv e CondComerciais.csv). Metadados: https://www.erse.pt/media/mr4puo2e/metadata.xlsx
Regras de cálculo: manual do simulador, https://www.erse.pt/media/eqppp0lo/manual-simulador_out-24.pdf

Os preços da ERSE (termo fixo em €/dia e termo de energia em €/kWh) são SEM IVA e já incluem o
acesso às redes. Para os pôr na mesma base que o total da fatura juntamos, como o simulador:
CAV, IEC, taxa da DGEG e IVA (23%, ou 6% na CAV e nos primeiros 100 kWh por 30 dias até 6,9 kVA).
"""
import csv
import io
import json
import os
import time
import urllib.request
import zipfile
from datetime import date, datetime

SETTINGS_URL = "https://simuladorprecos.erse.pt/config/Settings.json"
SIMULATOR_URL = "https://simuladorprecos.erse.pt/"
CACHE = os.path.join(os.path.dirname(os.path.abspath(__file__)), "uploads", "erse.zip")
CACHE_SECONDS = 24 * 3600  # a ERSE atualiza os dados poucas vezes por mês

# Taxas e impostos (manual do simulador da ERSE; mudar aqui quando a lei mudar)
CAV_MONTH = 2.85  # Contribuição para o Audiovisual, €/mês, IVA 6%
DGEG_MONTH = 0.07  # Taxa de exploração da DGEG, €/mês, IVA 23%
IEC_KWH = 0.001  # Imposto Especial de Consumo, €/kWh, IVA 23%
VAT, VAT_REDUCED = 0.23, 0.06
REDUCED_KWH_PER_30_DAYS = 100  # IVA a 6% na energia, até 6,9 kVA
REDUCED_VAT_MAX_KVA = 6.9
# shortcut: até 3,45 kVA o termo fixo das redes também tem IVA a 6%, mas a ERSE não publica essa
# parcela por oferta; é igual em todas as ofertas, por isso a ordem não muda e o total sobe uns cêntimos.

# Bi-horária sem a divisão na fatura: a divisão dos casos tipo do simulador (60% fora de vazio).
DEFAULT_OFF_PEAK_SHARE = 0.4

CYCLES = {"simples": "1", "bi-horaria": "2"}


def _num(value):
    value = (value or "").strip().replace(",", ".")
    return float(value) if value else 0.0


def _date(value):
    try:
        return datetime.strptime(value.strip(), "%d/%m/%Y").date()
    except (ValueError, AttributeError):
        return None


def _link(value):
    value = (value or "").strip()
    if not value:
        return SIMULATOR_URL
    return value if value.startswith(("http://", "https://")) else "https://" + value


def download(path=CACHE, now=None):
    """Guarda o .zip da ERSE em disco e devolve o caminho; usa a cópia se tiver menos de um dia."""
    now = now or time.time()
    if os.path.exists(path) and now - os.path.getmtime(path) < CACHE_SECONDS:
        return path
    with urllib.request.urlopen(SETTINGS_URL, timeout=20) as r:
        csv_url = json.load(r)["csvPath"].replace(" ", "%20")
    with urllib.request.urlopen(csv_url, timeout=60) as r:
        data = r.read()
    zipfile.ZipFile(io.BytesIO(data)).testzip()  # não guardar um ficheiro estragado
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path + ".tmp", "wb") as f:
        f.write(data)
    os.replace(path + ".tmp", path)
    return path


def load(zip_path):
    """Lê os dois CSV do .zip: (linhas de preços, condições por código de oferta)."""
    with zipfile.ZipFile(zip_path) as z:
        names = {os.path.basename(n): n for n in z.namelist()}
        read = lambda name: list(csv.DictReader(io.TextIOWrapper(z.open(names[name]), encoding="utf-8-sig"), delimiter=";"))
        prices = read("Precos_ELEGN.csv")
        conditions = {c["COD_Proposta"]: c for c in read("CondComerciais.csv")}
    return prices, conditions


def _eligible(cond, cycle, annual_kwh, today):
    start, end = _date(cond.get("Data ini")), _date(cond.get("Data fim"))
    lo, hi = _num(cond.get("ConsIni_ELE")), _num(cond.get("ConsFim_ELE"))
    return (
        cond.get("Segmento") in ("Dom", "Tod")
        and cond.get("Fornecimento") == "ELE"  # as duais obrigam a ter gás no mesmo comercializador
        and cond.get("FiltroPrecosIndex_ELE") == "N"  # indexadas: o preço muda todos os meses
        and cond.get("FiltroRestrições") != "S"  # ex.: só para clientes de outro serviço
        and cycle in (cond.get("TipoContagem") or "")
        and (start is None or start <= today)
        and (end is None or end >= today)
        and annual_kwh >= lo
        and (not hi or annual_kwh <= hi)
    )


def bill_total(fixed_day, energy, kwh, days, power_kva, extra_year=0.0):
    """Total de uma fatura com taxas e IVA. energy = custo da energia sem IVA (já com descontos)."""
    months = days / 30
    fixed = fixed_day * days
    reduced_kwh = min(kwh, REDUCED_KWH_PER_30_DAYS * months) if power_kva <= REDUCED_VAT_MAX_KVA else 0
    energy_reduced = energy * (reduced_kwh / kwh) if kwh else 0
    taxes = IEC_KWH * kwh + DGEG_MONTH * months
    total = (
        (fixed + energy - energy_reduced + taxes + extra_year * days / 365) * (1 + VAT)
        + energy_reduced * (1 + VAT_REDUCED)
        + CAV_MONTH * months * (1 + VAT_REDUCED)
    )
    return round(total, 2)


def compare(prices, conditions, power_kva, tariff, kwh, days, total_paid=None,
            off_peak_kwh=None, today=None, limit=3):
    """As `limit` ofertas mais baratas (uma por comercializador) para esta fatura, ou [] se não der."""
    cycle = CYCLES.get(tariff)
    if not cycle or not kwh or not days or not power_kva:
        return {"offers": [], "reason": "Comparação disponível para tarifa simples ou bi-horária, com consumo, dias e potência na fatura."}
    today = today or date.today()
    power = f"{power_kva:g}".replace(".", ",")
    annual_kwh = kwh * 365 / days
    if cycle == "2":
        off_peak = off_peak_kwh if off_peak_kwh is not None else kwh * DEFAULT_OFF_PEAK_SHARE
        peak = kwh - off_peak

    best = {}
    seen = set()
    for row in prices:
        code = row["COD_Proposta"]
        # As ofertas duais repetem a eletricidade por escalão de gás; ORD = só numa região.
        if row["Pot_Cont"] != power or row["Contagem"] != cycle or row["ORD"] or (code, cycle) in seen:
            continue
        seen.add((code, cycle))
        cond = conditions.get(code)
        if not cond or not _eligible(cond, cycle, annual_kwh, today) or not row["TV|TVFV|TVP"]:
            continue
        fixed_day = _num(row["TF"]) * (1 - _num(cond.get("ReembTF_ELE (%)")) / 100)
        if cycle == "1":
            energy = _num(row["TV|TVFV|TVP"]) * kwh
        else:
            energy = _num(row["TV|TVFV|TVP"]) * peak + _num(row["TVV|TVC"]) * off_peak
        energy = energy * (1 - _num(cond.get("ReembTW_ELE (%)")) / 100) - _num(cond.get("ReembW_ELE (€/kWh)")) * kwh
        # Descontos só para novos clientes ficam de fora: compara-se o preço que se paga depois.
        extra = _num(cond.get("CustoServicos_s/IVA (€/ano)")) - _num(cond.get("ReembFixo (€/ano)"))
        total = bill_total(fixed_day, energy, kwh, days, power_kva, extra)
        supplier = row["COM"]
        if supplier not in best or total < best[supplier]["estimatedTotal"]:
            best[supplier] = {
                "supplier": supplier,
                "offer": cond.get("NomeProposta", "").strip(),
                "estimatedTotal": total,
                "saving": round(total_paid - total, 2) if total_paid else None,
                "loyaltyMonths": int(_num(cond.get("DuracaoContrato"))) if cond.get("FiltroFidelização") == "S" else 0,
                "link": _link(cond.get("LinkOfertaCom") or cond.get("LinkCOM")),
            }
    offers = sorted(best.values(), key=lambda o: o["estimatedTotal"])[:limit]
    notes = ["Preços do simulador da ERSE, com taxas e IVA, sem descontos só para novos clientes."]
    if cycle == "2" and off_peak_kwh is None:
        notes.append("A fatura não separa o consumo em vazio: usámos 40% em vazio, como os casos tipo da ERSE.")
    return {"offers": offers, "simulator": SIMULATOR_URL, "notes": notes}
