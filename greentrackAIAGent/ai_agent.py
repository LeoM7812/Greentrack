from flask import Flask, request, jsonify
import fitz  # PyMuPDF
import os
import requests

app = Flask(__name__)

OLLAMA_API_URL = "http://localhost:11434/api/chat"
MODEL = "qwen"

# 📄 Extract text from PDF
def extract_text_from_pdf(pdf_path):
    doc = fitz.open(pdf_path)
    text = ""
    for page in doc:
        text += page.get_text()
    return text

@app.route("/ai/suggestions", methods=["POST"])
def get_energy_suggestions():
    if 'file' not in request.files:
        return jsonify({"error": "Missing PDF file"}), 400

    file = request.files['file']
    if file.filename == "":
        return jsonify({"error": "Filename is empty"}), 400

    try:
        file_path = os.path.join("uploads", file.filename)
        os.makedirs("uploads", exist_ok=True)
        file.save(file_path)

        # Extract text from invoice
        invoice_text = extract_text_from_pdf(file_path)

        # Build prompt
        prompt = f"""
You are a smart energy consultant.

Your task is to analyze the electricity bill below and provide detailed suggestions to help reduce electricity consumption and lower costs.

Specifically:

- Detect if the client is on a Simple or Dual tariff.
- Identify peak consumption times and suggest shifting usage to cheaper periods if applicable.
- Evaluate if the contracted power (kVA) seems excessive or insufficient.
- Mention if any charges (e.g., network access fees) appear unusually high.
- Suggest changing supplier or plan if the current one seems expensive.
- Finally, include general sustainability and efficiency suggestions (e.g., LED lights, insulation).

### Electricity Invoice:
{invoice_text}

Provide your answer in clear bullet points grouped by category (e.g., "Tariff Advice", "Consumption Patterns", "Sustainability").
"""

        # Call Ollama locally
        payload = {
            "model": MODEL,
            "messages": [
                {"role": "user", "content": prompt}
            ],
            "stream": False
        }

        response = requests.post(OLLAMA_API_URL, json=payload)

        if response.status_code != 200:
            return jsonify({"error": f"Ollama API error: {response.status_code} - {response.text}"}), response.status_code

        data = response.json()
        suggestions = data["message"]["content"]

        return jsonify({"suggestions": suggestions})

    except Exception as e:
        return jsonify({"error": str(e)}), 500


if __name__ == "__main__":
    app.run(port=5000, debug=True)
