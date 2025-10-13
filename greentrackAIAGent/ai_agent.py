from flask import Flask, request, jsonify
import fitz  # PyMuPDF
import os
import openai
from PIL import Image
import pytesseract
import io

app = Flask(__name__)

# Configura a chave da OpenAI via variável de ambiente
openai.api_key = os.getenv("OPENAI_API_KEY", "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")

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
    import re
    numbers = re.findall(r'\d+', text)
    if len(numbers) < 5:
        return False, "Poucos números detectados no texto"
    
    return True, f"Fatura parece legível (encontradas {len(found_keywords)} palavras-chave)"

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

@app.route("/ai/suggestions", methods=["POST"])
def get_energy_suggestions():
    if 'file' not in request.files:
        return jsonify({"error": "Arquivo não encontrado"}), 400

    file = request.files['file']
    if file.filename == "":
        return jsonify({"error": "Nome do arquivo vazio"}), 400

    try:
        # Criar diretório uploads se não existir
        os.makedirs("uploads", exist_ok=True)
        file_path = os.path.join("uploads", file.filename)
        file.save(file_path)

        # Extrair texto baseado no tipo de arquivo
        invoice_text = ""
        file_extension = os.path.splitext(file.filename)[1].lower()
        
        if file_extension == '.pdf':
            invoice_text = extract_text_from_pdf(file_path)
        elif file_extension in ['.jpg', '.jpeg', '.png', '.tiff', '.bmp']:
            invoice_text = extract_text_from_image(file_path)
        else:
            return jsonify({"error": "Formato de arquivo não suportado. Use PDF ou imagem."}), 400

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

        # Prompt otimizado para extração de dados específicos
        prompt = f"""
Extrair dados específicos da fatura de eletricidade em formato JSON.

INSTRUÇÕES:
1. Analisar o texto da fatura abaixo
2. Extrair os dados solicitados
3. Retornar APENAS um JSON válido (sem texto adicional)

DADOS A EXTRAIR:
- period: período da fatura (ex: "Janeiro 2024", "Jan/2024")
- consumptionKwh: consumo total em kWh (apenas número)
- totalAmount: valor total em euros (apenas número)
- tariffType: "simples", "bi-horaria", "tri-horaria" ou "desconhecido"
- contractedPower: potência contratada em kVA (número)
- averageDaily: consumo médio diário (número)

EXEMPLO DO JSON A RETORNAR:
{{
  "period": "Janeiro 2024",
  "consumptionKwh": 250.5,
  "totalAmount": 89.47,
  "tariffType": "simples",
  "contractedPower": 6.9,
  "averageDaily": 8.3,
  "suggestions": [
    {{
      "category": "tarifa",
      "title": "Considere tarifa bi-horária",
      "description": "Com o seu perfil de consumo, uma tarifa bi-horária pode resultar em poupanças significativas",
      "priority": "alta",
      "potentialSaving": 15.0
    }}
  ],
  "insights": {{
    "peakConsumptionHours": "Entre 18h-22h",
    "highestCosts": "Taxa de acesso às redes"
  }}
}}

TEXTO DA FATURA:
{invoice_text}

IMPORTANTE: Responder APENAS com JSON válido. Se não conseguir extrair algum dado, usar valor padrão (0 para números, "desconhecido" para strings).
"""

        # Chamada à OpenAI
        response = openai.chat.completions.create(
            model="gpt-3.5-turbo",  # Modelo mais estável
            messages=[{"role": "user", "content": prompt}],
            temperature=0.3,  # Mais baixo para dados estruturados
            max_tokens=1200
        )

        ai_response = response.choices[0].message.content
        print(f"Resposta da OpenAI: {ai_response}")
        
        try:
            # Tentar parsear como JSON
            import json
            analysis_data = json.loads(ai_response)
            
            # Validar campos obrigatórios
            required_fields = ['period', 'consumptionKwh', 'totalAmount', 'tariffType', 'contractedPower']
            for field in required_fields:
                if field not in analysis_data:
                    print(f"Campo obrigatório ausente: {field}")
                    raise ValueError(f"Campo {field} não encontrado")
            
            # Calcular média diária se não fornecida
            if 'averageDaily' not in analysis_data:
                analysis_data['averageDaily'] = analysis_data['consumptionKwh'] / 30
            
            # Garantir que suggestions existe
            if 'suggestions' not in analysis_data:
                analysis_data['suggestions'] = []
            
            # Transformar para o formato esperado pelo backend
            suggestions_list = []
            for suggestion in analysis_data.get('suggestions', []):
                if isinstance(suggestion, dict):
                    title = suggestion.get('title', '')
                    description = suggestion.get('description', '')
                    category = suggestion.get('category', '')
                    priority = suggestion.get('priority', 'media')
                    saving = suggestion.get('potentialSaving', 0)
                    
                    # Formatar sugestão como string para compatibilidade
                    formatted = f"[{category.upper()}] {title}: {description}"
                    if saving > 0:
                        formatted += f" (Poupança: €{saving:.2f}/mês)"
                    suggestions_list.append(formatted)
                else:
                    suggestions_list.append(str(suggestion))
            
            result = {
                "suggestions": suggestions_list,
                "analysis_data": analysis_data  # Dados estruturados para o frontend
            }
            
        except (json.JSONDecodeError, ValueError) as e:
            print(f"Erro ao parsear JSON da OpenAI: {e}")
            print(f"Resposta recebida: {ai_response}")
            
            # Fallback: dividir as sugestões em lista
            suggestions_list = [s.strip() for s in ai_response.split('\n') if s.strip() and not s.strip().startswith('#')]
            if not suggestions_list:
                suggestions_list = [ai_response]  # Usar resposta completa como única sugestão
            
            result = {
                "suggestions": suggestions_list,
                "analysis_data": {
                    "period": "Período não identificado",
                    "consumptionKwh": 0,
                    "totalAmount": 0,
                    "averageDaily": 0,
                    "tariffType": "desconhecido",
                    "contractedPower": 0,
                    "suggestions": [],
                    "insights": {}
                }
            }
        
        # Limpar o arquivo após processamento
        try:
            os.remove(file_path)
        except:
            pass

        return jsonify(result)

    except Exception as e:
        print(f"Erro no processamento: {e}")
        # Retornar sugestões padrão em caso de erro
        return jsonify({
            "suggestions": [
                "💡 Substitua lâmpadas incandescentes por LED para poupar até 80% na iluminação",
                "🏠 Verifique o isolamento da sua casa para reduzir gastos com aquecimento/arrefecimento",
                "⚡ Considere mudar para tarifa bi-horária se tem flexibilidade nos horários de consumo",
                "🔌 Desligue aparelhos em standby para evitar consumos fantasma",
                "💰 Compare fornecedores de energia para encontrar tarifas mais competitivas"
            ],
            "analysis_data": {
                "period": "Período não identificado",
                "consumptionKwh": 250,
                "totalAmount": 85.50,
                "averageDaily": 8.3,
                "tariffType": "desconhecido",
                "contractedPower": 6.9,
                "suggestions": [],
                "insights": {
                    "peakConsumptionHours": "Dados não disponíveis",
                    "highestCosts": "Não foi possível identificar"
                }
            }
        }), 200

@app.route("/health", methods=["GET"])
def health_check():
    return jsonify({"status": "OK", "message": "AI Agent funcionando"})

if __name__ == "__main__":
    app.run(port=5000, debug=True)
