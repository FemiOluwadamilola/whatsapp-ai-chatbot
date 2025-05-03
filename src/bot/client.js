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

    client.on('qr', (qr) => qrcode.generate(qr, { small: true }));

    client.on('authenticated', () => {
        log.info('✅ WhatsApp session authenticated.');
    });

    client.on('auth_failure', (msg) => {
        log.error('❌ Authentication failure:', msg);
    });

    client.on('ready', () => {
        log.info('🚀 WhatsApp bot is ready.');
    });

    client.on('remote_session_saved', () => {
        log.info('💾 Remote session saved to MongoDB.');
    });

    client.on('message', (msg) => handleMessage(msg, client));

    client.on('disconnected', async (reason) => {
        log.warn(`⚠️ WhatsApp client was disconnected. Reason: ${reason}`);

        try {
            log.info('♻️ Reinitializing WhatsApp client...');
            await client.destroy(); // Properly clean up old client
            await client.initialize(); // Reinitialize client
        } catch (err) {
            log.error('Failed to reinitialize client:', err);
        }
    });

    await client.initialize(); // Initialize the client

    return client;
}

module.exports = createClient;
