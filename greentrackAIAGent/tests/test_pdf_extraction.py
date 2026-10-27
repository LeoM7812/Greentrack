"""Real PDF text extraction (no mocks), so a PyMuPDF upgrade can't break it silently."""
import pymupdf

import ai_agent


def test_extracts_text_from_a_real_pdf(tmp_path):
    path = tmp_path / "fatura.pdf"
    doc = pymupdf.open()
    doc.new_page().insert_text((72, 72), "Fatura de eletricidade. Consumo 245 kWh. Valor total 89.47 EUR.")
    doc.save(path)
    doc.close()

    text = ai_agent.extract_text_from_pdf(str(path))

    assert "Consumo 245 kWh" in text
    assert "89.47 EUR" in text
