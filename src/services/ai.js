const { OpenAI } = require("openai");
const gTTS = require("gtts");
const ffmpeg = require("fluent-ffmpeg");
const path = require("path");
const fs = require("fs");
const logger = require("../utils/logger");

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const isAgricultureRelatedAI = async (text) => {
    try {
      const checkResponse = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are a topic classifier. Respond with "yes" if the message is about agriculture or planting. Otherwise respond with "no".'
          },
          {
            role: 'user',
            content: text
          }
        ]
      });
  
      const reply = checkResponse.choices[0].message.content.trim().toLowerCase();
      return reply.startsWith('yes');
    } catch (err) {
        logger.error(`AI Chat Error: ${err.message}`);
        return null;
    }
  }  

const chatWithAI = async (text) => {
    try {
        const response = await openai.chat.completions.create({
            model: 'gpt-4o-mini',
            messages: [{ role: 'user', content: text }]
        });
        return response.choices[0].message.content.trim().toLowerCase();
    } catch (err) {
        logger.error(`AI Chat Error: ${err.message}`);
        return null;
    }
};

const aiVoice = async (text, voiceNotesDir) => {
    return new Promise((resolve, reject) => {
        const mp3Path = path.join(voiceNotesDir, `response_${Date.now()}.mp3`);
        const opusPath = mp3Path.replace('.mp3', '.opus');
        const gtts = new gTTS(text, 'en');

        gtts.save(mp3Path, (err) => {
            if (err) {
                logger.error(`gTTS Error: ${err}`);
                return reject(err);
            }
            ffmpeg(mp3Path)
                .audioCodec('libopus')
                .audioBitrate(32)
                .format('opus')
                .on('end', () => {
                    fs.unlinkSync(mp3Path);
                    resolve(opusPath);
                })
                .on('error', (err) => {
                    logger.error(`FFmpeg Error: ${err}`);
                    reject(err);
                })
                .save(opusPath);
        });
    });
};

module.exports = { isAgricultureRelatedAI, chatWithAI, aiVoice };
