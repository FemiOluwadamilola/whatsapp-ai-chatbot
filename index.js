const express = require("express");
const mongoose = require("mongoose");
const log = require("./src/utils/logger");
const alertAdmin = require("./src/utils/alertAdmin");
const createClient = require("./src/bot/client");
const dbConnection = require("./src/configs/DbConfig");

const app = express();

// 🌐 Global crash protection
process.on("unhandledRejection", async (reason) => {
  log.error("🔥 Unhandled Rejection:", reason);
  await alertAdmin(`🔥 *Unhandled Promise Rejection:*\n${reason}`);
});

process.on("uncaughtException", async (err) => {
  log.error("🔥 Uncaught Exception:", err);
  await alertAdmin(`🔥 *Uncaught Exception:*\n${err.message}`);
});

async function startApp() {
  try {
    log.info("🚀 Starting application...");

    log.info("🔌 Connecting to MongoDB...");
    await dbConnection(mongoose);
    log.info("✅ MongoDB connection established.");

    log.info("💬 Initializing WhatsApp client...");
    await createClient();
    log.info("✅ WhatsApp client initialized.");

  } catch (err) {
    log.error("❌ Startup Error:", err);
    await alertAdmin(`❌ *Startup Error:*\n${err.message}`);
  }
}

async function startServer() {
  const PORT = process.env.PORT || 3000;

  app.listen(PORT, () => {
    log.info(`🚦 Server is running on port ${PORT}`);
    startApp();
  });
}

startServer();
