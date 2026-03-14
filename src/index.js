require('dotenv').config();
const express = require('express');
const { db, getOrders, getOrderById, updateOrderStatus } = require('./services/database');
const { sendOrderStatusUpdate } = require('./services/whatsapp');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API Routes for Dashboard
app.get('/api/orders', async (req, res) => {
    try {
        const orders = await getOrders(50);
        res.json(orders);
    } catch (error) {
        console.error('Error fetching orders:', error);
        res.status(500).json({ error: 'Failed to fetch orders' });
    }
});

app.get('/api/orders/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const order = await getOrderById(id);
        if (!order) {
            return res.status(404).json({ error: 'Order not found' });
        }
        res.json(order);
    } catch (error) {
        console.error('Error fetching order:', error);
        res.status(500).json({ error: 'Failed to fetch order' });
    }
});

const VALID_STATUSES = ['pending', 'confirmed', 'preparing', 'delivered'];

app.patch('/api/orders/:id/status', async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        if (!VALID_STATUSES.includes(status)) {
            return res.status(400).json({ error: `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}` });
        }

        const order = await getOrderById(id);
        if (!order) {
            return res.status(404).json({ error: 'Order not found' });
        }

        await updateOrderStatus(id, status);

        // Send WhatsApp notification
        try {
            await sendOrderStatusUpdate(order.user_phone, status, id);
        } catch (waError) {
            console.error('Failed to send WhatsApp notification:', waError);
        }

        res.json({ success: true });
    } catch (error) {
        console.error('Error updating order status:', error);
        res.status(500).json({ error: 'Failed to update order status' });
    }
});

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

    // Validate webhook payload
    if (!req.body.entry || !Array.isArray(req.body.entry)) {
        console.log('Invalid webhook payload');
        return res.sendStatus(200);
    }

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
                // Validate message has required fields
                if (!message.from || !message.type) {
                    console.log('Skipping invalid message:', message);
                    continue;
                }
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
