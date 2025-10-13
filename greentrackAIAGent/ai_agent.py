from flask import Flask, request, jsonify
import fitz  # PyMuPDF
import os
import openai
from PIL import Image
import pytesseract
import io
import json

app = Flask(__name__)

# 🔑 Configuração da API da OpenAI
openai.api_key = os.getenv("OPENAI_API_KEY", "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")

# ===============================
# 📄 EXTRAÇÃO DE TEXTO
# ===============================
def extract_text_from_pdf(pdf_path):
    """Extrai texto de PDF, com fallback para OCR se necessário."""
    text = ""
    try:
        doc = fitz.open(pdf_path)
        for page in doc:
            text += page.get_text("text")  # força modo texto
        doc.close()

        if text.strip():
            print(f"✅ Texto extraído diretamente do PDF ({len(text)} caracteres)")
            return text

        # Se não houver texto visível, tenta OCR
        print("⚠️ Nenhum texto encontrado — executando OCR nas páginas...")
        doc = fitz.open(pdf_path)
        for page in doc:
            pix = page.get_pixmap()
            img_bytes = pix.tobytes("png")
            img = Image.open(io.BytesIO(img_bytes))
            text += pytesseract.image_to_string(img, lang='por')
        doc.close()

        print(f"✅ Texto extraído via OCR ({len(text)} caracteres)")
        return text
    except Exception as e:
        print(f"❌ Erro ao extrair texto: {e}")
        return ""

def extract_text_from_image(image_path):
    """Extrai texto diretamente de uma imagem usando OCR."""
    try:
        image = Image.open(image_path)
        text = pytesseract.image_to_string(image, lang='por')
        print(f"✅ Texto extraído da imagem ({len(text)} caracteres)")
        return text
    except Exception as e:
        print(f"❌ Erro ao extrair texto da imagem: {e}")
        return ""

# ===============================
# 🔍 VERIFICAÇÃO DE LEGIBILIDADE
# ===============================
def check_invoice_readability(text):
    if not text or len(text.strip()) < 50:
        return False, "Texto muito curto ou vazio"

    keywords = [
        'kwh', 'energia', 'eletricidade', 'consumo', 'fatura', 'factura',
        'edp', 'endesa', 'galp', 'tarifa', 'potência', 'valor', 'total',
        'período', 'leitura', 'contador', 'distribuição', 'comercialização'
    ]
    text_lower = text.lower()
    found = [k for k in keywords if k in text_lower]

    if len(found) < 2:
        return False, f"Poucas palavras relacionadas encontradas ({found})"

    import re
    if len(re.findall(r'\d+', text)) < 5:
        return False, "Poucos números detectados"

    return True, f"Fatura legível ({len(found)} palavras relevantes)"

# ===============================
# ⚙️ ENDPOINTS
# ===============================
@app.route("/health", methods=["GET"])
def health():
    return jsonify({"status": "OK", "message": "AI Agent ativo e funcional"})

@app.route("/ai/suggestions", methods=["POST"])
def get_energy_suggestions():
    if 'file' not in request.files:
        return jsonify({"error": "Nenhum arquivo enviado"}), 400

    file = request.files['file']
    if file.filename == "":
        return jsonify({"error": "Nome de arquivo inválido"}), 400

    os.makedirs("uploads", exist_ok=True)
    file_path = os.path.join("uploads", file.filename)
    file.save(file_path)

    ext = os.path.splitext(file.filename)[1].lower()
    text = ""
    if ext == '.pdf':
        text = extract_text_from_pdf(file_path)
    elif ext in ['.png', '.jpg', '.jpeg']:
        text = extract_text_from_image(file_path)
    else:
        return jsonify({"error": "Formato não suportado"}), 400

    if not text.strip():
        return jsonify({
            "processingStatus": "error_no_text",
            "suggestions": ["⚠️ Não foi possível extrair texto do arquivo. Verifique se o PDF tem texto ou tente outro formato."]
        }), 200

    # Verificar legibilidade
    readable, msg = check_invoice_readability(text)
    print(f"📘 Verificação: {msg}")
    if not readable:
        return jsonify({
            "processingStatus": "warning_unreadable",
            "suggestions": [
                f"⚠️ Fatura possivelmente ilegível: {msg}",
                "💡 Tente reenviar um PDF com texto pesquisável ou de melhor qualidade."
            ]
        }), 200

    # ===============================
    # 🧠 Interação com OpenAI
    # ===============================
    prompt = f"""
Analisa a fatura de eletricidade abaixo e devolve os dados em formato JSON:
- period
- consumptionKwh
- totalAmount
- tariffType
- contractedPower
- averageDaily
- suggestions[] (máx. 3)
- insights{{}}

TEXTO DA FATURA:
{text}

Apenas responde com JSON válido.
"""

    try:
        response = openai.chat.completions.create(
            model="gpt-4o-mini",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.3,
            max_tokens=1000,
            response_format={ "type": "json_object" }
        )
        ai_response = response.choices[0].message.content.strip()
        print(f"🧾 Resposta da OpenAI:\n{ai_response}...")

        # 💡 LIMPEZA ROBUSTA: Encontrar e isolar apenas o JSON
        # Remove o delimitador de código Markdown, se presente
        json_string = ai_response.removeprefix("```json").removesuffix("```").strip()
        
        # Garante que começa e termina com as chaves JSON, cortando lixo externo
        start_index = json_string.find('{')
        end_index = json_string.rfind('}')
        
        if start_index != -1 and end_index != -1 and end_index > start_index:
            # Extrai apenas o conteúdo entre a primeira '{' e a última '}'
            final_json_string = json_string[start_index : end_index + 1]
        else:
            raise json.JSONDecodeError("JSON delimiters not found after cleaning.", json_string, 0)
            
        data = json.loads(final_json_string) # Usa a string JSON limpa
        result = {
            "processingStatus": "ok",
            "suggestions": [s if isinstance(s, str) else s.get("description", "") for s in data.get("suggestions", [])],
            "analysis_data": data
        }
        return jsonify(result)

    except Exception as e:
        print(f"❌ Erro ao processar com OpenAI: {e}")
        return jsonify({
            "processingStatus": "fallback",
            "suggestions": [
                "💡 Substitua lâmpadas incandescentes por LED",
                "⚡ Evite horários de pico para reduzir custos",
                "🏠 Verifique isolamento térmico da sua casa"
            ],
            "analysis_data": {
                "period": "Indefinido",
                "consumptionKwh": 0,
                "totalAmount": 0,
                "tariffType": "desconhecido",
                "contractedPower": 0,
                "averageDaily": 0,
                "insights": {}
            }
        }), 200

    finally:
        try:
            os.remove(file_path)
        except:
            pass

# ===============================
# 🚀 MAIN
# ===============================
if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
