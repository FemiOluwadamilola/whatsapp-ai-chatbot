const mongoose = require('mongoose');
const log = require('../utils/logger');
const alertAdmin = require('../utils/alertAdmin');
const dotenv = require('dotenv');
dotenv.config();   

let mongoURI;

if(process.env.NODE_ENV === 'development'){
    mongoURI = process.env.MAGFARM_DB_URL; 
}else{
    mongoURI = process.env.MAGFARM_DB_URL_REMOTE; 
}

async function dbConnection() {
    try {
        await mongoose.connect(mongoURI); 
        log.info('MongoDB connected successfully!');
    } catch (error) {
        log.error('Error connecting to MongoDB:', error);
        await alertAdmin(`Error connecting to MongoDB: ${error.message}`);
        throw error;
    }
}

module.exports = dbConnection;
