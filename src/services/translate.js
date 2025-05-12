// services/translate.js
const axios = require("axios");
const log = require("../utils/logger");

const LIBRE_TRANSLATE_URL = "https://libretranslate.de"; // public instance

// Language codes mapping for Nigerian languages
const langCodes = {
  en: "English",
  yo: "Yoruba",
  ig: "Igbo",
  ha: "Hausa",
};

async function detectLanguage(text) {
  try {
    const res = await axios.post(`${LIBRE_TRANSLATE_URL}/detect`, {
      q: text,
    });

    const detected = res.data[0]?.language || "en";
    return detected;
  } catch (err) {
    log.error("Language detection failed:", err.message);
    return "en"; // fallback
  }
}

async function translateText(text, fromLang, toLang) {
  try {
    const res = await axios.post(`${LIBRE_TRANSLATE_URL}/translate`, {
      q: text,
      source: fromLang,
      target: toLang,
      format: "text",
    });

    return res.data.translatedText;
  } catch (err) {
    log.error("Translation failed:", err.message);
    return text; // fallback to original text
  }
}

module.exports = {
  detectLanguage,
  translateText,
  langCodes,
};
