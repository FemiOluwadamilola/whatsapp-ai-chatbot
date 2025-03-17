const express = require('express');
const { OpenAI } = require('openai');
const { Client } = require("whatsapp-web.js");
const {AssemblyAI} = require("assemblyai");
const path = require('path');
const fs = require('fs');
const qrcode = require('qrcode-terminal');
const dotenv = require('dotenv');
const ffmpeg = require('fluent-ffmpeg');
const ffmpegPath = require('@ffmpeg-installer/ffmpeg').path;

ffmpeg.setFfmpegPath(ffmpegPath);
dotenv.config();

const app = express();

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const assemblyai = new AssemblyAI({
    apiKey: process.env.ASSEMBLYAI_API_KEY
});

const speechToText = async (audioFile) => {
        const params = {
        audio: audioFile,
        speaker_labels: true,
        };
    try {
      const transcript = await assemblyai.transcripts.transcribe(params);
  
      if (transcript.status === "error") {
        console.error(`Transcription failed: ${transcript.error}`);
        process.exit(1);
      }
  
      return transcript.text;
  
    //   if (transcript.utterances) {
    //     for (let utterance of transcript.utterances) {
    //       console.log(`Speaker ${utterance.speaker}: ${utterance.text}`);
    //     }
    //   }
    } catch (error) {
      console.error("Error transcribing audio:", error.message);
    }
  };
  
  
// ✅ Create voice_notes directory if it doesn't exist
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

// // 🛠️ Convert OPUS to WAV
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

// // 🛠️ Chat with GPT-4o
async function chatWithAI(text) {
    try {
        const aiResponse = await openai.chat.completions.create({
            model: 'gpt-4o-mini',
            messages: [{ role: 'user', content: text }],
        });

        console.log("🤖 AI Response:", aiResponse.choices[0].message.content);
        return aiResponse.choices[0].message.content;
    } catch (error) {
        console.error("❌ AI Chat Error:", error);
        return null;
    }
}

// // 📨 Handle WhatsApp Messages
client.on('message', async (msg) => {
    try {
        if (msg.hasMedia) {
            console.log("📥 Media message received...");

            const media = await msg.downloadMedia();
            if (!media || !media.data) {
                console.error("❌ Error: Media is undefined or empty.");
                return msg.reply("⚠️ Sorry, I couldn't download the media.");
            }

            if (media.mimetype.startsWith('audio/ogg') || media.mimetype.startsWith('audio/PTT') || media.filename?.endsWith('.opus')) {
                console.log("🎙️ Voice note detected...");

                const fileName = `voice_${Date.now()}.opus`;
                const filePath = path.join(voiceNotesDir, fileName);
                fs.writeFileSync(filePath, media.data, 'base64');

                const wavFilePath = await convertOpusToWav(filePath);
                if (!wavFilePath) return msg.reply("⚠️ Error: Failed to convert voice note.");

                const transcription = await speechToText(wavFilePath);
                if (!transcription) return msg.reply("⚠️ Sorry, I couldn't process the transcription.");

                const aiResponse = await chatWithAI(transcription);
                if (!aiResponse) return msg.reply("⚠️ AI response failed. Try again.");

                await msg.reply(aiResponse);

                // ✅ Cleanup temp files
                if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
                if (fs.existsSync(wavFilePath)) fs.unlinkSync(wavFilePath);
            }
        }else{
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

app.listen(3000, () => {
    console.log('🚀 WhatsApp chatbot server running on port 3000...');
});
