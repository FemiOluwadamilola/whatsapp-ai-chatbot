// src/bot/ClientManager.js
let clientInstance = null;

/**
 * Set the WhatsApp client globally.
 * @param {object} client - WhatsApp client instance.
 */
function setClient(client) {
  clientInstance = client;
}

/**
 * Get the WhatsApp client globally.
 * @returns {object|null} - WhatsApp client instance or null.
 */
function getClient() {
  return clientInstance;
}

module.exports = {
  setClient,
  getClient,
};
// This module manages the WhatsApp client instance globally.
// It allows setting and getting the client instance, ensuring that the same instance is used throughout the application.
// This is useful for sending alerts or handling events without needing to pass the client instance around.
// The client instance is set when the WhatsApp client is initialized and can be accessed anywhere in the application using getClient().
