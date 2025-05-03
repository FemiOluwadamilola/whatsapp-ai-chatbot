const fs = require("fs");
const path = require("path");
const { runPrediction } = require("../../services/predict");
const voiceNotesDir = path.join(__dirname, "../../voice_notes");
const log = require("../../utils/logger");

if (!fs.existsSync(voiceNotesDir)) {
  fs.mkdirSync(voiceNotesDir, { recursive: true });
}

async function handleImage(buffer, msg) {
  const filePath = path.join(voiceNotesDir, `img_${Date.now()}.jpg`);
  try {
    fs.writeFileSync(filePath, buffer);

    await msg.reply("📷 Thanks for the image! Running crop analysis...");

    const prediction = await runPrediction(filePath);

    await msg.reply(
      `🧠 Prediction: *${prediction.label}* with confidence: *${prediction.confidence.toFixed(2)}*`
    );
  } catch (err) {
    log.error(`Image Prediction Error: ${err.message}`);
    await msg.reply("❌ Failed to process image.");
  } finally {
    try {
      fs.unlinkSync(filePath);
    } catch (e) {
      log.warn(`Cleanup error for image file: ${filePath}`);
    }
  }
}

module.exports = handleImage;