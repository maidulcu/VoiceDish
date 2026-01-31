# 🎙️ VoiceDish: AI-Powered WhatsApp Ordering for the UAE
**The "Invisible" SaaS for Cafeterias, Restaurants, and Groceries.**

VoiceDish is a high-speed, voice-first ordering bridge that integrates with existing WhatsApp numbers using Meta's **Coexistence API**. It solves the "Address Struggle" and "Language Barrier" by converting messy voice notes (Bangla, Arabic, Urdu, English) into structured JSON orders with precise Google Maps locations.

---

## 🚀 Key Features
- **Shadow AI:** Works on the restaurant's existing WhatsApp Business number—no new app required.
- **Multilingual NLP:** Powered by **Groq (Whisper-large-v3)** for near-instant transcription of regional dialects.
- **Auto-Location Mapping:** Automatically prompts for a WhatsApp Location Pin and generates a driver-ready Google Maps link.
- **Zero-Latency Processing:** Leverages Groq LPUs for sub-second order extraction.
- **Merchant Dashboard:** A lightweight PWA for high-volume shops to track orders in real-time.

---

## 🛠️ Tech Stack
- **AI Brain:** [Groq](https://groq.com/) (Whisper-large-v3 & Llama 3.3 70B)
- **Backend:** Laravel 11 / Node.js (Express)
- **Messaging:** WhatsApp Business Cloud API (Coexistence Mode)
- **Database:** PostgreSQL (with Vector search for menu matching)
- **Hosting:** Local Home Server (Gaming PC) via Cloudflare Tunnel (MVP)

---

## 🏗️ Architecture Flow
1. **Ingress:** Webhook receives a `.ogg` audio file from WhatsApp.
2. **Transcription:** Audio is sent to **Groq Whisper** via the `audio/transcriptions` endpoint.
3. **Extraction:** The transcript is passed to **Llama 3.3** with a specialized System Prompt to produce JSON.
4. **Validation:** System checks for missing location data; if missing, triggers a `location_request` button.
5. **Delivery:** Formatted order is pushed to the Restaurant via WhatsApp and the Web Dashboard.

---

## 💼 Business Vision
Developed by **Dynamic Web Lab FZE LLC**, VoiceDish is a showcase of Sovereign AI in the UAE, demonstrating how local businesses can automate without losing their personal touch or switching platforms.
