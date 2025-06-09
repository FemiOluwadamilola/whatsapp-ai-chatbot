
# MagFarm - AI-Powered WhatsApp Assistant for Farmers

MagFarm is an AI-powered WhatsApp chatbot built for smallholder farmers. It uses natural language processing, image analysis, and speech recognition to help farmers make better decisions, get instant answers, and manage farm activities using just their phones.

---

## Features

- **AI Chat:** Ask farming-related questions in any supported language or dialect.
- **Voice Notes:** Speak naturally, and MagFarm will transcribe, understand, and respond.
- **Crop Image Diagnosis:** Send images of crops and get disease prediction + treatment advice.
- **Language & Dialect Support:** Yoruba, Hausa, Igbo, Pidgin, and English.
- **Weather Awareness:** Detects weather context and adjusts advice accordingly.
- **Crop Market Prices:** Real-time pricing data fetched using Puppeteer.
- **Admin Alerts:** Critical system issues are sent to the admin’s WhatsApp inbox.
- **AI Memory:** Stores conversation history and context per user.
- **Security & Spam Control:** Ignores groups, broadcasts, and statuses.
- **Bubble Wrap Stability:** Full error isolation and recovery.

---

## System Design Overview

```
User (Farmer)
   |
   v
WhatsApp (via Web.js)
   |
   v
[MagFarm Bot Engine]
   |-- Message Routing
   |-- Media Parsing
   |-- Language Detection
   |-- AI Query Validation
   |-- AI Chat (OpenAI GPT-4o)
   |-- Voice Transcription (Whisper/SpeechLib)
   |-- Image Prediction (TensorFlow.js/Python model)
   |-- Memory Store (MongoDB)
   |-- Weather & Market Modules (via Puppeteer/API)
   |
   v
Smart Responses + Voice Replies
```

---

## Setup Instructions

### 1. Clone Repo

```bash
git clone https://github.com/yourname/magfarm.git
cd magfarm
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Environment Variables

Create a `.env` file:

```
PORT=3000
MONGO_URI=your_mongodb_uri
OPENAI_API_KEY=your_openai_key
ALERT_PHONE_NUMBER=admin@s.whatsapp.net
```

### 4. Run App

```bash
node index.js
```

### 5. Usage

- Send image: get crop disease analysis.
- Send voice: AI transcribes and answers back.
- Chat normally in Yoruba/Igbo/Hausa/Pidgin/English.

---

## Codebase Structure

```
src/
  bot/              # WhatsApp client handlers
  services/         # AI, speech, prediction, weather, price logic
  utils/            # Logging, alert system, language utils
  configs/          # Environment configs
```

---

## AUTHOR
[Oluwadamilola Emmanuel Femi](https://github.com/FemiOluwadamilola)

## License

MIT © 2025 MagFarm Team
