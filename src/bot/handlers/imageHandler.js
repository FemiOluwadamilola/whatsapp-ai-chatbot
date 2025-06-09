const fs = require("fs/promises");
const path = require("path");
const { runPrediction } = require("../../services/predict");
const log = require("../../utils/logger");
const alertAdmin = require("../../utils/alertAdmin");

const voiceNotesDir = path.resolve(__dirname, "../../voice_notes");

/**
 * Ensure the target directory exists.
 * @param {string} dir - Directory path to create if missing.
 */
async function ensureDirExists(dir) {
  try {
    await fs.mkdir(dir, { recursive: true });
  } catch (err) {
    log.error(`❌ Failed to ensure directory exists: ${dir}`, err);
    throw err;
  }
}

/**
 * Handles crop image prediction from user.
 * Only processes images sent directly in private chats (not groups/statuses/broadcasts).
 * 
 * @param {Buffer} buffer - Image buffer.
 * @param {object} msg - WhatsApp message object.
 */
async function handleImage(buffer, msg) {
  const senderJid = msg?.key?.remoteJid;

  // Skip if senderJid is undefined or from groups/status/broadcasts
  if (
    !senderJid ||
    senderJid === "status@broadcast" ||
    senderJid.endsWith("@g.us") ||
    senderJid.endsWith("@broadcast") ||
    !senderJid.endsWith("@s.whatsapp.net")
  ) {
    return; // silently skip
  }

  await ensureDirExists(voiceNotesDir);

  const fileName = `img_${Date.now()}.jpg`;
  const filePath = path.join(voiceNotesDir, fileName);

  try {
    await fs.writeFile(filePath, buffer);
    await msg.reply("📷 Thanks for the image! Running crop analysis...");

    const prediction = await runPrediction(filePath);

    const reply = `🧠 Prediction: *${prediction.label}* with confidence: *${prediction.confidence.toFixed(2)}*`;
    await msg.reply(reply);
  } catch (error) {
    log.error(`❌ Image Prediction Error: ${error.message}`);
    await msg.reply("⚠️ Sorry, I had trouble analyzing the image. Please try again or provide more details.");
  } finally {
    try {
      await fs.unlink(filePath);
    } catch (cleanupErr) {
      log.warn(`⚠️ Failed to delete temp image file: ${filePath}`);
      await alertAdmin(`⚠️ Failed to delete temp image file: ${filePath}`);
    }
  }
}

module.exports = handleImage;
