const { sendTextMessage, sendLocationRequest } = require('../services/whatsapp');
const { transcribeAudio } = require('../services/transcription');
const { extractOrder } = require('../services/orderExtractor');
const { createOrder, getLatestPendingOrder, updateOrderLocation } = require('../services/database');

async function handleMessage(message) {
    const from = message.from; // User's phone number
    const type = message.type;

    console.log(`Processing ${type} message from ${from}`);

    if (type === 'audio') {
        return handleAudioMessage(message, from);
    } else if (type === 'text') {
        return handleTextMessage(message, from);
    } else if (type === 'location') {
        return handleLocationMessage(message, from);
    } else {
        console.log(`Unsupported message type: ${type}`);
        await sendTextMessage(from, "Sorry, I currently only support voice notes and text orders! 🎤🍔");
    }
}

async function handleAudioMessage(message, from) {
    try {
        const audioId = message.audio.id;

        // 1. Inform user we are processing
        await sendTextMessage(from, "Got your voice note! Processing your order... 🎙️");

        // 2. Transcribe audio
        const transcript = await transcribeAudio(audioId);
        console.log(`Transcript for ${from}: "${transcript}"`);

        if (!transcript || transcript.trim().length === 0) {
            return await sendTextMessage(from, "I couldn't quite hear that. Could you please send another voice note? 👂");
        }

        // 3. Extract order
        const order = await extractOrder(transcript);
        console.log(`Extracted order for ${from}:`, JSON.stringify(order, null, 2));

        // 4. Send summary and confirm
        await handleOrderProcessing(order, from);

    } catch (error) {
        console.error('Error in handleAudioMessage:', error);
        await sendTextMessage(from, "Something went wrong while processing your voice note. Please try again later.");
    }
}

async function handleTextMessage(message, from) {
    const text = message.text.body;
    const order = await extractOrder(text);
    await handleOrderProcessing(order, from);
}

async function handleLocationMessage(message, from) {
    const location = message.location;
    const mapsLink = `https://www.google.com/maps?q=${location.latitude},${location.longitude}`;
    console.log(`Received location from ${from}: ${mapsLink}`);

    try {
        const pendingOrder = await getLatestPendingOrder(from);
        if (pendingOrder) {
            await updateOrderLocation(pendingOrder.id, location.latitude, location.longitude, mapsLink);
            console.log(`Updated Order #${pendingOrder.id} with location.`);
            await sendTextMessage(from, `Got your location! 📍 Order #${pendingOrder.id} is now CONFIRMED. We'll deliver to: ${mapsLink}`);
        } else {
            // No pending order found
            await sendTextMessage(from, `Got your location! 📍 But I couldn't find a pending order for you. send a voice note to start a new order! 🎙️`);
        }
    } catch (error) {
        console.error('Error handling location message:', error);
        await sendTextMessage(from, "Sorry, something went wrong while saving your location. Please try again.");
    }
}

async function handleOrderProcessing(order, from) {
    if (!order.items || order.items.length === 0) {
        return await sendTextMessage(from, "I couldn't find any food items in your message. What would you like to order today?");
    }

    // Save to Database
    try {
        const orderId = await createOrder(from, order.items, order.total_price_estimate || "N/A");
        console.log(`Order saved to DB with ID: ${orderId}`);
    } catch (dbError) {
        console.error("Failed to save order to DB:", dbError);
        // Continue anyway to reply to user
    }

    // Format order summary
    let summary = "✅ *Order Summary:*\n\n";
    order.items.forEach(item => {
        summary += `- ${item.quantity}x ${item.name} ${item.notes ? `(${item.notes})` : ""}\n`;
    });

    if (order.total_price_estimate) {
        summary += `\n*Estimated Total:* ${order.total_price_estimate}`;
    }

    // Send summary
    await sendTextMessage(from, summary);

    // Send Location Request Button
    await sendLocationRequest(from, "Please share your location to complete the order");
}

module.exports = { handleMessage };
