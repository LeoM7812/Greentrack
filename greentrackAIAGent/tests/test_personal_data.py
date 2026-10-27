"""
The bill text goes to OpenAI. The customer's name, address, NIF, CPE,
email, phone and IBAN must be removed first, and the bill contents must
not end up in the server logs. Consumption, amounts and tariff must stay,
because that is what the analysis needs.
"""
import io
import json
from types import SimpleNamespace

import ai_agent

BILL_WITH_PERSONAL_DATA = """Fatura de eletricidade EDP Comercial
Nome: Maria da Silva Santos
Morada: Rua das Flores, 12, 2.º Esq
3000-123 Coimbra
NIF: 234 567 890
Telefone: +351 912 345 678
Email: maria.santos@example.pt
Código CPE: PT0002000012345678AB
IBAN: PT50 0002 0123 1234 5678 9015 4
Periodo 01/01/2024 a 31/01/2024
Consumo 245 kWh
Potencia contratada 6.9 kVA
Tarifa simples
Valor total 89.47 EUR
Leitura do contador 12345
"""

PERSONAL = ["Maria", "Silva", "Flores", "3000-123", "Coimbra", "234 567 890", "912 345 678",
            "maria.santos@example.pt", "PT0002000012345678AB", "PT50 0002", "9015"]
NEEDED = ["245 kWh", "6.9 kVA", "Tarifa simples", "89.47 EUR", "01/01/2024 a 31/01/2024", "EDP Comercial", "12345"]


def test_redaction_removes_personal_data_and_keeps_bill_figures():
    redacted = ai_agent.redact_personal_data(BILL_WITH_PERSONAL_DATA)
    for value in PERSONAL:
        assert value not in redacted, value
    for value in NEEDED:
        assert value in redacted, value


def test_text_sent_to_openai_and_logs_have_no_personal_data(monkeypatch, tmp_path, capsys):
    monkeypatch.chdir(tmp_path)
    monkeypatch.setattr(ai_agent, "extract_text_from_pdf", lambda path: BILL_WITH_PERSONAL_DATA)
    sent = []

    def create(**kwargs):
        sent.append(kwargs["messages"][0]["content"])
        reply = {"period": "Janeiro 2024", "consumptionKwh": 245, "totalAmount": 89.47,
                 "tariffType": "simples", "contractedPower": 6.9, "suggestions": []}
        return SimpleNamespace(choices=[SimpleNamespace(message=SimpleNamespace(content=json.dumps(reply)))])

    monkeypatch.setattr(ai_agent.openai, "chat", SimpleNamespace(completions=SimpleNamespace(create=create)))
    ai_agent.app.config["TESTING"] = True
    response = ai_agent.app.test_client().post(
        "/ai/suggestions",
        data={"file": (io.BytesIO(b"%PDF-1.4 dummy"), "fatura.pdf")},
        content_type="multipart/form-data",
    )

    assert response.status_code == 200
    assert len(sent) == 1
    logs = capsys.readouterr()
    for value in PERSONAL:
        assert value not in sent[0], f"sent to OpenAI: {value}"
        assert value not in logs.out + logs.err, f"written to logs: {value}"
    assert "245 kWh" in sent[0]
