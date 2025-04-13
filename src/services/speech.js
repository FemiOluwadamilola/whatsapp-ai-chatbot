const { AssemblyAI } = require("assemblyai");
const ffmpeg = require("fluent-ffmpeg");
const logger = require("../utils/logger");

const assemblyai = new AssemblyAI({ apiKey: process.env.ASSEMBLYAI_API_KEY });

const convertOpusToWav = (inputPath) => {
    return new Promise((resolve, reject) => {
        const outputPath = inputPath.replace('.opus', '.wav');
        ffmpeg(inputPath)
            .audioCodec('pcm_s16le')
            .audioFrequency(16000)
            .audioChannels(1)
            .format('wav')
            .on('end', () => resolve(outputPath))
            .on('error', err => {
                logger.error(`FFmpeg Error: ${err}`);
                reject(err);
            })
            .save(outputPath);
    });
};

const speechToText = async (wavPath) => {
    try {
        const fileBuffer = require("fs").readFileSync(wavPath);
        const response = await assemblyai.transcripts.transcribe({ audio: fileBuffer });
        return response.text;
    } catch (err) {
        logger.error(`Speech-to-Text Error: ${err.message}`);
        return null;
    }
};

module.exports = { convertOpusToWav, speechToText };
