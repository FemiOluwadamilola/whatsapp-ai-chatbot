const fs = require("fs");
const path = require("path");
const { chatWithAI, isAgricultureRelatedAI } = require("../../services/ai");
const { getFarmerByPhone, createFarmer } = require("../../services/memory");
const getWeatherForecast = require("../../services/weather");
const extractLocation = require("../../utils/extractLocation");
const handleImage = require("./imageHandler");
const handleAudio = require("./audioHandler");
const { getMarketPriceFromGPT } = require("../../services/marketPriceAI");
const containsAgriKeyword = require("../../utils/containsAgriKeyword");
const log = require("../../utils/logger");

const handleMessage = async (msg, client) => {
  try {
    let userText = msg.body.trim().toLowerCase();
    let context = "";

    // 🛠️ Handle quoted messages with safe fallback
    if (msg.hasQuotedMsg) {
      try {
        const quotedMsg = await msg.getQuotedMessage();
        const quotedText = quotedMsg?.body?.trim();

        if (quotedText) {
          context = `User is replying to this message: "${quotedText}"\nUser's follow-up question: "${userText}"`;
        } else {
          context = userText;
          log.warn("Quoted message was empty or missing body.");
        }
      } catch (quoteErr) {
        log.warn(`Could not get quoted message: ${quoteErr.message}`);
        context = userText;
      }
    } else {
      context = userText;
    }

    // 📷 Handle media
    if (msg.hasMedia) {
      const media = await msg.downloadMedia();
      if (!media || !media.data)
        return msg.reply("⚠️ Couldn't download media.");
      const buffer = Buffer.from(media.data, "base64");

      // image prediction handler
       if (media.mimetype.includes("image")) {
        return await handleImage(buffer, msg);
      }

      // Voice note handler
      if (
        media.mimetype.includes("audio") ||
        media.filename?.endsWith(".opus")
      ) {
        return await handleAudio(buffer, msg, client);
      }

      return msg.reply("❌ Unsupported media type.");
    }



    const contact = await msg.getContact();

    // 👋 Handle casual responses like 'ok', 'alright', 'okay', etc.
    const casualResponses = [
      "ok",
      "okay",
      "alright",
      "sure",
      "sounds good",
      "great",
      "yes",
      "no problem",
      "yep",
      "yup",
      "cool",
      "fine",
    ];
    if (casualResponses.includes(userText)) {
      return msg.reply(
        "👍 Got it! How else can I assist you with your farming needs?"
      );
    }

    // 👨‍🌾 Handle statements like "I'm a farmer, I'll love to learn more from you"
    if (
      /i'm\s*a\s*farmer|i\s*am\s*a\s*farmer|i\s*wanna\s*learn\s*more/i.test(
        userText
      )
    ) {
      const name = contact.pushname || contact.verifiedName || "there";
      return msg.reply(
        `🌾 That's awesome! ${name} As a farmer, I can provide you with valuable information such as:\n` +
          "- Identifying crop diseases\n" +
          "- Pest control tips\n" +
          "- Soil health management\n" +
          "- Weather forecasts\n" +
          "- Market prices for crops\n" +
          "- General farming advice\n\n" +
          "Just let me know what you'd like to learn more about or ask any farming-related questions!"
      );
    }

    // 👋 Greetings & small talk
    if (/^(hi|hello|hey)\b/i.test(userText)) {
      const name = contact.pushname || contact.verifiedName || "there";
      return msg.reply(
        `👋 Hello! ${name}! I'm MagFarm, your AI farming assistant. I can help you with:\n` +
          "- Crop disease identification\n" +
          "- Pest management\n" +
          "- Soil health tips\n" +
          "- Weather updates\n" +
          "- Market prices 📈\n" +
          "- General farming advice 🌾\n\n" +
          "Just ask me anything related to farming!"
      );
    }

    if (userText.includes("what is magfarm")) {
      return msg.reply(
        "MagFarm is your AI farming assistant, helping with crop disease identification, pests, soil, and planting tips, and more!"
      );
    }

    if (userText.includes("who are you") || userText.includes("what are you")) {
      return msg.reply(
        "I'm MagFarm, an AI assistant specialized in agriculture. my goal is to help farmers like you with crop diseases, pests, soil, and planting tips."
      );
    }

    if (userText.includes("what can you do")) {
      return msg.reply(
        "I can detect crop diseases, give farming tips, predict weather, and more."
      );
    }

    if (userText.includes("thank you") || userText.includes("thanks")) {
      return msg.reply("🙏 You're welcome! How else can I help?");
    }

    // Fetch weather info
    // 🔍 Smart weather request detection
    const weatherPattern =
      /weather.*(today|like|update|forecast)?|what(?:'s| is) the weather/i;
    if (weatherPattern.test(userText)) {
      const phone = contact.number;
      let location = await extractLocation(userText, context);
      const memory = await getFarmerByPhone(phone);

      if (!location && memory?.location) {
        location = memory.location;
      }

      if (!location) {
        return msg.reply(
          "🌍 I need your farm's location to provide accurate weather forecasts.\n" +
            "Please tell me your location (e.g. 'Weather in Kano')."
        );
      }

      if (!memory?.location) {
        await createFarmer({ phone, location });
        await msg.reply(
          `✅ Got it! I've saved your farm's location as *${location}* for future updates.\n` +
            "You can now just say *'weather update'* anytime for quick forecasts."
        );
      }

      const forecast = await getWeatherForecast(location);
      return msg.reply(forecast);
    }

    // 💰 Fetch Market prices
    const priceIntentRegex =
      /\b(price of|market price|current price|cost of|how much is|going rate for|what's the price of|latest price of)\s+([\w\s]+?)(?:\s+in\s+([\w\s]+))?\b/i;

    if (priceIntentRegex.test(userText)) {
      const match = userText.match(priceIntentRegex);
      const cropRaw = match?.[2]?.trim();
      let location = match?.[3]?.trim();

      if (!cropRaw) {
        return msg.reply(
          "🌾 Please tell me which crop you're asking about. For example: 'current price of maize in Kano'."
        );
      }

      const crop = cropRaw.split(" ")[0]; // Try to isolate actual crop name

      if (!location) {
        location = await extractLocation(userText, context);
      }

      if (!location) {
        return msg.reply(
          "🌍 Please tell me the location you're interested in. For example, 'market price of yam in Ibadan'."
        );
      }

      const priceEstimate = await getMarketPriceFromGPT(crop, location);
      return msg.reply(priceEstimate);
    }

    // 🌾 Agriculture check
    if (!containsAgriKeyword(userText)) {
      const isAgri = await isAgricultureRelatedAI(userText);
      if (!isAgri) {
        return msg.reply(
          "🌾 I only handle farm-related questions. Ask me about crops, pests, soil, etc."
        );
      }
    }

    // 🤖 Chat with AI using context
    const aiResponse = await chatWithAI(context);
    if (!aiResponse) {
      return msg.reply("⚠️ MagFarm is unavailable right now. Try again later.");
    }

    await msg.reply(aiResponse);
  } catch (err) {
    log.error(`Unhandled Error: ${err.message}`);
    await msg.reply("❌ Something went wrong while handling your request.");
  }
};

module.exports = { handleMessage };
