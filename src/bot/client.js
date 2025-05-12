const { Client, RemoteAuth } = require('whatsapp-web.js');
const { MongoStore } = require('wwebjs-mongo');
const qrcode = require('qrcode-terminal');
const mongoose = require('mongoose');
const { ensureDirExists, cleanOldFiles } = require('../utils/fileUtils');
const { handleMessage } = require('./handlers/messageHandler');
const path = require('path');
const log = require('../utils/logger');

// Ensure voice notes directory exists
const voiceNotesDir = path.join(__dirname, '../voice_notes');
ensureDirExists(voiceNotesDir);
cleanOldFiles(voiceNotesDir);

async function createClient() {
    // Ensure mongoose is connected before creating the client
    await mongoose.connection.readyState; // Wait until the connection is ready

    const store = new MongoStore({
        mongoose: mongoose, // Pass the mongoose instance directly
    });

    const client = new Client({
        authStrategy: new RemoteAuth({
            store: store,
            backupSyncIntervalMs: 60000, // optional: save every 1 min
        }),
        puppeteer: {
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox'],
        },
    });

    // Handle QR code generation
    client.on('qr', (qr) => qrcode.generate(qr, { small: true }));

    // Authenticated event
    client.on('authenticated', () => {
        log.info('✅ WhatsApp session authenticated.');
    });

    // Authentication failure event
    client.on('auth_failure', (msg) => {
        log.error('❌ Authentication failure:', msg);
    });

    // Client ready event
    client.on('ready', () => {
        log.info('🚀 WhatsApp bot is ready.');
    });

    // Remote session saved to MongoDB
    client.on('remote_session_saved', () => {
        log.info('💾 Remote session saved to MongoDB.');
    });

    // Handle incoming messages
    client.on('message', (msg) => handleMessage(msg, client));

    // Disconnected event - with retry logic
    client.on('disconnected', async (reason) => {
        log.warn(`⚠️ WhatsApp client was disconnected. Reason: ${reason}`);

        // Retry connection logic
        let retryCount = 0;
        const maxRetries = 5;  // Limit the number of retries
        const retryDelay = 2000; // 2 seconds between retries

        const reconnect = async () => {
            if (retryCount < maxRetries) {
                retryCount++;
                log.info(`🔄 Reconnection attempt ${retryCount} of ${maxRetries}...`);

                try {
                    // Destroy the old client and reinitialize
                    await client.destroy();
                    await client.initialize(); // Reinitialize client

                    log.info('💡 Reconnected to WhatsApp client!');
                } catch (err) {
                    log.error('⚠️ Failed to reconnect:', err);
                    setTimeout(reconnect, retryDelay * retryCount); // Exponential backoff (increase delay with each retry)
                }
            } else {
                log.error('⚠️ Maximum reconnection attempts reached. Please check the server or network.');
            }
        };

        reconnect(); // Trigger the reconnection attempts
    });

    try {
        await client.initialize(); // Initialize the client
    } catch (err) {
        log.error('❌ Failed to initialize WhatsApp client:', err);
    }

    return client;
}

module.exports = createClient;
