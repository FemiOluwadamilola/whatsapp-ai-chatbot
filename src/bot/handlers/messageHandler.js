const fs = require("fs");
const path = require("path");
const {
  chatWithAI,
  isAgricultureRelatedAI,
} = require("../../services/ai");
const {getFarmerByPhone, createFarmer} = require("../../services/memory");
const getWeatherForecast = require("../../services/weather");
const extractLocation = require("../../utils/extractLocation");
// const handleImage = require("./imageHandler");
const handleAudio = require("./audioHandler");
const containsAgriKeyword = require("../../utils/containsAgriKeyword");
const log = require("../../utils/logger");

const handleMessage = async (msg, client) => {
  try {
    let userText = msg.body.trim();
    let context = "";

    // 🛠️ Handle quoted messages with safe fallback
    if (msg.hasQuotedMsg) {
      try {
        const quotedMsg = await msg.getQuotedMessage();
        const quotedText = quotedMsg?.body?.trim();

        if (quotedText) {
          context = `User is replying to this message: "${quotedText}"\nUser's follow-up question: "${userText}"`;
          // log.info(`Quoted Context: ${context}`);
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
      if (!media || !media.data) return msg.reply("⚠️ Couldn't download media.");
      const buffer = Buffer.from(media.data, "base64");

      // Uncomment this when image handling is ready
      // if (media.mimetype.includes("image")) {
      //   return await handleImage(buffer, msg);
      // }

      if (
        media.mimetype.includes("audio") ||
        media.filename?.endsWith(".opus")
      ) {
        return await handleAudio(buffer, msg, client);
      }

      return msg.reply("❌ Unsupported media type.");
    }

    const contact = await msg.getContact();

    // 👋 Greetings & small talk
    if (/^(hi|hello|hey)\b/i.test(userText)) {
      const name = contact.pushname || contact.verifiedName || "there";
      return msg.reply(`👋 Hello ${name}! I'm MagFarm How can I assist you with your farming needs today?`);
    }

    if (userText.includes("what is magfarm")) {
      return msg.reply("MagFarm is your AI farming assistant, helping with crops disease identification, pests, soil, and planting tips.");
    }

    if (userText.includes("who are you") || userText.includes("what are you")) {
      return msg.reply("I'm MagFarm, an AI assistant specialized in agriculture.");
    }

    if (userText.includes("what can you do")) {
      return msg.reply("I can detect crop diseases, give farming tips, predict weather, and more.");
    }

    if (userText.includes("thank you") || userText.includes("thanks")) {
      return msg.reply("🙏 You're welcome! How else can I help?");
    }

    // Fetch weather info
    if (userText.includes("weather update")) {
      const phone = contact.number; // Get the phone number of the user
      let location = extractLocation(userText); // Try to extract location from the message
      const memory = await getFarmerByPhone(phone); // Retrieve saved memory for this farmer, if available

      // If no location in the message, check if we have a saved location
      if (!location && memory?.location) {
        location = memory.location;
      }

      // If still no location, ask the farmer to provide one
      if (!location) {
        return msg.reply("🌍 Please tell me your farm's location (e.g. 'Weather update in Lagos') so I can provide accurate weather updates.");
      }

      // If the farmer provided a location, we save it
      if (!memory?.location) {
        await createFarmer({ phone, location });
        return msg.reply(`✅ Your farm's location has been saved as ${location}, to provide better weather updates in the future.(You can change it anytime). Now for quick weather updates, just say 'weather update'`);
      }

      // Fetch and return weather for the location
      const weather = await getWeatherForecast(location);
      return msg.reply(weather);
    }
    

    // 🌾 Agriculture check
    if (!containsAgriKeyword(userText)) {
      const isAgri = await isAgricultureRelatedAI(userText);
      if (!isAgri) {
        return msg.reply("🌾 I only handle farm-related questions. Ask me about crops, pests, soil, etc.");
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
