const { chatWithAI } = require("./ai");
const log = require("../utils/logger");

/**
 * Gets the current estimated market price for a crop in a specific Nigerian location using GPT.
 * @param {string} crop - The crop name (e.g., maize, cassava).
 * @param {string} location - The location (e.g., Kano, Ibadan).
 * @returns {Promise<string>} - A human-readable estimate or a fallback message.
 */
async function getMarketPriceFromGPT(crop, location) {
  const now = new Date().toLocaleDateString("en-NG", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const prompt = `
You are a trusted Nigerian agricultural market expert AI. A farmer is asking for the **current market price** of the crop **"${crop}"** in **"${location}"**, Nigeria.

Today is **${now}**.

Please respond with:

1. A realistic estimated price **range** in Nigerian Naira (₦), based on common market units (e.g., per kg or per 100kg bag).
2. Clearly mention that this is an **estimated value**, not an exact figure.
3. Include today’s date in your response.
4. End with a **brief tip** about how crop prices can vary due to factors like season, demand, transportation, or local supply.

Keep your tone factual, concise, and farmer-friendly.

Crop: ${crop}  
Location: ${location}  
Date: ${now}
`;

  try {
    const response = await chatWithAI(prompt.trim());
    return (
      response?.trim() ||
      "📊 I couldn't find a current price. Please try again shortly."
    );
  } catch (error) {
    log.error(`❌ GPT market price fetch failed: ${error.message}`);
    return "⚠️ I couldn’t get the current market price right now. Please try again later.";
  }
}

module.exports = getMarketPriceFromGPT;
