VoiceDish MVP - Implementation Plan
Voice-first WhatsApp ordering system that converts voice notes to structured orders using Groq AI.

Tech Stack (Free & Fast)
Component	Choice	Cost
Runtime	Node.js 20 + Express	Free
AI - Transcription	Groq Whisper-large-v3	Free tier
AI - Extraction	Groq Llama 3.3 70B	Free tier
Database	SQLite (local) or Supabase	Free
Hosting	Railway / Render / Cloudflare Tunnel	Free tier
WhatsApp	Your existing Business API	✅ Already have
Proposed Changes
1. Project Setup
[NEW] 
package.json
Express server with webhook routes
Dependencies: express, axios, groq-sdk, dotenv
[NEW] 
.env.example
WHATSAPP_TOKEN, WHATSAPP_PHONE_ID, VERIFY_TOKEN
GROQ_API_KEY
2. Webhook Handler
[NEW] 
src/index.js
Express server on port 3000
GET /webhook - Meta verification endpoint
POST /webhook - Receive WhatsApp messages
[NEW] 
src/handlers/messageHandler.js
Route incoming messages by type (audio, text, location)
Download audio files from WhatsApp CDN
3. AI Integration
[NEW] 
src/services/transcription.js
Send .ogg audio to Groq Whisper API
Return transcribed text
[NEW] 
src/services/orderExtractor.js
Parse transcript with Llama 3.3
Extract: items, quantities, special requests
Return structured JSON order
4. WhatsApp Responses
[NEW] 
src/services/whatsapp.js
sendTextMessage() - Send order confirmation
sendLocationRequest() - Request location pin if missing
sendOrderSummary() - Format and send extracted order
Architecture Flow
Groq
Webhook
WhatsApp
User
Groq
Webhook
WhatsApp
User
Send voice note 🎤
POST /webhook (audio)
Download .ogg file
Whisper transcription
"2 chicken biryani, 1 chai"
Llama extraction
{items: [...], total: 2}
Send order summary
✅ Order received!
Verification Plan
End-to-End Test
Start server: npm run dev
Expose via ngrok: ngrok http 3000
Update WhatsApp webhook URL in Meta Console
Send voice note from phone: "I want 2 chicken biryani and one chai"
Expected: Receive formatted order confirmation back
Manual Verification Checklist
 Webhook verification (GET /webhook) returns challenge
 Audio messages trigger transcription
 Non-audio messages get polite response
 Order extraction returns valid JSON
 Missing location triggers location request
Quick Start Commands
# Install dependencies
npm install
# Copy environment file
cp .env.example .env
# Edit .env with your keys
# Start development server
npm run dev
# Expose to internet (separate terminal)
ngrok http 3000
TIP

Free Hosting Options:

Cloudflare Tunnel - If running on your gaming PC (as mentioned in README)
Railway.app - 500 hours free/month
Render.com - Free tier with auto-sleep