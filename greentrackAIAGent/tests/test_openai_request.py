"""
The OpenAI call uses a current model (configurable) and a strict JSON
schema, so the reply always has the fields the app needs.
"""
import io
import json
from types import SimpleNamespace

import ai_agent

BILL = ("Fatura de eletricidade EDP Comercial. Periodo 01/01/2024 a 31/01/2024. "
        "Consumo 245 kWh. Potencia contratada 6.9 kVA. Tarifa simples. "
        "Valor total 89.47 EUR. Leitura do contador 12345.")


def _post(monkeypatch, tmp_path, reply_content):
    monkeypatch.chdir(tmp_path)
    monkeypatch.setattr(ai_agent, "extract_text_from_pdf", lambda path: BILL)
    calls = []

    def create(**kwargs):
        calls.append(kwargs)
        return SimpleNamespace(choices=[SimpleNamespace(message=SimpleNamespace(content=reply_content))])

    monkeypatch.setattr(ai_agent, "openai", SimpleNamespace(chat=SimpleNamespace(completions=SimpleNamespace(create=create))))
    ai_agent.app.config["TESTING"] = True
    resp = ai_agent.app.test_client().post(
        "/ai/suggestions", data={"file": (io.BytesIO(b"%PDF-1.4"), "f.pdf")}, content_type="multipart/form-data")
    return resp, calls


GOOD = json.dumps({"period": "Janeiro 2024", "consumptionKwh": 245, "totalAmount": 89.47, "tariffType": "simples",
                   "contractedPower": 6.9, "averageDaily": None, "suggestions": [],
                   "insights": {"peakConsumptionHours": None, "highestCosts": None}})


def test_uses_configured_model_and_strict_schema(monkeypatch, tmp_path):
    monkeypatch.setattr(ai_agent, "OPENAI_MODEL", "gpt-test-model")
    resp, calls = _post(monkeypatch, tmp_path, GOOD)

    assert resp.status_code == 200
    call = calls[0]
    assert call["model"] == "gpt-test-model"
    assert call["response_format"]["type"] == "json_schema"
    assert call["response_format"]["json_schema"]["strict"] is True
    assert call["response_format"]["json_schema"]["schema"] is ai_agent.BILL_SCHEMA
    # Deprecated or unsupported by current models:
    assert "max_tokens" not in call and "temperature" not in call


def test_default_model_is_current():
    assert ai_agent.OPENAI_MODEL != "gpt-3.5-turbo"


def test_schema_is_valid_for_strict_mode():
    # Strict mode: every object lists all its properties as required and allows no others.
    def check(node):
        if node.get("type") == "object":
            assert node["additionalProperties"] is False
            assert set(node["required"]) == set(node["properties"])
            for child in node["properties"].values():
                check(child)
        if node.get("type") == "array":
            check(node["items"])
    check(ai_agent.BILL_SCHEMA)


def test_empty_reply_is_an_invalid_response(monkeypatch, tmp_path):
    resp, _ = _post(monkeypatch, tmp_path, None)  # e.g. the model refused

    assert resp.status_code == 502
    assert resp.get_json()["processingStatus"] == "error_ai_invalid_response"


def test_null_daily_average_falls_back_to_kwh_over_30(monkeypatch, tmp_path):
    resp, _ = _post(monkeypatch, tmp_path, GOOD)

    assert round(resp.get_json()["analysis_data"]["averageDaily"], 2) == round(245 / 30, 2)


def test_daily_average_uses_the_real_billing_period():
    assert ai_agent.daily_average({"consumptionKwh": 245, "billingDays": 31}) == round(245 / 31, 2)
    assert ai_agent.daily_average({"consumptionKwh": 245, "billingDays": 61}) == round(245 / 61, 2)


def test_daily_average_uses_the_bills_own_figure_without_dates():
    assert ai_agent.daily_average({"consumptionKwh": 245, "billingDays": None, "averageDaily": 8.1}) == 8.1


def test_daily_average_ignores_impossible_periods():
    assert ai_agent.daily_average({"consumptionKwh": 300, "billingDays": 0}) == 10.0
    assert ai_agent.daily_average({"consumptionKwh": 300, "billingDays": 5000}) == 10.0
