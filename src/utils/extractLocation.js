const { chatWithAI } = require("../services/ai");

const NIGERIAN_LOCATIONS = [
  "lagos", "abuja", "ibadan", "kano", "kaduna", "port harcourt", "benin", "maiduguri",
  "jos", "zaria", "enugu", "uyo", "owerri", "ilorin", "calabar", "yola", "aba", "osogbo",
  "minna", "bauchi", "makurdi", "awka", "ado ekiti", "ekpoma", "ikot ekpene", "sokoto", "gombe"
];

const STATE_TO_CITY = {
  "oyo": "ibadan",
  "fct": "abuja",
  "rivers": "port harcourt",
  "edo": "benin",
  "borno": "maiduguri",
  "plateau": "jos",
  "kaduna": "kaduna",
  "kano": "kano",
  "enugu": "enugu",
  "akwa ibom": "uyo",
  "imo": "owerri",
  "kwara": "ilorin",
  "cross river": "calabar",
  "adamawa": "yola",
  "abia": "aba",
  "osun": "osogbo",
  "niger": "minna",
  "bauchi": "bauchi",
  "benue": "makurdi",
  "anambra": "awka",
  "ekiti": "ado ekiti",
  "delta": "warri",
  "sokoto": "sokoto",
  "gombe": "gombe"
};

function capitalizeEachWord(str) {
  return str.replace(/\b\w/g, c => c.toUpperCase());
}

async function extractLocation(text, fallbackContext = null) {
  const lower = text.toLowerCase();

  // ✅ Match cities first
  for (const location of NIGERIAN_LOCATIONS) {
    if (lower.includes(location)) {
      return capitalizeEachWord(location);
    }
  }

  // ✅ Match state names
  for (const [state, city] of Object.entries(STATE_TO_CITY)) {
    if (lower.includes(state)) {
      return capitalizeEachWord(city);
    }
  }

  // 🤖 GPT fallback
  if (fallbackContext) {
    const gptPrompt = `
The user said: "${text}"
Please extract or guess the Nigerian city they're referring to, if any.
Just return the most likely city name (e.g., "Lagos", "Abuja"). If unknown, return "unknown".
    `.trim();

    const gptResponse = await chatWithAI(gptPrompt);
    const location = gptResponse?.trim().toLowerCase();

    if (location && location !== "unknown") {
      return capitalizeEachWord(location);
    }
  }

  return null;
}

module.exports = extractLocation;
