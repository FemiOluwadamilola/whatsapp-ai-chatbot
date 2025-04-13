const fs = require('fs');
const path = require('path');
const logger = require('./logger');

const ensureDirExists = (dirPath) => {
    if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath);
        logger.info(`Created directory: ${dirPath}`);
    }
};

const cleanOldFiles = (dir, maxAgeMinutes = 10) => {
    const now = Date.now();
    fs.readdirSync(dir).forEach(file => {
        const filePath = path.join(dir, file);
        const stats = fs.statSync(filePath);
        const ageMinutes = (now - stats.mtimeMs) / (1000 * 60);
        if (ageMinutes > maxAgeMinutes) {
            fs.unlinkSync(filePath);
            logger.info(`Deleted old file: ${filePath}`);
        }
    });
};

module.exports = { ensureDirExists, cleanOldFiles };
