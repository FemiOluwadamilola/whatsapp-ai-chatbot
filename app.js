const express = require('express');
const { Configuration, OpenAIApi } = require('openai');
const fs = require('fs');
const {Client} = require("whatsapp-web.js");
const dotevn = require('dotenv');
dotevn.config();
const app = express();

const config = new Configuration({
    apiKey: process.env.OPENAI_API_KEY,
    timeout: 10000,
}); 

const openai = new OpenAIApi(config);

const client = new Client();



client.on('qr', (qr) => {
    // Generate and scan this code with your phone
    console.log('QR RECEIVED', qr);
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