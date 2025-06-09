const log = require("./logger");
const { adminNumber } = require("../configs/admin");
const { getClient } = require("../bot/clientManager");

/**
 * Sends a WhatsApp alert to the admin with a local time timestamp.
 * @param {object} client - WhatsApp client instance.
 * @param {string} message - Alert message to send.
 */
async function alertAdmin(client, message) {
   client = getClient();
  try {
    if (!client || !adminNumber) return;

    const timestamp = new Date().toLocaleString(); // Local time format
    const formattedMessage = `🚨 *MagFarm Alert*\n🕒 ${timestamp}\n\n${message}`;

    await client.sendMessage(adminNumber, formattedMessage);
  } catch (err) {
    log.warn("⚠️ Failed to alert admin via WhatsApp:", err.message);
  }
}

module.exports = alertAdmin;
