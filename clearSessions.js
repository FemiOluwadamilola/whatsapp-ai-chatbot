require('dotenv').config();
const mongoose = require('mongoose');
const log = require('./src/utils/logger');

async function clearSessions() {
    try {
        // Connect to MongoDB
        const mongoURI = process.env.MAGFARM_DB_URL; 
        await mongoose.connect(mongoURI, {
            dbName: process.env.DB_NAME || 'whatsapp_sessions',
        });

        log.info('🧹 Connected to MongoDB for session cleanup...');

        // Delete all stored WhatsApp sessions
        const result = await mongoose.connection.db.collection('sessions').deleteMany({});
        log.info(`🗑️ Deleted ${result.deletedCount} session(s) from MongoDB.`);

        await mongoose.disconnect();
        log.info('✅ Disconnected from MongoDB after cleanup.');
    } catch (err) {
        log.error('❌ Failed to clear sessions:', err);
        process.exit(1);
    }
}

clearSessions();
