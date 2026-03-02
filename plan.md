# VoiceDish Architecture Plan: Go + Next.js

## 1. Introduction
This document outlines the architecture, technology stack, and implementation plan for **VoiceDish**, transitioning from a monolithic Node.js prototype to a robust, scalable **Golang (Backend) + Next.js (Frontend)** architecture.

## 2. Technology Stack

### Backend (Golang)
*   **Language:** Go (1.21+) - Chosen for its massive concurrency (goroutines), minimal memory footprint, and high-performance compilation. Ideal for the "Zero-Latency" requirement when handling high-volume WhatsApp Webhooks.
*   **Framework:** Gin (`github.com/gin-gonic/gin`) - A lightweight, blazing-fast web framework with excellent routing and middleware support.
*   **Database Access:** `pgx` (PostgreSQL Driver and Toolkit) or `GORM` (Object-Relational Mapper) for structured data access.

### Frontend (Next.js)
*   **Framework:** Next.js (App Router) - For the Merchant Dashboard, providing Server-Side Rendering (SSR) for fast initial loads, SEO, and optimal performance on low-end devices often found in cafeterias.
*   **Language:** TypeScript - For type safety and better developer experience.
*   **Styling:** Tailwind CSS - For rapid UI development.
*   **Real-time:** Supabase Realtime (for MVP) or WebSockets/Server-Sent Events (SSE) (for Production) to instantly push new orders to the dashboard.

### Infrastructure & AI
*   **Database (MVP):** Supabase (Free Tier) - Provides instant PostgreSQL, `pgvector` for semantic menu search, and a Realtime API. Highly cost-effective for validation.
*   **Database (Production/UAE Compliance):** Self-hosted PostgreSQL or Cloud-hosted PostgreSQL in a UAE region (e.g., AWS `me-south-1` (Bahrain/UAE), Azure UAE North, or local bare-metal servers) to strictly comply with UAE data residency laws.
*   **AI Models:** Groq (Whisper-large-v3 for transcription, Llama 3.3 70B for JSON extraction).
*   **Messaging:** Meta WhatsApp Cloud API (Coexistence API).

## 3. Data Residency & UAE Law Compliance (Crucial)

The UAE has strict data protection laws, specifically regarding personal data.

*   **MVP Phase (Supabase):** While Supabase is excellent for rapid prototyping, its default regions may not reside within the UAE. For the MVP, we will use mock or anonymized PII (Personally Identifiable Information) where possible, focusing on order processing speed rather than long-term data storage. We will clearly communicate to merchants that this is a beta phase.
*   **Production Phase (Data Localization):** To fully comply with UAE data residency requirements (often mandating that citizen/resident data must not leave the country without explicit consent or specific safeguards), we *must* migrate off the shared Supabase tier.
    *   **Solution:** We will deploy a dedicated PostgreSQL instance on a cloud provider with a physical presence in the UAE (e.g., Azure UAE Central, AWS Middle East) or use the local home server (gaming PC) as originally planned, ensuring the physical database resides within UAE borders. The Go backend's use of standard Postgres drivers (`pgx`/`database/sql`) makes this migration seamless.

## 4. Implementation Plan

### Phase 1: Foundation (Current Step)
1.  Restructure repository to separate `backend/` and `frontend/` directories.
2.  Initialize the Go module with the Gin framework.
3.  Initialize the Next.js frontend with TypeScript and Tailwind CSS.
4.  Establish basic health check endpoints and static pages.

### Phase 2: Core Backend Logic (Go)
1.  Implement the WhatsApp Webhook receiver in Gin.
2.  Integrate the Groq SDK/API for audio transcription (Whisper).
3.  Implement the Llama 3.3 integration for JSON extraction from transcripts.
4.  Set up the database connection pool (`pgx` or `gorm`) to Supabase (MVP).

### Phase 3: Merchant Dashboard (Next.js)
1.  Create the real-time order feed UI.
2.  Implement order status management (Accept, Reject, Ready).
3.  Integrate real-time updates (Supabase Realtime or custom SSE from Go).

### Phase 4: Migration & Production
1.  Provision UAE-compliant PostgreSQL database.
2.  Migrate schema and data from Supabase.
3.  Update Go backend connection strings.
4.  Deploy Go backend and Next.js frontend to production infrastructure.
