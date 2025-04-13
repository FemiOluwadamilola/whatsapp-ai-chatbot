const fs = require("fs");
const path = require("path");
const { chatWithAI, aiVoice, isAgricultureRelatedAI } = require("../../services/ai");
const { predictImage } = require("../../services/imagePrediction");
const { convertOpusToWav, speechToText } = require("../../services/speech");
const { MessageMedia } = require("whatsapp-web.js");
const logger = require("../../utils/logger");

const voiceNotesDir = path.join(__dirname, "../../voice_notes");

const agriKeywords = [
    'plant', 'farming', 'farm', 'agriculture', 'soil', 'crop', 'harvest', 'fertilizer',
    'compost', 'greenhouse', 'irrigation', 'pesticide', 'disease', 'germination', 'seeds',
    'livestock', 'tractor', 'agronomy', 'climate', 'weather', 'yield', 'weeding', 'organic'
  ];
  
  function containsAgriKeyword(text) {
    const cleaned = text.toLowerCase();
    return agriKeywords.some(keyword => cleaned.includes(keyword));
  }

const handleMessage = async (msg, client) => {
  try {
    if (msg.hasMedia) {
      const media = await msg.downloadMedia();
      if (!media || !media.data)
        return msg.reply("⚠️ Couldn't download media.");

      const buffer = Buffer.from(media.data, "base64");

      if (media.mimetype.includes("image")) {
        const filePath = path.join(voiceNotesDir, `img_${Date.now()}.jpg`);
        fs.writeFileSync(filePath, buffer);
        try {
          const prediction = await predictImage(filePath);
          await msg.reply(`🧠 Prediction: *${prediction}*`);
        } catch (err) {
          logger.error(`Image Prediction Error: ${err}`);
          msg.reply("❌ Failed to process image.");
        } finally {
          fs.unlinkSync(filePath);
        }
      } else if (
        media.mimetype.includes("audio") ||
        media.filename?.endsWith(".opus")
      ) {
        const inputPath = path.join(voiceNotesDir, `voice_${Date.now()}.opus`);
        fs.writeFileSync(inputPath, buffer);

        const wavPath = await convertOpusToWav(inputPath);
        const text = await speechToText(wavPath);

        if (!text) return msg.reply("⚠️ Couldn't transcribe voice note.");
        const response = await chatWithAI(text);

        if (!response) return msg.reply("⚠️ AI response failed.");
        const voicePath = await aiVoice(response, voiceNotesDir);
        const voiceMedia = MessageMedia.fromFilePath(voicePath);

        await client.sendMessage(msg.from, voiceMedia, {
          sendAudioAsVoice: true,
        });

        fs.unlinkSync(inputPath);
        fs.unlinkSync(wavPath);
        fs.unlinkSync(voicePath);
      }
    } else {
      // 🔍 Keyword & Command Responses
      const text = msg.body.trim().toLowerCase();
      if (!msg.hasMedia) {
        // Friendly greetings
        if (/^(hi|hello|hey)\b/i.test(text)) {
          return msg.reply(
            "👋 Hello! I'm MagFarm How can I assist you with your farming needs today?"
          );
        }

        // // Help command
        // if (text === "/help") {
        //   return msg.reply(
        //     "🆘 *Help Menu:*\n" +
        //       "📤 Send a voice note to get a voice reply\n" +
        //       "💬 Type a message to chat with AI\n" +
        //       "🖼️ Send an image to get it described\n" +
        //       "ℹ️ Type `/about` to learn more"
        //   );
        // }

        // // About command
        // if (text === "/about") {
        //   return msg.reply(
        //     "🤖 I'm an AI-powered assistant built with WhatsApp, GPT, and speech tools.\n" +
        //       "🎙️ I can understand your voice, respond back in voice, and even describe images!\n" +
        //       "🌱 Created for smart, interactive conversations."
        //   );
        // }

        // Small talk
        if (text.includes("who are you") || text.includes("what are you")) {
          return msg.reply(
            "I am MagFarm, your AI assistant specialized in farming and agriculture."
          );
        }

        if (text.includes("what can you do")) {
          return msg.reply(
            "I am MagFarm, your assistant for farming and agriculture. I can provide advice on planting, pest management, soil health, and more!"
          );
        }

        if (text.includes("thank you") || text.includes("thanks")) {
          return msg.reply("🙏 You're very welcome! How can I assist you further?");
        }
      }

      if (!containsAgriKeyword(text)) {
        // 🧠 Fallback: AI topic check
        const isAgriRelated = await isAgricultureRelatedAI(text);
        if (!isAgriRelated) {
          return msg.reply("🌾 I'm here to help with agriculture and planting topics only. Try asking about crops, soil, or farm-related issues!");
        }
      }
    
      const aiResponse = await chatWithAI(text);

      if (!aiResponse) {
        await msg.reply(
          "⚠️ MagFarm is currently unavailable. Please try again later."
        );
        return;
      }

      await msg.reply(aiResponse);
    }
  } catch (err) {
    logger.error(`Unhandled Error: ${err}`);
    msg.reply("❌ Something went wrong.");
  }
};

module.exports = { handleMessage };
