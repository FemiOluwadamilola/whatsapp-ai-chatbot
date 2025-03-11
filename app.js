const express = require('express');
const qrcode = require('qrcode-terminal');
const { OpenAI } = require('openai');
const fs = require('fs');
const {Client} = require("whatsapp-web.js");
const dotevn = require('dotenv');
dotevn.config();
const app = express();


const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

const client = new Client();

// const chatbot = async (msg) => {   }

client.on('qr', (qr) => {
    // Generate and scan this code with your phone
    // console.log('QR RECEIVED', qr);
    qrcode.generate(qr, {small: true});
});

client.on('ready', () => {
    console.log('Client is ready!');
});

client.on('message', msg => {
    if (msg.body == '!ping') {
        msg.reply('pong');
    }
});

client.initialize();


app.listen(3000, () => {
     console.log('whatsapp chatbot server running...')
})