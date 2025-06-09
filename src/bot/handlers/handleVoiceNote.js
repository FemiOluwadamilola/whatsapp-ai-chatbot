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
  en: "English",
};

const voiceNotesDir = path.join(__dirname, "../../voice_notes");
if (!fs.existsSync(voiceNotesDir)) {
  fs.mkdirSync(voiceNotesDir, { recursive: true });
}

/**
 * Handles voice note input for agricultural AI assistant.
 * Filters out non-user chats like groups and status.
 *
 * @param {Buffer} buffer - Audio buffer from voice note.
 * @param {object} msg - WhatsApp message object.
 * @param {object} client - WhatsApp client instance.
 */
async function handleVoiceNote(buffer, msg, client) {
  // const senderJid = msg?.key?.remoteJid;

  // // 🔒 Skip groups, status, and broadcasts
  // if (
  //   senderJid === "status@broadcast" ||
  //   senderJid.endsWith("@g.us") ||
  //   senderJid.endsWith("@broadcast") ||
  //   !senderJid.endsWith("@s.whatsapp.net")
  // ) {
  //   return;
  // }

  const inputPath = path.join(voiceNotesDir, `voice_${Date.now()}.opus`);
  let wavPath, voicePath;

  try {
    fs.writeFileSync(inputPath, buffer);

    wavPath = await convertOpusToWav(inputPath);
    const transcribedText = await speechToText(wavPath);

    if (!transcribedText) {
      await msg.reply("❗ I couldn't understand your voice note.");
      return;
    }

    const detectedLang = await detectLanguage(transcribedText);
    let translatedText = transcribedText;

    if (detectedLang !== "en") {
      translatedText = await translateText(transcribedText, detectedLang, "en");
    }

    // 🌾 Filter non-agriculture prompts
    if (!containsAgriKeyword(translatedText)) {
      const isAgri = await isAgricultureRelatedAI(translatedText);
      if (!isAgri) {
        return msg.reply("🌱 I'm here to help with agriculture and farming only.");
      }
    }

    const aiResponse = await chatWithAI(translatedText);
    if (!aiResponse) {
      await msg.reply("⚠️ Couldn't generate a response. Please try again.");
      return;
    }

    let finalResponse = aiResponse;
    if (["yo", "ig", "ha"].includes(detectedLang)) {
      finalResponse = await translateText(aiResponse, "en", detectedLang);
    }

    voicePath = await aiVoice(finalResponse, voiceNotesDir);
    const voiceMedia = MessageMedia.fromFilePath(voicePath);
    const langLabel = langCodes[detectedLang] || "your language";

    await msg.reply(`🎧 Here's your answer in *${langLabel}*:`);

    await client.sendMessage(msg.from, voiceMedia, { sendAudioAsVoice: true });

  } catch (err) {
    log.error(`❌ Voice Note Handler Error: ${err.message}`);
    await msg.reply("❌ Error processing your voice note. Please try again.");
  } finally {
    // 🧹 Cleanup temp files
    [inputPath, wavPath, voicePath].forEach((file) => {
      if (file && fs.existsSync(file)) {
        try {
          fs.unlinkSync(file);
        } catch (e) {
          log.warn(`⚠️ Failed to delete file: ${file}`);
        }
      }
    });
  }
}

module.exports = handleVoiceNote;
