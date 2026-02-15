const axios = require('axios');
const fs = require('fs');
const path = require('path');
const os = require('os');

const WHATSAPP_TOKEN = process.env.WHATSAPP_TOKEN;
const WHATSAPP_PHONE_ID = process.env.WHATSAPP_PHONE_ID;

/**
 * Send a simple text message via WhatsApp
 */
async function sendTextMessage(to, text) {
    try {
        const response = await axios.post(
            `https://graph.facebook.com/v21.0/${WHATSAPP_PHONE_ID}/messages`,
            {
                messaging_product: 'whatsapp',
                recipient_type: 'individual',
                to: to,
                type: 'text',
                text: { body: text },
            },
            {
                headers: {
                    'Authorization': `Bearer ${WHATSAPP_TOKEN}`,
                    'Content-Type': 'application/json',
                },
            }
        );
        return response.data;
    } catch (error) {
        console.error('Error sending WhatsApp message:', error.response?.data || error.message);
        throw error;
    }
}

/**
 * Send a location request message via WhatsApp
 * Note: Uses interactive message type if available, or text fallback
 */
async function sendLocationRequest(to, text) {
    try {
        const response = await axios.post(
            `https://graph.facebook.com/v21.0/${WHATSAPP_PHONE_ID}/messages`,
            {
                messaging_product: 'whatsapp',
                recipient_type: 'individual',
                to: to,
                type: 'interactive',
                interactive: {
                    type: "location_request_message",
                    body: {
                        text: text
                    },
                    action: {
                        name: "send_location"
                    }
                }
            },
            {
                headers: {
                    'Authorization': `Bearer ${WHATSAPP_TOKEN}`,
                    'Content-Type': 'application/json',
                },
            }
        );
        return response.data;
    } catch (error) {
        console.error('Error sending location request:', error.response?.data || error.message);
        // Fallback to text if interactive message fails
        return sendTextMessage(to, text + " (Please use the attachment icon to share your location)");
    }
}

/**
 * Download media from WhatsApp CDN
 * Returns local path to the file
 */
async function downloadMedia(mediaId) {
    try {
        // 1. Get media URL
        const mediaResponse = await axios.get(
            `https://graph.facebook.com/v21.0/${mediaId}`,
            {
                headers: { 'Authorization': `Bearer ${WHATSAPP_TOKEN}` },
            }
        );

        const downloadUrl = mediaResponse.data.url;

        // 2. Download the actual file
        const fileResponse = await axios.get(downloadUrl, {
            headers: { 'Authorization': `Bearer ${WHATSAPP_TOKEN}` },
            responseType: 'arraybuffer',
        });

        const tempDir = os.tmpdir();
        const fileName = `whatsapp_audio_${mediaId}.ogg`;
        const filePath = path.join(tempDir, fileName);

        fs.writeFileSync(filePath, Buffer.from(fileResponse.data));
        console.log(`Media downloaded to: ${filePath}`);

        return filePath;
    } catch (error) {
        console.error('Error downloading WhatsApp media:', error.response?.data || error.message);
        throw error;
    }
}

module.exports = {
    sendTextMessage,
    sendLocationRequest,
    downloadMedia,
};
