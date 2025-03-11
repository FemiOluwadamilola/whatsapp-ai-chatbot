const express = require('express');
// const { OpenAI } = require('openai');
const fs = require('fs');
const {Client} = require("whatsapp-web.js");
const qrcode = require('qrcode-terminal');
const dotevn = require('dotenv');
const app = express();
dotevn.config();


// const openai = new OpenAI({
//     apiKey: process.env.OPENAI_API_KEY
// });

const client = new Client();

client.on('qr', (qr) => {
    qrcode.generate(qr, {small: true});
});

client.on('ready', () => {
    console.log('Client is ready!');
});

client.on('message', async (msg) => {
   try {
     if(msg.hasMedia) {
         const media = await msg.downloadMedia();
        if(media.mimetype.startsWith('audio/ogg')) {
            const filename = media.filename || `voice_note_${Date.now()}.ogg`;
            console.log('Received a voice note:', filename);

            // Save the file locally
            const filePath = `./voice_notes/${filename}`;
            fs.writeFileSync(filePath, media.data, 'base64');

            console.log(`Voice note saved at: ${filePath}`);

    //     const transcription = await openai.audio.transcriptions.create({
    //         file: fs.createReadStream(media),
    //         model: "whisper-1",
    //         });
            
    //     const audioMsg = transcription.text;

    //     const ai = await openai.chat.completions.create({
    //     model: "gpt-4o-mini",
    //     messages: [
    //         {
    //             role: "user",
    //             content: audioMsg,
    //         },
    //     ],
    //     store: true,
    // });
    //     return msg.reply(ai.choices[0].message.content);
    }
  }
    // const ai = await openai.chat.completions.create({
    //     model: "gpt-4o-mini",
    //     messages: [
    //         {
    //             role: "user",
    //             content: msg.body,
    //         },
    //     ],
    //     store: true,
    // });
    // return msg.reply(ai.choices[0].message.content);
   }catch (err) {
       console.log(err);
   }
});

client.initialize();


app.listen(3000, () => {
     console.log('whatsapp chatbot server running...')
})