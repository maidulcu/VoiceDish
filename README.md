# 🎙️ VoiceDish: AI-Powered WhatsApp Ordering for the UAE
**The "Invisible" SaaS for Cafeterias, Restaurants, and Groceries.**

VoiceDish is a high-speed, voice-first ordering bridge that integrates with existing WhatsApp numbers. It solves the "Address Struggle" and "Language Barrier" by converting messy voice notes (Bangla, Arabic, Urdu, English) into structured JSON orders with precise Google Maps locations.

---

## 🚀 Key Features
- **Shadow AI:** Works on the restaurant's existing WhatsApp Business number—no new app required.
- **Multilingual NLP:** Powered by **Groq (Whisper-large-v3)** for near-instant transcription of regional dialects and accents.
- **Auto-Location Mapping:** Automatically prompts for a WhatsApp Location Pin and links it to the active order.
- **Zero-Latency Processing:** Leverages Groq LPUs for sub-second order extraction using **Llama 3.3 70B**.
- **Persistence:** Local SQLite storage for order tracking and fulfillment.

---

## 🛠️ Technical Details & Stack

### Core Technologies
- **Runtime:** Node.js 20+
- **Backend Framework:** Express.js
- **Database:** SQLite3 (Local persistence)
- **Messaging:** WhatsApp Business Cloud API (v21.0)
- **AI Infrastructure:** [Groq SDK](https://groq.com/)

### AI Pipeline
1. **ASR (Speech-to-Text):** `whisper-large-v3` handles multi-dialect audio files (.ogg) downloaded from Meta's CDN.
2. **NLU (Extraction):** `llama-3.3-70b-versatile` processes the transcript with a specialized system prompt and mock menu context to return structured JSON.

### Database Schema (`orders.db`)
The system maintains an `orders` table with:
- `id`: Unique Order ID
- `user_phone`: Customer's WhatsApp number
- `items`: JSON array of extracted food items
- `total_price`: Estimated cost
- `location_lat/long`: Precise GPS coordinates
- `google_maps_link`: Shareable link for delivery drivers
- `status`: `pending` or `confirmed`

---

## 🏗️ How It Works (The Flow)

1. **User Interaction:** Customer sends a voice note to the restaurant (e.g., *"I want 2 chicken biryani and one karak"*).
2. **Webhook Ingress:** The server receives a POST request from Meta with the media ID.
3. **Media Processing:** The server downloads the `.ogg` file from Meta and pipes it to **Groq Whisper**.
4. **Order Extraction:** The resulting transcript is analyzed by **Llama 3.3**, matching it against the restaurant's menu.
5. **Session Management:** A "Pending" order is created in SQLite.
6. **Confirmation & Location Request:** The bot sends a summary back to the user via WhatsApp with an **Interactive Location Request** button.
7. **Fulfillment:** Once the user shares their location, the system updates the latest pending order with the GPS coordinates and notifies the merchant.

### 🔌 POS Integration (Planned)
VoiceDish is designed to work as a plug-and-play add-on for existing POS systems like **PausePOS**.
- **Menu Sync**: Pulls live inventory from POS.
- **Order Injection**: Pushes orders directly to KDS.
See [Integration Plan](file:///Users/maidul/.gemini/antigravity/brain/f71895da-cbf1-4fbe-9e9d-233d99f18cac/integration_plan.md) for details.

---

## 💻 Getting Started

### Prerequisites
- Node.js installed
- A Meta Developer App with WhatsApp Business API configured
- A Groq API Key

### Installation
1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Setup environment variables:
   ```bash
   cp .env.example .env
   # Edit .env with your keys:
   # WHATSAPP_TOKEN, WHATSAPP_PHONE_ID, VERIFY_TOKEN, GROQ_API_KEY
   ```

### Running Locally
```bash
# Start development server with nodemon
npm run dev

# Expose to internet (for WhatsApp Webhooks)
ngrok http 3000
```

### ☁️ Deployment & Requirements
**VoiceDish is extremely lightweight** because all heavy AI processing is offloaded to Groq's cloud LPUs.

- **Minimum RAM:** 512MB (1GB Recommended)
- **CPU:** 1 vCPU is sufficient
- **Disk:** 1GB+ (mainly for OS + Logs + SQLite DB)
- **Traffic:** Can handle 100+ concurrent orders on a $5/mo VPS.

**Recommended Setup:**
- **Server:** Any VPS (DigitalOcean Droplet, Hetzner, AWS t3.micro).
- **Process Manager:** Use `pm2` to keep the app running.
- **Reverse Proxy:** Nginx (handling the subdomain `voice.your-pos.com`).
- **SSL:** Certbot (free via Let's Encrypt).

### 🚀 Automated Deployment Guide

We offer three ways to deploy. Choose the one that fits your workflow.

#### 1. Configure Server Details
Edit `deploy-config.sh` with your server's IP and SSH Key:
```bash
SSH_USER="ubuntu"
SSH_IP="192.168.1.1"
SSH_KEY="/path/to/key.pem"
DEPLOY_DIR="/home/ubuntu/voicedish"
```

#### 2. Choose Method

| Method | Command | Pros | Cons |
| :--- | :--- | :--- | :--- |
| **Direct Git** | `npm run deploy` | Standard, Easy update | Runs `npm install` on server (CPU usage) |
| **Docker Image** | `npm run deploy:docker` | Zero server CPU, Exact environment | Uploads large file (~100MB) |
| **Zip Source** | `npm run deploy:zip` | Fast upload, Cleaner than git | Runs `docker build` on server |

---

#### 🅰️ Method A: Direct Git Deployment
 SSHs into server, pulls latest code, installs dependencies, and restarts PM2.
```bash
npm run deploy
```

#### 🅱️ Method B: Zero-Stress Docker Deployment (Recommended)
Builds the image on your local machine (Mac), uploads the compressed tarball, and runs it.
```bash
npm run deploy:docker
```
*Note: This creates a `orders.db` volume on the server so you don't lose data.*

#### 🆎 Method C: Zip Deployment
Zips the source code locally, uploads it, and builds the Docker container on the server.
```bash
npm run deploy:zip
```

---

## 💼 Project Summary
Developed by **Dynamic Web Lab FZE LLC**, VoiceDish demonstrates the power of sovereign AI in the UAE. It bridges the gap between traditional manual ordering and modern automation, allowing small businesses to handle high-volume orders without losing the personal touch of a voice interaction.
