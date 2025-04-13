const { Client } = require("whatsapp-web.js");
const qrcode = require("qrcode-terminal");
// const { loadModel } = require("../services/imagePrediction");
const { ensureDirExists, cleanOldFiles } = require("../utils/fileUtils");
const { handleMessage } = require("./handlers/messageHandler");
const path = require('path');
const logger = require('../utils/logger');

const voiceNotesDir = path.join(__dirname, '../voice_notes');
ensureDirExists(voiceNotesDir);
cleanOldFiles(voiceNotesDir);

const client = new Client();

client.on('qr', qr => qrcode.generate(qr, { small: true }));
client.on('ready', async () => {
    logger.info("WhatsApp bot is ready.");
    // await loadModel();
});
client.on('message', async msg => await handleMessage(msg, client));

module.exports = client;
