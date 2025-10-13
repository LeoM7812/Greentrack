# 📤 Funcionalidade de Upload de Faturas - Greentrack

## ✅ O que foi implementado

### 🎯 Frontend (React Native)
- **Botão "Carregar Nova Fatura"** totalmente funcional
- **Seleção de arquivos** usando `expo-document-picker`
- **Upload** para backend com indicador de progresso
- **Tratamento de erros** com mensagens claras
- **Suporte para PDF e imagens** (JPG, PNG, etc.)

### ⚙️ Backend (Spring Boot)
- **Endpoint `/api/invoice/upload`** para receber arquivos
- **Configuração multipart** para uploads até 10MB
- **Integração com AI Agent** via HTTP
- **Autenticação JWT** para segurança
- **Tratamento de erros** robusto

### 🤖 AI Agent (Python + OpenAI)
- **Extração de texto** de PDFs (PyMuPDF)
- **OCR para imagens** (Tesseract)
- **Análise inteligente** usando OpenAI GPT
- **Sugestões em português** específicas para Portugal
- **Fallback** com sugestões padrão se houver erro

## 🚀 Como configurar e testar

### 1. 📋 Pré-requisitos
```bash
# Java 17+ instalado
# Node.js 18+ instalado  
# Python 3.8+ instalado
# PostgreSQL rodando (para backend completo)
```

### 2. 🔧 Configurar AI Agent
```bash
cd greentrackAIAGent
pip install -r requirements.txt

# Configurar chave OpenAI (opcional - tem fallback)
set OPENAI_API_KEY=sua_chave_aqui

# Iniciar o serviço
python ai_agent.py
```

### 3. 🔧 Configurar Backend
```bash
cd backend

# Iniciar o backend
.\mvnw.cmd spring-boot:run
```

### 4. 🔧 Configurar Frontend
```bash
cd frontend

# Instalar dependências (se necessário)
npm install

# Iniciar o app
npm start
```

### 5. 🧪 Testar a funcionalidade
```bash
# Executar script de teste
python test_upload.py
```

## 📱 Como usar no app

1. **Abrir a tela de Faturas**
2. **Clicar em "Carregar Nova Fatura"**
3. **Selecionar arquivo** (PDF ou imagem da fatura)
4. **Aguardar processamento** (indicador aparece)
5. **Ver sugestões** no popup de resultado

## 🔧 Configurações importantes

### Backend (application.properties)
```properties
# Upload de arquivos
spring.servlet.multipart.enabled=true
spring.servlet.multipart.max-file-size=10MB
spring.servlet.multipart.max-request-size=10MB
```

### Frontend (Invoices.tsx)
```typescript
// URL do backend - ajustar se necessário
const response = await fetch('http://localhost:8080/api/invoice/upload', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'multipart/form-data',
  },
  body: formData,
});
```

## 🐛 Solução de problemas

### ❌ "Erro no upload"
- ✅ Verificar se backend está rodando (porta 8080)
- ✅ Verificar se AI Agent está rodando (porta 5000)
- ✅ Verificar token de autenticação válido

### ❌ "Arquivo não suportado"
- ✅ Usar apenas PDF ou imagens (JPG, PNG)
- ✅ Verificar tamanho do arquivo (máx 10MB)

### ❌ "Não foi possível extrair texto"
- ✅ Verificar qualidade da imagem/PDF
- ✅ Assegurar que o texto está legível
- ✅ Tentar com outro arquivo

## 🎉 Próximos passos

1. **Testar com faturas reais** portuguesas
2. **Melhorar extração de dados específicos** (kWh, valor, período)
3. **Guardar faturas na base de dados** (criar modelo Invoice)
4. **Dashboard com análise temporal** dos consumos
5. **Notificações** para alertas de consumo alto

## 📊 Estrutura de resposta da API

```json
{
  "suggestions": [
    "💡 Substitua lâmpadas incandescentes por LED",
    "🏠 Verifique o isolamento da sua casa",
    "⚡ Considere mudar para tarifa bi-horária"
  ]
}
```

---

**✨ A funcionalidade está 100% implementada e pronta para uso!**