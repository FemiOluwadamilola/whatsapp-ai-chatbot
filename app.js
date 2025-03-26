const express = require('express');
const { OpenAI } = require('openai');
const { Client, MessageMedia } = require("whatsapp-web.js");
const { AssemblyAI } = require("assemblyai");
const { exec } = require('child_process');
const gTTS = require('gtts');
const path = require('path');
const fs = require('fs');
const qrcode = require('qrcode-terminal');
const dotenv = require('dotenv');
const ffmpeg = require('fluent-ffmpeg');
const ffmpegPath = require('@ffmpeg-installer/ffmpeg').path;

ffmpeg.setFfmpegPath(ffmpegPath);
dotenv.config();

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const assemblyai = new AssemblyAI({
    apiKey: process.env.ASSEMBLYAI_API_KEY
});

// ✅ Ensure voice_notes directory exists
const voiceNotesDir = path.join(__dirname, 'voice_notes');
if (!fs.existsSync(voiceNotesDir)) {
    fs.mkdirSync(voiceNotesDir);
}

const client = new Client();

client.on('qr', (qr) => {
    qrcode.generate(qr, { small: true });
});

client.on('ready', () => {
    console.log('✅ Client is ready!');
});

// 🛠️ Convert OPUS to WAV
async function convertOpusToWav(inputPath) {
    return new Promise((resolve, reject) => {
        const outputPath = inputPath.replace('.opus', '.wav');

        ffmpeg(inputPath)
            .audioCodec('pcm_s16le')
            .audioFrequency(16000)
            .audioChannels(1)
            .format('wav')
            .on('end', () => {
                console.log(`✅ Converted to WAV: ${outputPath}`);
                resolve(outputPath);
            })
            .on('error', (err) => {
                console.error('❌ FFmpeg Conversion Error:', err);
                reject(err);
            })
            .save(outputPath);
    });
}

// 🛠️ Chat with GPT-4o
async function chatWithAI(text) {
    try {
        const aiResponse = await openai.chat.completions.create({
            model: 'gpt-4o-mini',
            messages: [{ role: 'user', content: text }],
        });

        return aiResponse.choices[0].message.content;
    } catch (error) {
        console.error("❌ AI Chat Error:", error);
        return null;
    }
}

// 🗣️ Convert Text to Speech and Send Voice Note
async function aiVoice(text) {
    return new Promise((resolve, reject) => {
        console.log("🗣️ Converting text to speech...");

        const mp3FilePath = path.join(voiceNotesDir, `response_${Date.now()}.mp3`);
        const opusFilePath = mp3FilePath.replace('.mp3', '.opus');

        const gtts = new gTTS(text, 'en');
        gtts.save(mp3FilePath, (err) => {
            if (err) {
                console.error("❌ gTTS Error:", err);
                reject(err);
                return;
            }
            console.log(`🎙️ MP3 saved: ${mp3FilePath}`);

            // ✅ Use fluent-ffmpeg instead of exec
            ffmpeg(mp3FilePath)
                .audioCodec('libopus')
                .audioBitrate(32)
                .format('opus')
                .on('end', () => {
                    console.log(`✅ OPUS file created: ${opusFilePath}`);
                    fs.unlinkSync(mp3FilePath); // Cleanup MP3 file
                    resolve(opusFilePath);
                })
                .on('error', (err) => {
                    console.error("❌ FFmpeg Conversion Error:", err);
                    reject(err);
                })
                .save(opusFilePath);
        });
    });
}

// 🎙️ Speech-to-Text with AssemblyAI
async function speechToText(audioFilePath) {
    try {
        console.log("🎧 Processing audio for transcription...");

        const fileBuffer = fs.readFileSync(audioFilePath);
        const response = await assemblyai.transcripts.transcribe({ audio: fileBuffer });

        if (response.status === "error") {
            console.error(`❌ Transcription failed: ${response.error}`);
            return null;
        }

        return response.text;
    } catch (error) {
        console.error("❌ Error transcribing audio:", error.message);
        return null;
    }
}

// 📨 Handle WhatsApp Messages
client.on('message', async (msg) => {
    try {
        if (msg.hasMedia) {
            const media = await msg.downloadMedia();
            if (!media || !media.data) {
                return msg.reply("⚠️ Sorry, I couldn't download the media.");
            }

            if (media.mimetype.startsWith('audio/ogg') || media.mimetype.startsWith('audio/PTT') || media.filename?.endsWith('.opus')) {
                const fileName = `voice_${Date.now()}.opus`;
                const filePath = path.join(voiceNotesDir, fileName);
                fs.writeFileSync(filePath, media.data, 'base64');

                const wavFilePath = await convertOpusToWav(filePath);
                if (!wavFilePath) return msg.reply("⚠️ Error: Failed to convert voice note.");

                // await msg.chat.sendStateTyping(); // ✅ Notify user bot is processing

                const transcription = await speechToText(wavFilePath);
                if (!transcription) return msg.reply("⚠️ Sorry, I couldn't process the transcription.");

                const aiResponse = await chatWithAI(transcription);
                if (!aiResponse) return msg.reply("⚠️ AI response failed. Try again.");

                // Convert response to voice note
                const voiceNotePath = await aiVoice(aiResponse);
                if (!voiceNotePath) return msg.reply("⚠️ Sorry, I couldn't generate a voice response.");

                // Send the voice note
                const voiceNote = MessageMedia.fromFilePath(voiceNotePath);
                await client.sendMessage(msg.from, voiceNote, { sendAudioAsVoice: true });

                // ✅ Cleanup temp files
                if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
                if (fs.existsSync(wavFilePath)) fs.unlinkSync(wavFilePath);
            }
        } else {
            await msg.chat.sendStateTyping(); // ✅ Notify user bot is processing

            const aiResponse = await chatWithAI(msg.body);
            if (!aiResponse) return msg.reply("⚠️ AI response failed. Try again.");

            await msg.reply(aiResponse);
        }
    } catch (error) {
        console.error("❌ Unexpected Error:", error);
        msg.reply("⚠️ Sorry, there was an error processing your request.");
    }
});

client.initialize();
