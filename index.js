const log = require('./src/utils/logger'); 

process.on('unhandledRejection', (reason) => {
  log.error('Unhandled Rejection:', reason);
});

process.on('uncaughtException', (err) => {
  log.error('Uncaught Exception:', err);
});

const express = require('express');
const mongoose = require('mongoose');
const createClient = require('./src/bot/client');
const dbConnection = require('./src/configs/DbConfig'); 
const app = express();

async function startApp() {
    try {
        log.info('Starting application...');
        log.info('Initializing database connection...');
        await dbConnection(mongoose);
        log.info('Database initialized successfully.');
         await createClient();
        log.info('WhatsApp client initialized successfully.');
    } catch (err) {
        log.error('Error occurred during application startup:', err);
    }
}

async function startServer() {
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
        log.info(`Server is running on port ${PORT}`);
        startApp();
    });
}

startServer();