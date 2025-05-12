const { chatWithAI } = require("./ai");
const log = require("../utils/logger");

/**
 * Gets an estimated market price for a crop in a specific Nigerian location using GPT.
 * @param {string} crop - The crop name (e.g. maize, cassava).
 * @param {string} location - The location to estimate price for.
 * @returns {Promise<string>} - A human-readable market price estimate or fallback message.
 */
async function getMarketPriceFromGPT(crop, location) {
  const prompt = `
You are an agricultural market advisor AI. A farmer wants to know the current market price of "${crop}" in "${location}" (Nigeria). 
Please provide a reasonable estimated price range in Naira (₦) and mention that it's an estimate.
Also, include a brief note on market variability.
Crop: ${crop}
Location: ${location}
`;

  try {
    const response = await chatWithAI(prompt.trim());
    return response?.trim() || "📊 Price data not available right now. Please try again shortly.";
  } catch (error) {
    log.error(`❌ Error fetching market price from GPT: ${error.message}`);
    return "⚠️ I couldn’t estimate the market price at the moment. Please try again later.";
  }
}

module.exports = { getMarketPriceFromGPT };
