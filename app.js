const express = require('express');
const { OpenAI } = require('openai');
const {Client, MessageMedia} = require("whatsapp-web.js");
const path = require('path');
const { exec } = require('child_process');
const fs = require('fs');
const qrcode = require('qrcode-terminal');
const dotevn = require('dotenv');
const ffmpeg = require('fluent-ffmpeg');
const { text } = require('stream/consumers');
const ffmpegPath = require('@ffmpeg-installer/ffmpeg').path;
ffmpeg.setFfmpegPath(ffmpegPath);
dotevn.config();

const app = express();

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

const client = new Client();

client.on('qr', (qr) => {
    qrcode.generate(qr, {small: true});
});

client.on('ready', () => {
    console.log('Client is ready!');
});

// 🛠️ Convert OPUS to WAV (FFmpeg Alternative)
async function convertOpusToWav(inputPath) {
    return new Promise((resolve, reject) => {
        const outputPath = inputPath.replace('.opus', '.wav');

        ffmpeg(inputPath)
            .audioCodec('pcm_s16le')
            .audioFrequency(16000)
            .audioChannels(1)
            .format('wav')
            .on('end', () => {
                console.log(`✅ Conversion Successful: ${outputPath}`);
                resolve(outputPath);
            })
            .on('error', (err) => {
                console.error('❌ Conversion Error:', err);
                reject(err);
            })
            .save(outputPath);
    });
}

// 🛠️ Transcribe Audio with OpenAI Whisper (Auto-Retry Enabled)
async function transcribeAudio(wavFilePath) {
    for (let attempt = 1; attempt <= 3; attempt++) {
        try {
            console.log(`📝 Transcribing voice note... (Attempt ${attempt})`);
            
            // Check Internet Connection
            if (!(await isInternetConnected())) {
                console.warn("⚠️ No internet connection. Retrying in 3 seconds...");
                await new Promise(resolve => setTimeout(resolve, 3000));
                continue;
            }

            const transcription = await openai.audio.transcriptions.create({
                file: fs.createReadStream(wavFilePath),
                model: 'whisper-1',
            });
            
            console.log("✅ Transcription successful:", transcription.text);
            return transcription.text;
        } catch (error) {
            if (error.code === 'ECONNRESET' && attempt < 3) {
                console.warn(`⚠️ Connection reset. Retrying (${attempt}/3)...`);
                await new Promise(resolve => setTimeout(resolve, 2000));
            } else {
                console.error("❌ Whisper Transcription Error:", error);
                return null;
            }
        }
    }
}

// 🛠️ Chat with GPT-4o for AI Response
async function chatWithAI(text) {
    try {
        const aiResponse = await openai.chat.completions.create({
            model: 'gpt-4o-mini',
            messages: [{ role: 'user', content: text }],
            store: true,
        });
        console.log("🤖 AI Response:", aiResponse.choices[0].message.content);
        return aiResponse.choices[0].message.content;
    } catch (error) {
        console.error("❌ AI Chat Error:", error);
        return null;
    }
}

// 🛠️ Check if Internet Connection is Active
async function isInternetConnected() {
    return new Promise((resolve) => {
        require('dns').resolve('www.google.com', (err) => {
            resolve(!err);
        });
    });
}

client.on('message', async (msg) => {
    try {
        // Check if message contains media
        if (msg.hasMedia) {
            console.log("📥 Media message received...");

            // Attempt to download media
            const media = await msg.downloadMedia();
            
            if (!media || !media.data) {
                console.error("❌ Error: Media is undefined or empty.");
                return msg.reply("⚠️ Sorry, I couldn't download the media.");
            }

            // Check if it's a voice note
            if (media.mimetype.startsWith('audio/ogg') || media.mimetype.startsWith('audio/PTT') || media.filename?.endsWith('.opus')) {
                console.log("🎙️ Voice note detected...");

                // Save OPUS file
                const fileName = `voice_${Date.now()}.opus`;
                const filePath = path.join(__dirname, `./voice_notes/${fileName}`);
                fs.writeFileSync(filePath, media.data, 'base64');

                // Convert OPUS to WAV
                const wavFilePath = await convertOpusToWav(filePath);
                if (!wavFilePath) {
                    return msg.reply("⚠️ Error: Failed to convert voice note.");
                }

                // Transcribe with Whisper
                const transcription = await transcribeAudio(wavFilePath);
                if (!transcription) {
                    return msg.reply("⚠️ Sorry, I couldn't process the transcription.");
                }

                // Process response with GPT-4o
                const aiResponse = await chatWithAI(transcription);
                if (!aiResponse) {
                    return msg.reply("⚠️ AI response failed. Try again.");
                }

                await msg.reply(aiResponse);

                // Clean up temp files
                fs.unlinkSync(filePath);
                fs.unlinkSync(wavFilePath);
            }
        }else{
            const aiResponse = await chatWithAI(msg.body);
            if (!aiResponse) {
                return msg.reply("⚠️ AI response failed. Try again.");
            }

            await msg.reply(aiResponse);
        }
    } catch (error) {
        console.error("❌ Unexpected Error:", error);
        msg.reply("⚠️ Sorry, there was an error processing your request.");
    }
});

client.initialize();


app.listen(3000, () => {
     console.log('whatsapp chatbot server running...')
})