const mongoose = require('mongoose');
const log = require('../utils/logger');
const dotenv = require('dotenv');
dotenv.config();   

async function dbConnection() {
    const mongoURI = process.env.MAGFARM_DB_URL_REMOTE; 
    try {
        await mongoose.connect(mongoURI); 
        log.info('MongoDB connected successfully!');
    } catch (error) {
        log.error('Error connecting to MongoDB:', error);
        throw error;
    }
}

module.exports = dbConnection;
