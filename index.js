const mongoose = require('mongoose');
const createClient = require('./src/bot/client');
const dbConnection = require('./src/configs/DbConfig'); 
const log = require('./src/utils/logger'); 


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

startApp();
