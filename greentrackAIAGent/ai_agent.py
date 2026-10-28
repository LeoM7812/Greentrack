from flask import Flask, request, jsonify
import pymupdf as fitz  # PyMuPDF (o nome "fitz" está obsoleto)
import os
import openai
from PIL import Image
import pytesseract
import io
import json
import re
import uuid
from werkzeug.utils import secure_filename

import erse

app = Flask(__name__)

# Configura a chave da OpenAI via variável de ambiente
openai.api_key = os.getenv("OPENAI_API_KEY")
if not openai.api_key:
    raise RuntimeError("OPENAI_API_KEY is not set. Copy .env.example and export the variable before running.")

# 📄 Função para extrair texto do PDF
def extract_text_from_pdf(pdf_path):
    try:
        doc = fitz.open(pdf_path)
        text = ""
        for page in doc:
            text += page.get_text()
        doc.close()
        return text
    except Exception as e:
        print(f"Erro ao extrair texto do PDF: {e}")
        return ""

# 🖼️ Função para extrair texto de imagem (OCR)
def extract_text_from_image(image_path):
    try:
        image = Image.open(image_path)
        text = pytesseract.image_to_string(image, lang='por')
        return text
    except Exception as e:
        print(f"Erro ao extrair texto da imagem: {e}")
        return ""

# 🔍 Função para verificar legibilidade da fatura
def check_invoice_readability(text):
    """Verificar se o texto extraído parece ser de uma fatura de eletricidade legível"""
    if not text or len(text.strip()) < 50:
        return False, "Texto muito curto ou vazio"
    
    # Palavras-chave que devem estar presentes numa fatura de eletricidade
    electricity_keywords = [
        'kwh', 'energia', 'eletricidade', 'consumo', 'fatura', 'factura',
        'edp', 'endesa', 'galp', 'tarifa', 'potência', 'valor', 'total',
        'período', 'leitura', 'contador', 'distribuição', 'comercialização'
    ]
    
    text_lower = text.lower()
    found_keywords = [keyword for keyword in electricity_keywords if keyword in text_lower]
    
    if len(found_keywords) < 2:
        return False, f"Texto não parece ser de fatura de eletricidade (palavras encontradas: {found_keywords})"
    
    # Verificar se há números suficientes (valores, consumo, etc)
    numbers = re.findall(r'\d+', text)
    if len(numbers) < 5:
        return False, "Poucos números detectados no texto"
    
    return True, f"Fatura parece legível (encontradas {len(found_keywords)} palavras-chave)"

# 🔒 Dados pessoais nunca saem do servidor: a IA só precisa de consumos, valores e tarifa.
PERSONAL_DATA_PATTERNS = [
    # Código do ponto de entrega (CPE): PT + 16 dígitos + 2 letras
    (re.compile(r'\bPT\s?(?:\d\s?){16}[A-Z]{2}\b'), '[CPE]'),
    (re.compile(r'\bPT\d{2}(?:\s?\d){21}\b'), '[IBAN]'),
    (re.compile(r'[\w.+-]+@[\w-]+\.[\w.-]+'), '[EMAIL]'),
    # NIF, telefone, n.º de cliente ou de contrato: 9 dígitos soltos (não apanha valores nem kWh)
    (re.compile(r'(?<![\d.,])(?:\+351\s?)?\d{3}\s?\d{3}\s?\d{3}(?![\d.,])'), '[NÚMERO]'),
    # Código postal e localidade
    (re.compile(r'\b\d{4}-\d{3}\b.*'), '[CÓDIGO POSTAL]'),
    # Linhas com nome ou morada do cliente
    (re.compile(r'(?im)^(\s*(?:nome|cliente|titular|morada|endere[cç]o)\b[^:\n]*:?).*$'), r'\1 [REMOVIDO]'),
]


def redact_personal_data(text):
    for pattern, replacement in PERSONAL_DATA_PATTERNS:
        text = pattern.sub(replacement, text)
    return text


@app.route("/ai/test-analysis", methods=["GET"])
def test_analysis():
    """Endpoint de teste que retorna dados estruturados mock"""
    try:
        mock_analysis = {
            "suggestions": [
                "[TARIFA] Mude para tarifa bi-horária: Com seu perfil de consumo, pode poupar até €12/mês (Poupança: €12.00/mês)",
                "[CONSUMO] Reduza standby: Desligue aparelhos em standby para poupar €8/mês (Poupança: €8.00/mês)", 
                "[SUSTENTABILIDADE] Lâmpadas LED: Substitua todas as lâmpadas por LED (Poupança: €5.00/mês)"
            ],
            "analysis_data": {
                "period": "Janeiro 2024",
                "consumptionKwh": 245.5,
                "totalAmount": 89.47,
                "tariffType": "simples",
                "contractedPower": 6.9,
                "averageDaily": 7.9,
                "suggestions": [
                    {
                        "category": "tarifa",
                        "title": "Mude para tarifa bi-horária",
                        "description": "Com seu perfil de consumo, pode poupar até €12/mês",
                        "priority": "alta",
                        "potentialSaving": 12.0
                    },
                    {
                        "category": "consumo", 
                        "title": "Reduza standby",
                        "description": "Desligue aparelhos em standby para poupar €8/mês",
                        "priority": "media",
                        "potentialSaving": 8.0
                    }
                ],
                "insights": {
                    "peakConsumptionHours": "Entre 18h-22h detectado maior consumo",
                    "highestCosts": "Taxa de acesso às redes representa 45% da fatura"
                }
            }
        }
        
        return jsonify(mock_analysis)
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

REQUIRED_FIELDS = ['period', 'consumptionKwh', 'totalAmount', 'tariffType', 'contractedPower']

# Modelo da OpenAI: muda-se sem tocar no código (OPENAI_MODEL no .env).
OPENAI_MODEL = os.getenv("OPENAI_MODEL", "gpt-5.4-mini")

# Saída estruturada: a OpenAI só pode responder com um JSON neste formato.
NUMBER_OR_NULL = {"type": ["number", "null"]}
STRING_OR_NULL = {"type": ["string", "null"]}
BILL_SCHEMA = {
    "type": "object",
    "additionalProperties": False,
    "required": ["period", "consumptionKwh", "totalAmount", "tariffType", "contractedPower",
                 "billingDays", "offPeakKwh", "averageDaily", "suggestions", "insights"],
    "properties": {
        "period": {"type": "string"},
        "consumptionKwh": {"type": "number"},
        "totalAmount": {"type": "number"},
        "tariffType": {"type": "string", "enum": ["simples", "bi-horaria", "tri-horaria", "desconhecido"]},
        "contractedPower": {"type": "number"},
        "billingDays": {"type": ["integer", "null"]},
        "offPeakKwh": NUMBER_OR_NULL,
        "averageDaily": NUMBER_OR_NULL,
        "suggestions": {
            "type": "array",
            "items": {
                "type": "object",
                "additionalProperties": False,
                "required": ["category", "title", "description", "priority", "potentialSaving"],
                "properties": {
                    "category": {"type": "string", "enum": ["tarifa", "consumo", "sustentabilidade", "fornecedor"]},
                    "title": {"type": "string"},
                    "description": {"type": "string"},
                    "priority": {"type": "string", "enum": ["alta", "media", "baixa"]},
                    "potentialSaving": NUMBER_OR_NULL,
                },
            },
        },
        "insights": {
            "type": "object",
            "additionalProperties": False,
            "required": ["peakConsumptionHours", "highestCosts"],
            "properties": {"peakConsumptionHours": STRING_OR_NULL, "highestCosts": STRING_OR_NULL},
        },
    },
}
SUPPORTED_EXTENSIONS = {'.pdf', '.jpg', '.jpeg', '.png', '.tiff', '.bmp'}


def error_response(status_code, processing_status, message):
    """Explicit failure. Never return bill numbers we did not read from the bill."""
    return jsonify({
        "processingStatus": processing_status,
        "error": message,
        "suggestions": [],
    }), status_code


def daily_average(data):
    """kWh por dia no período real da fatura; 30 dias só se a fatura não tiver datas nem média."""
    kwh = data.get('consumptionKwh') or 0
    days = data.get('billingDays')
    if isinstance(days, int) and 0 < days <= 366:
        return round(kwh / days, 2)
    if data.get('averageDaily'):
        return data['averageDaily']
    return round(kwh / 30, 2)


def format_suggestions(suggestions):
    formatted_list = []
    for suggestion in suggestions:
        if isinstance(suggestion, dict):
            category = suggestion.get('category', '')
            title = suggestion.get('title', '')
            description = suggestion.get('description', '')
            saving = suggestion.get('potentialSaving', 0) or 0
            formatted = f"[{category.upper()}] {title}: {description}"
            if saving > 0:
                formatted += f" (Poupança: €{saving:.2f}/mês)"
            formatted_list.append(formatted)
        else:
            formatted_list.append(str(suggestion))
    return formatted_list


def supplier_comparison(data):
    """Ofertas mais baratas da ERSE para esta fatura; nunca faz falhar a análise."""
    try:
        prices, conditions = erse.load(erse.download())
        return erse.compare(prices, conditions, data.get('contractedPower'), data.get('tariffType'),
                            data.get('consumptionKwh'), data.get('billingDays'),
                            total_paid=data.get('totalAmount'), off_peak_kwh=data.get('offPeakKwh'))
    except Exception as e:  # ERSE em baixo, ficheiro mudou de formato...
        print(f"Comparação da ERSE indisponível: {e}")
        return {"offers": [], "reason": "A comparação com os preços da ERSE não está disponível agora."}


@app.route("/ai/suggestions", methods=["POST"])
def get_energy_suggestions():
    if 'file' not in request.files:
        return jsonify({"error": "Arquivo não encontrado"}), 400

    file = request.files['file']
    if file.filename == "":
        return jsonify({"error": "Nome do arquivo vazio"}), 400

    file_extension = os.path.splitext(secure_filename(file.filename))[1].lower()
    if file_extension not in SUPPORTED_EXTENSIONS:
        return jsonify({"error": "Formato de arquivo não suportado. Use PDF ou imagem."}), 400

    # Never trust the client's filename for the path on disk.
    os.makedirs("uploads", exist_ok=True)
    file_path = os.path.join("uploads", f"{uuid.uuid4().hex}{file_extension}")
    file.save(file_path)

    try:
        if file_extension == '.pdf':
            invoice_text = extract_text_from_pdf(file_path)
        else:
            invoice_text = extract_text_from_image(file_path)

        if not invoice_text.strip():
            return jsonify({
                "suggestions": ["⚠️ Não foi possível extrair texto do arquivo. Verifique se a qualidade da imagem ou PDF está boa."],
                "processingStatus": "error_no_text"
            }), 200

        # 🔍 Verificar se a fatura é legível
        is_readable, readability_message = check_invoice_readability(invoice_text)
        print(f"Verificação de legibilidade: {readability_message}")

        if not is_readable:
            return jsonify({
                "suggestions": [
                    f"⚠️ FATURA NÃO LEGÍVEL: {readability_message}",
                    "💡 Dica: Tente uma imagem com melhor qualidade ou resolução",
                    "📄 Alternativa: Use um PDF em vez de foto se possível"
                ],
                "processingStatus": "warning_unreadable",
                "readabilityCheck": readability_message
            }), 200

        prompt = f"""
Extrair os dados desta fatura de eletricidade portuguesa.

- period: período da fatura (ex: "Janeiro 2024", "Jan/2024")
- consumptionKwh: consumo total em kWh
- totalAmount: valor total a pagar em euros
- tariffType: "simples", "bi-horaria", "tri-horaria" ou "desconhecido"
- contractedPower: potência contratada em kVA
- billingDays: número de dias do período de faturação (ex: de 01/01 a 31/01 são 31 dias); null se não houver datas
- offPeakKwh: consumo em vazio em kWh, se a fatura o separar (bi-horária); senão null
- averageDaily: consumo médio diário em kWh, se a fatura o indicar; senão null
- suggestions: dicas concretas para este cliente poupar; potentialSaving sempre null (a poupança por mudar de comercializador é calculada à parte, com os preços da ERSE)
- insights: horas de maior consumo e o que mais pesa na fatura, se a fatura o indicar; senão null

Usar só valores que estão na fatura. Se um número não estiver na fatura, usar 0.

TEXTO DA FATURA:
{redact_personal_data(invoice_text)}
"""

        try:
            response = openai.chat.completions.create(
                model=OPENAI_MODEL,
                messages=[{"role": "user", "content": prompt}],
                response_format={
                    "type": "json_schema",
                    "json_schema": {"name": "fatura_eletricidade", "strict": True, "schema": BILL_SCHEMA},
                },
                max_completion_tokens=4000,  # inclui os tokens de raciocínio dos modelos recentes
            )
            ai_response = response.choices[0].message.content
        except Exception as e:  # network, auth, rate limit, timeout...
            print(f"Erro na chamada à OpenAI: {e}")
            return error_response(502, "error_ai_unavailable",
                                  "O serviço de análise não está disponível. Tente novamente mais tarde.")

        try:
            if not ai_response:  # recusa ou resposta cortada
                raise ValueError("Resposta vazia")
            analysis_data = json.loads(ai_response)
            if not isinstance(analysis_data, dict):
                raise ValueError("Resposta não é um objeto JSON")
            missing = [field for field in REQUIRED_FIELDS if field not in analysis_data]
            if missing:
                raise ValueError(f"Campos obrigatórios em falta: {missing}")
        except (json.JSONDecodeError, ValueError) as e:
            print(f"Resposta inválida da OpenAI: {e}")
            return error_response(502, "error_ai_invalid_response",
                                  "Não foi possível analisar esta fatura. Tente novamente ou use outro ficheiro.")

        analysis_data['averageDaily'] = daily_average(analysis_data)
        analysis_data.setdefault('suggestions', [])
        # Poupanças em euros só com preços reais: a IA não os tem, por isso nunca mostramos as dela.
        for suggestion in analysis_data['suggestions']:
            if isinstance(suggestion, dict):
                suggestion['potentialSaving'] = None

        analysis_data['supplierComparison'] = supplier_comparison(analysis_data)

        return jsonify({
            "processingStatus": "success",
            "suggestions": format_suggestions(analysis_data['suggestions']),
            "analysis_data": analysis_data,
        })

    except Exception as e:
        print(f"Erro no processamento: {e}")
        return error_response(500, "error_internal", "Erro interno ao processar a fatura.")

    finally:
        try:
            os.remove(file_path)
        except OSError:
            pass

@app.route("/health", methods=["GET"])
def health_check():
    return jsonify({"status": "OK", "message": "AI Agent funcionando"})

if __name__ == "__main__":
    app.run(port=int(os.getenv("PORT", "5000")), debug=os.getenv("FLASK_DEBUG") == "1")
