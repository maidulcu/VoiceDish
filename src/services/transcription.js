const fs = require('fs');
const Groq = require('groq-sdk');
const { downloadMedia } = require('./whatsapp');

const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY,
});

/**
 * Transcribe audio from WhatsApp using Groq Whisper
 */
async function transcribeAudio(mediaId) {
    let filePath;
    try {
        // 1. Download the file locally
        filePath = await downloadMedia(mediaId);

        // 2. Send to Groq for transcription
        const transcription = await groq.audio.transcriptions.create({
            file: fs.createReadStream(filePath),
            model: 'whisper-large-v3',
            // Optional: language: 'en', // or 'ar' etc depending on dominant user base
            response_format: 'json',
        });

        return transcription.text;
    } catch (error) {
        console.error('Groq Transcription Error:', error);
        throw error;
    } finally {
        // Clean up local file
        if (filePath && fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }
    }
}

module.exports = {
    transcribeAudio,
};
