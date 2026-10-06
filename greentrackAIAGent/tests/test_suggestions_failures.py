"""
Regression tests: when the AI step fails, the API must say so.

Before this fix, /ai/suggestions answered HTTP 200 with made-up numbers
(e.g. 250 kWh / 85.50 EUR) whenever the OpenAI call failed, and with zeros
when the model returned invalid JSON. The app then showed those numbers to
the user as if they had been read from their bill.
"""
import io
import json
from types import SimpleNamespace

import pytest

import ai_agent

# Text that passes check_invoice_readability (keywords + enough numbers).
READABLE_BILL_TEXT = (
    "Fatura de eletricidade EDP Comercial. Periodo 01/01/2024 a 31/01/2024. "
    "Consumo 245 kWh. Potencia contratada 6.9 kVA. Tarifa simples. "
    "Valor total 89.47 EUR. Leitura do contador 12345."
)


def _fake_openai(create):
    return SimpleNamespace(chat=SimpleNamespace(completions=SimpleNamespace(create=create)))


def _llm_reply(content):
    return SimpleNamespace(choices=[SimpleNamespace(message=SimpleNamespace(content=content))])


@pytest.fixture
def client(monkeypatch, tmp_path):
    monkeypatch.chdir(tmp_path)  # keep uploads/ out of the repo
    monkeypatch.setattr(ai_agent, "extract_text_from_pdf", lambda path: READABLE_BILL_TEXT)
    ai_agent.app.config["TESTING"] = True
    return ai_agent.app.test_client()


def _upload(client, filename="fatura.pdf"):
    return client.post(
        "/ai/suggestions",
        data={"file": (io.BytesIO(b"%PDF-1.4 dummy"), filename)},
        content_type="multipart/form-data",
    )


def test_openai_failure_is_reported_not_hidden(client, monkeypatch):
    def boom(**kwargs):
        raise RuntimeError("OpenAI unavailable")

    monkeypatch.setattr(ai_agent, "openai", _fake_openai(boom))

    resp = _upload(client)
    body = resp.get_json()

    assert resp.status_code == 502
    assert body["processingStatus"] == "error_ai_unavailable"
    # No fabricated bill data may be returned.
    assert "analysis_data" not in body


def test_invalid_llm_json_is_reported_not_zeroed(client, monkeypatch):
    monkeypatch.setattr(
        ai_agent, "openai", _fake_openai(lambda **kw: _llm_reply("Sorry, I can't read this bill."))
    )

    resp = _upload(client)
    body = resp.get_json()

    assert resp.status_code == 502
    assert body["processingStatus"] == "error_ai_invalid_response"
    assert "analysis_data" not in body


def test_missing_required_field_is_reported(client, monkeypatch):
    partial = json.dumps({"period": "Janeiro 2024", "consumptionKwh": 245})
    monkeypatch.setattr(ai_agent, "openai", _fake_openai(lambda **kw: _llm_reply(partial)))

    resp = _upload(client)

    assert resp.status_code == 502
    assert resp.get_json()["processingStatus"] == "error_ai_invalid_response"


def test_valid_llm_json_still_succeeds(client, monkeypatch):
    good = json.dumps({
        "period": "Janeiro 2024", "consumptionKwh": 245.0, "totalAmount": 89.47,
        "tariffType": "simples", "contractedPower": 6.9, "averageDaily": 7.9,
        "suggestions": [{"category": "tarifa", "title": "Bi-horaria",
                         "description": "Pode poupar", "priority": "alta", "potentialSaving": 12.0}],
        "insights": {},
    })
    monkeypatch.setattr(ai_agent, "openai", _fake_openai(lambda **kw: _llm_reply(good)))

    resp = _upload(client)
    body = resp.get_json()

    # Happy path must keep working (guards against over-correcting).
    assert resp.status_code == 200
    assert body["analysis_data"]["consumptionKwh"] == 245.0
