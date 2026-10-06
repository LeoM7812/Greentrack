<div align="center">

# ⚡ GreenTrack

**Understand your electricity bill in seconds, and find out how much you could save.**

🏆 **Winner, Fundação EDP "Escola da Energia" university competition (2026)**

[Press coverage (Diário de Coimbra)](https://www.diariocoimbra.pt/2026/05/08/alunos-do-isec-premiados-pela-escola-de-energia/)

</div>

---

## The problem

Most people pay their electricity bill without really reading it. Tariff types, contracted power, kWh and taxes make bills hard to understand, so households rarely know whether they are on the right plan, whether their consumption is going up, or whether another energy company would be cheaper.

## The solution

GreenTrack is a mobile app that turns an electricity bill into clear, actionable information. The user uploads a bill (PDF or a photo) and the app:

1. **Reads the bill automatically**: extracts the billing period, consumption (kWh), total amount, tariff type and contracted power using text extraction, OCR and AI.
2. **Explains the consumption**: shows a dashboard with daily average, cost breakdown and the change in consumption and cost versus the previous month.
3. **Compares energy companies**: compares what the user pays with the prices offered by other energy companies, and shows how much they could save by switching.
4. **Recommends concrete actions**: generates personalised tips grouped by tariff, consumption, sustainability and supplier, each with an estimated monthly saving.

## Impact

GreenTrack was built by a team of four students at ISEC (Polytechnic of Coimbra) in partnership with Fundação EDP, and was one of the winning projects of the Escola da Energia university competition.

We ran a field test in Coimbra, talking directly with residents to measure the app's real-world impact:

> **95%** of users surveyed said GreenTrack could change their energy habits.

## Features

| | |
|---|---|
| 📄 **Bill upload** | PDF or photo, straight from the phone |
| 🔍 **Smart extraction** | PyMuPDF for digital PDFs, Tesseract OCR for photos and scans |
| 🤖 **AI analysis** | LLM turns raw bill text into structured data and insights |
| 💶 **Energy company comparison** | What you pay today vs. other energy companies' prices, with estimated savings |
| 📈 **Month-over-month tracking** | Consumption and cost trends between bills |
| 💡 **Personalised tips** | Actionable recommendations with estimated monthly savings |
| 🔐 **Accounts** | Registration and login secured with JWT |

## Architecture

```
┌────────────────────┐      ┌──────────────────────────┐      ┌─────────────────────────────┐
│  Mobile app        │      │  API                     │      │  AI service                 │
│  React Native/Expo │ ───► │  Spring Boot · JWT       │ ───► │  Flask                      │
│  TypeScript        │      │  PostgreSQL              │      │  PyMuPDF · Tesseract · LLM  │
└────────────────────┘      └──────────────────────────┘      └─────────────────────────────┘
```

| Folder | Responsibility | Stack |
|---|---|---|
| `frontend/` | Mobile app: auth, bill upload, analysis dashboard | React Native, Expo, TypeScript |
| `backend/` | REST API, users, authentication, orchestration | Java 17, Spring Boot, Spring Security, JPA, PostgreSQL |
| `greentrackAIAGent/` | Bill parsing, OCR, AI analysis and recommendations | Python, Flask, PyMuPDF, Tesseract, OpenAI API |

## Running locally

**Prerequisites:** Java 17+, Node.js 18+, Python 3.8+, PostgreSQL, Tesseract OCR.

Each service is configured through environment variables. See the `.env.example` file in each folder.

**1. AI service**
```bash
cd greentrackAIAGent
pip install -r requirements.txt
export OPENAI_API_KEY=sk-...
python ai_agent.py                 # http://localhost:5000
```

**2. Backend**
```bash
cd backend
export DB_PASSWORD=... JWT_SECRET=...
./mvnw spring-boot:run             # http://localhost:8080
```

**3. Mobile app**
```bash
cd frontend
npm install
EXPO_PUBLIC_API_URL=http://<your-LAN-IP>:8080 npx expo start
```

## Tests

The AI service has regression tests for its failure modes (AI unavailable, invalid model output, unsafe filenames). They run on every push via GitHub Actions.

```bash
cd greentrackAIAGent
pip install -r requirements.txt -r requirements-dev.txt
pytest -q tests
```

## Roadmap

- Gas and water bills, for a complete view of household consumption
- Integration with smart meters and devices for real-time monitoring
- Automatic alerts when another energy company offers a cheaper price

## Team

Built by a team of four students at ISEC, Polytechnic of Coimbra. Team lead: **Leonardo Marques** ([LinkedIn](https://www.linkedin.com/in/leonardo-marques-2a1502250)).
