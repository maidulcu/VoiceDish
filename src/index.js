require('dotenv').config();
const express = require('express');
const { db } = require('./services/database');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// Main webhook verification endpoint
app.get('/webhook', (req, res) => {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    if (mode && token) {
        if (mode === 'subscribe' && token === process.env.VERIFY_TOKEN) {
            console.log('WEBHOOK_VERIFIED');
            res.status(200).send(challenge);
        } else {
            res.sendStatus(403);
        }
    }
});

// Post webhook for receiving messages
app.post('/webhook', async (req, res) => {
    console.log('Received WhatsApp webhook:', JSON.stringify(req.body, null, 2));

    // WhatsApp sends a lot of different things, we only care about messages
    const entry = req.body.entry?.[0];
    const changes = entry?.changes?.[0];
    const value = changes?.value;
    const messages = value?.messages;

    if (messages && messages.length > 0) {
        // Acknowledge receipt immediately to avoid WhatsApp retries
        res.status(200).send('EVENT_RECEIVED');

        // Process messages asynchronously
        const { handleMessage } = require('./handlers/messageHandler');
        for (const message of messages) {
            try {
                await handleMessage(message);
            } catch (error) {
                console.error('Error handling message:', error);
            }
        }
    } else {
        // If it's not a message (e.g. status update), just acknowledge
        res.sendStatus(200);
    }
});

app.listen(PORT, () => {
    console.log(`VoiceDish server is running on port ${PORT}`);
});
