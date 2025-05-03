const fs = require("fs");
const path = require("path");
const { MessageMedia } = require("whatsapp-web.js");
const { convertOpusToWav, speechToText } = require("../../services/speech");
const { detectLanguage, translateText } = require("../../services/translate");
const {
  chatWithAI,
  aiVoice,
  isAgricultureRelatedAI,
} = require("../../services/ai");
const containsAgriKeyword = require("../../utils/containsAgriKeyword");
const log = require("../../utils/logger");  

const langCodes = {
    yo: "Yoruba",
    ig: "Igbo",
    ha: "Hausa",
    en: "English"
  };

const voiceNotesDir = path.join(__dirname, "../../voice_notes");
if (!fs.existsSync(voiceNotesDir)) {
  fs.mkdirSync(voiceNotesDir, { recursive: true });
}

async function handleAudio(buffer, msg, client) {
    const inputPath = path.join(voiceNotesDir, `voice_${Date.now()}.opus`);
    fs.writeFileSync(inputPath, buffer);
  
    let wavPath, voicePath;
  
    try {
      wavPath = await convertOpusToWav(inputPath);
      const text = await speechToText(wavPath);
  
      if (!text) {
        await msg.reply("❗ I couldn't understand your voice note.");
        return;
      }
  
      const detectedLang = await detectLanguage(text);
      let translatedInput = text;
  
      if (detectedLang !== "en") {
        translatedInput = await translateText(text, detectedLang, "en");
      }
  
      if (!containsAgriKeyword(translatedInput)) {
        const isAgri = await isAgricultureRelatedAI(translatedInput);
        if (!isAgri) {
          return msg.reply(
            "🌾 I'm here to help with agriculture and farming topics only."
          );
        }
      }
  
      const response = await chatWithAI(translatedInput);
      if (!response) return msg.reply("⚠️ AI response failed.");
  
      let finalResponse = response;
      if (["yo", "ig", "ha"].includes(detectedLang)) {
        finalResponse = await translateText(response, "en", detectedLang);
      }
  
      voicePath = await aiVoice(response, voiceNotesDir);
      const voiceMedia = MessageMedia.fromFilePath(voicePath);
      const langLabel = langCodes[detectedLang] || "your language";
  
      await msg.reply(`🎧 Here's your answer in *${langLabel}*:`);
  
      await client.sendMessage(msg.from, voiceMedia, { sendAudioAsVoice: true });
  
    } catch (err) {
      log.error(`Voice Handling Error: ${err.message}`);
      await msg.reply("❌ Error processing voice note.");
    } finally {
      [inputPath, wavPath, voicePath].forEach(file => {
        if (file && fs.existsSync(file)) {
          try {
            fs.unlinkSync(file);
          } catch (e) {
            log.warn(`Failed to delete: ${file}`);
          }
        }
      });
    }
  }

  module.exports = handleAudio;