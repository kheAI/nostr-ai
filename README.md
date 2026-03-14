# nostr-ai
 
This guide transforms the concept of **kheAI** into a functional, self-hosted intelligence terminal. Even for a "newbie," the key is to understand that we are building a **data factory**: Raw noise comes in, statistical filters clean it, and AI agents package it for sale.



## 1. The Foundation: UI & Protocol Scaffolding

**Goal:** Create the "Bloomberg-style" dashboard and the Nostr connection.

"Build a high-performance B2B intelligence dashboard called **kheAI**. The aesthetic should be 'Terminal Dark'—high-contrast, minimal, and data-dense.

Implement a sidebar for 'Live Infiltration' (the raw feed) and 'Intelligence Reports' (the analyzed leads). Integrate the **NDK** library to connect to public Nostr relays. Specifically, I want to listen for Kind 9735 (Zap Receipts).

Create a 'Signal Threshold' filter in the UI that defaults to 10,000 satoshis. Only display events that meet this threshold."



## 2. The "Data Vault": Database & Vector Storage

**Goal:** Ensure the data is persistent and searchable for the AI.

"Add a backend using **PostgreSQL** for relational data to handle concurrent connections between the Node.js worker and Python service safely, and a local vector store (**ChromaDB**) to store the context of zapped notes for semantic search.

Every time a high-value Zap is detected, save the following:

1. Sender and Receiver pubkeys.
2. The amount in sats.
3. The content of the original note (Kind 1) that was zapped.
4. The timestamp.

Write a function to check if the sender pubkey has a **NIP-05** identifier (e.g., name@domain.com) and display that identity instead of the hex code."



## 3. The AI Swarm: Agentic Reasoning

**Goal:** Implement the logic that separates "noise" from "intent."

"Integrate the **Gemini 3.1 Flash Lite API** to analyze high-value signals. When a 'Burst' of activity (e.g., a background task using APScheduler/Celery aggregating 3+ zaps to one pubkey over a 6-hour window) occurs, trigger an agentic debate loop with three personas:

1. **The Quant:** Analyzes the satoshi volume and frequency to determine if it’s a statistical outlier.
2. **The Profiler:** Summarizes the recipient’s recent activity to categorize their intent (e.g., Hiring, Infrastructure, Research).
3. **The Skeptic:** Looks for 'circular zapping' patterns (reciprocal payments) to flag potential reputation-farming.

Output a 'Confidence Score' from 0-100% and a 3-bullet point 'Executive Summary' for the lead using Gemini's Structured Outputs (JSON Schema) for reliable parsing."



## 4. The Graph: Visualizing the Economy

**Goal:** Show the "Attention Graph" rather than just a list of names.

"Add a 'Network Graph' view using **React Force Graph** or **Vis.js**.

Nodes should represent pubkeys, and edges should represent Zaps. The thickness of the edge should represent the total volume of sats exchanged.

Color-code the nodes:

- **Blue:** Verified builders (NIP-05).
- **Gold:** Known VCs/Whales (based on high-volume sending).
- **Grey:** Unknown/Anonymous.

Allow me to click a node to see their 'Developer Economic Reputation Score' calculated by unique zappers and total sats received."



## 5. The "Hero" Tier: Monetization & Delivery

**Goal:** Turn the platform into a revenue-generating service.

"Implement a **NIP-47 (Nostr Wallet Connect)** paywall.

Hide the full 'Intelligence Report' behind a 'Pay 500 Sats to Unlock' button. When clicked, it should trigger a Lightning payment request. Once settled, reveal the AI-generated lead summary.

Also, set up an automated notification system that sends a **NIP-17 Gift Wrap** message to my own pubkey whenever the 'Skeptic' agent gives a lead a Confidence Score higher than 85%."



## Pro-Tip for Vibe Coding

Platforms like these often "hallucinate" Nostr NIPs because the protocol evolves faster than their training data. If the code breaks:

**Tell it:** "Don't guess the NIP-57 structure. Use the standard Zap Receipt tags: 'p' for recipient, 'e' for the note, and the 'description' tag for the Zap Request."



---



## 🛠️ The Tech Stack (The "Lean & Mean" Selection)

| **Component**       | **Technology**              | **Why?**                                                   |
| ------------------- | --------------------------- | ---------------------------------------------------------- |
| **Relay/Ingestion** | NDK (TypeScript)            | Robust Nostr event subscription and parsing.               |
| **Backend API**     | Python (FastAPI)            | Native support for AI agents (LangGraph/LangChain).        |
| **Database**        | PostgreSQL + ChromaDB       | Safe concurrent connections and vector storage for context.|
| **Frontend**        | Next.js (Tailwind + Shadcn) | Rapid "Terminal" UI development with high-density data.    |
| **AI Engine**       | Gemini 3.1 Flash Lite       | The best price-to-performance ratio for "Swarm" reasoning. |



## 📂 MVP Directory Structure

```
nostr-ai/
├── services/
│   ├── firehose/          # TypeScript: Listens to relays, filters for >10k sats
│   │   ├── src/worker.ts  # Connects to relays via NDK
│   │   └── src/filter.ts  # Logic for "Intent-based" event capturing
│   ├── swarm-engine/      # Python: The AI Reasoning Hub
│   │   ├── agents/        # Quant.py, Profiler.py, Skeptic.py
│   │   ├── graph.py       # LangGraph state machine for agent debate
│   │   └── prompts.py     # System instructions for the personas
│   └── api/               # FastAPI: Serves the dashboard & paywall
├── web/                   # Next.js: The "Bloomberg" Terminal UI
│   ├── components/        # RadarChart, ZapFeed, IdentityCard
│   └── lib/               # Nostr Wallet Connect (NWC) hooks
└── docker-compose.yml     # Orchestrates db, api, web, and the firehose
```

**The Environment Configuration (`.env`)**

Create a file named `.env` in your **root directory** (the `nostr-ai/` folder). This centralizes your secrets and hardware settings.

```bash
# === API KEYS ===
# Get this from https://aistudio.google.com/
GEMINI_API_KEY=your_gemini_api_key_here

# === NOSTR SETTINGS ===
# The minimum zap amount to trigger the AI Swarm (in satoshis)
ZAP_THRESHOLD_SATS=10000

# === DATABASE ===
# PostgreSQL connection string
DATABASE_URL=postgresql://kheai:kheai_pass@db:5432/kheai_db

# === WEB SETTINGS ===
# Port for your Next.js Dashboard
PORT=3000
# URL of your Swarm API (Internal Docker network)
SWARM_API_URL=http://swarm-engine:8000
```

**The Master `package.json` (Root Folder)**

This file sits in your **root `nostr-ai/` directory**. It doesn't contain code; it acts as the "Remote Control" for your Docker containers.

```json
{
  "name": "kheai-system",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "launch": "docker-compose up --build -d",
    "stop": "docker-compose down",
    "logs": "docker-compose logs -f",
    "logs:firehose": "docker-compose logs -f firehose",
    "logs:swarm": "docker-compose logs -f swarm-engine",
    "clean": "docker-compose down -v"
  }
}
```





## Phase 1: Setting Up the Engine Room (Infrastructure)

Before writing logic, you need a place for the data to live. Since we are dealing with high-frequency Nostr events, we use Docker to keep our "Firehose" and "Brain" separated.

1. **Install Docker:** Ensure Docker and Docker Compose are installed on your machine (or your Raspberry Pi/Jetson Nano).
2. **Create the Workspace:** Open your terminal and run:
   - `mkdir nostr-ai && cd nostr-ai`
   - Create the folders: `mkdir -p services/firehose services/swarm-engine data web`
3. **Deploy the Orchestrator:** Create the `docker-compose.yml` file provided in the previous step in the root directory. This file acts as the "Manager," telling the different services how to talk to each other and where to save data on your SSD.



The Infrastructure: `docker-compose.yml`

This sets up your local environment, ensuring the ingestion engine, the AI reasoning engine, and the web frontend run side-by-side without bottlenecking your hardware.

```yaml
version: '3.8'

services:
  db:
    image: postgres:15
    restart: always
    environment:
      POSTGRES_USER: kheai
      POSTGRES_PASSWORD: kheai_pass
      POSTGRES_DB: kheai_db
    volumes:
      - ./data/pg:/var/lib/postgresql/data
    ports:
      - "5432:5432"

  firehose:
    build: ./services/firehose
    restart: unless-stopped
    depends_on:
      - db
    environment:
      - ZAP_THRESHOLD_SATS=10000
      - DATABASE_URL=postgresql://kheai:kheai_pass@db:5432/kheai_db

  swarm-engine:
    build: ./services/swarm-engine
    restart: unless-stopped
    depends_on:
      - db
    environment:
      - GEMINI_API_KEY=${GEMINI_API_KEY}
      - DATABASE_URL=postgresql://kheai:kheai_pass@db:5432/kheai_db
    ports:
      - "8000:8000"

  web:
    build: ./web
    restart: unless-stopped
    ports:
      - "3000:3000"
    environment:
      - SWARM_API_URL=http://swarm-engine:8000
```





## Phase 2: Building the Firehose (Ingestion)

The Ingestion Worker (`services/firehose`)

This is a lightweight service that keeps your database populated. It shouldn't do any "thinking"—only "watching."

- **Action:** Subscribes to `Kind 9735` (Zaps).
- **Logic:** If `zap_amount > 10,000`, extract the `e` tag from the Zap Request (Kind 9734) to fetch the actual `Kind 1` (Note) and the `Kind 0` (Profile) of both parties.
- **Storage:** Write to the PostgreSQL `events` table.

The Firehose is your "eyes." Its only job is to watch the Nostr protocol and grab the "Gold" (high-value zaps).

**Initialize the Project:** Inside `services/firehose`, run `npm init -y` and install the dependencies:

- `npm install @nostr-dev-kit/ndk pg typescript light-bolt11-decoder`

**The Logic Loop**

The Ingestion Worker: `services/firehose/index.ts`

This script uses the Nostr Development Kit (NDK) to listen strictly for NIP-57 Zap Receipts. It extracts the satoshi amount using a real BOLT11 decoder, fetches the associated Note and Profiles, and saves high-value targets.

```typescript
import NDK, { NDKEvent, NDKFilter } from "@nostr-dev-kit/ndk";
import { Client } from 'pg';
import { decode } from 'light-bolt11-decoder';

// 1. Initialize PostgreSQL Database connection
const db = new Client({
  connectionString: process.env.DATABASE_URL
});
await db.connect();

await db.query(`
  CREATE TABLE IF NOT EXISTS high_value_zaps (
    id TEXT PRIMARY KEY,
    sender_pubkey TEXT,
    receiver_pubkey TEXT,
    amount_sats INTEGER,
    note_content TEXT,
    timestamp INTEGER
  )
`);

// 2. Configure NDK with high-uptime relays
const ndk = new NDK({
    explicitRelayUrls: [
        "wss://relay.damus.io",
        "wss://nos.lol",
        "wss://relay.primal.net"
    ],
});

const ZAP_THRESHOLD = parseInt(process.env.ZAP_THRESHOLD_SATS || "10000");

async function startFirehose() {
    await ndk.connect();
    console.log("🔥 kheAI Firehose Connected to Relays");

    // Filter strictly for Kind 9735 (Zap Receipts)
    const filter: NDKFilter = { kinds: [9735], limit: 0 };
    const sub = ndk.subscribe(filter, { closeOnEose: false });

    sub.on("event", async (event: NDKEvent) => {
        try {
            // NIP-57 parsing: 'description' contains the original Zap Request (Kind 9734)
            const descriptionTag = event.tags.find(t => t[0] === 'description');
            const pTag = event.tags.find(t => t[0] === 'p'); // Receiver
            
            if (!descriptionTag || !pTag) return;

            const zapRequest = JSON.parse(descriptionTag[1]);
            const senderPubkey = zapRequest.pubkey;
            const receiverPubkey = pTag[1];
            
            // Extract 'e' tag from Zap Request to fetch the actual Kind 1 Note
            const eTag = zapRequest.tags.find((t: string[]) => t[0] === 'e');
            let noteContent = "";
            if (eTag) {
                const noteEvent = await ndk.fetchEvent(eTag[1]);
                if (noteEvent) noteContent = noteEvent.content;
            }

            // Extract amount from the bolt11 invoice using light-bolt11-decoder
            const bolt11Tag = event.tags.find(t => t[0] === 'bolt11');
            if (!bolt11Tag) return;
            
            const decodedInvoice = decode(bolt11Tag[1]);
            const amountSection = decodedInvoice.sections.find(s => s.name === 'amount');
            const amountSats = amountSection ? parseInt(amountSection.value) / 1000 : 0;

            if (amountSats >= ZAP_THRESHOLD) {
                console.log(`⚡ HIGH VALUE SIGNAL: ${amountSats} sats from ${senderPubkey.substring(0,8)}`);
                
                await db.query(`
                  INSERT INTO high_value_zaps (id, sender_pubkey, receiver_pubkey, amount_sats, note_content, timestamp)
                  VALUES ($1, $2, $3, $4, $5, $6)
                  ON CONFLICT (id) DO NOTHING
                `, [event.id, senderPubkey, receiverPubkey, amountSats, noteContent, event.created_at]);
            }
        } catch (error) {
            // Silently drop malformed zaps to keep the loop fast
        }
    });
}

startFirehose();
```

- **The Relay Connection:** We connect to "Relays" (Nostr's decentralized servers).
- **The Filter:** We tell the code to ignore everything except `Kind 9735`. This is the cryptographic receipt of a Bitcoin payment.
- **The Threshold:** We set a limit (e.g., 10,000 sats). If a zap is smaller than that, we don't even save it. This keeps our database "high-signal."

**Data Storage:** The code uses **PostgreSQL**. Think of this as a robust database that safely handles concurrent connections from our Node.js worker and Python service.



## Phase 3: The AI Swarm (Reasoning)

The Swarm Engine (`services/swarm-engine`)

This is where your actuarial background turns data into a product.

- **The Burst Trigger:** A background task (using APScheduler or Celery) aggregates zaps over a 6-hour window. If a pubkey receives multiple high-value zaps, it triggers the swarm.
- **The Debate:** When a burst is detected, it spins up the 3-agent simulation.
- **The Output:** A JSON object containing the `Confidence_Score` and `Executive_Summary` using Gemini's Structured Outputs.

Once the data is in the database, we need to "think" about it. This is where the **Swarm Engine** comes in.

**Python Environment:** Inside `services/swarm-engine`, create a `requirements.txt` with `fastapi`, `uvicorn`, `google-generativeai`, `psycopg2-binary`, and `apscheduler`.

**The Debate Logic:** Refer to the **Python code** provided.

- **The Market Radar:** This shows the raw, "unprocessed" zaps as they happen.
- **The Intelligence Report:** This is the high-value section. Notice the **Paywall logic**.

The AI Reasoning Engine: `services/swarm-engine/main.py`

This FastAPI service checks the database for new high-value zaps and runs the multi-agent debate. It applies statistical rigor—calculating standard deviations and confidence scores—before formatting the lead using Structured Outputs.

```python
import os
import json
from fastapi import FastAPI
from pydantic import BaseModel
from google import genai
from google.genai import types
from apscheduler.schedulers.background import BackgroundScheduler

app = FastAPI(title="kheAI Swarm API")

# Configure Gemini 3.1 Flash Lite 
client = genai.Client(api_key=os.environ["GEMINI_API_KEY"])

class ZapSignal(BaseModel):
    sender_pubkey: str
    receiver_pubkey: str
    amount_sats: int
    note_content: str

class IntelligenceReport(BaseModel):
    confidence_score: int
    executive_summary: str

def run_agent(persona_prompt: str, context: str) -> str:
    """Executes a single agent's reasoning pass."""
    response = client.models.generate_content(
        model='gemini-3.1-flash-lite-preview',
        contents=f"{persona_prompt}\n\nContext:\n{context}"
    )
    return response.text

@app.post("/analyze_signal")
async def analyze_signal(zap: ZapSignal):
    context = f"Sender: {zap.sender_pubkey}\nReceiver: {zap.receiver_pubkey}\nAmount: {zap.amount_sats} sats\nNote: '{zap.note_content}'"

    # 1. The Quant (Actuarial Analysis)
    quant_prompt = """
    You are the Quant Agent. Analyze the satoshi volume. Is this a baseline retail tip or a statistical outlier representing enterprise capital? 
    Output a strict mathematical assessment of the transaction weight.
    """
    quant_analysis = run_agent(quant_prompt, context)

    # 2. The Profiler (Intent Mapping)
    profiler_prompt = """
    You are the Semantic Profiler. Analyze the note content. Categorize the commercial intent into one of: 
    [HIRING, INFRASTRUCTURE, BOUNTY, RESEARCH, NOISE]. Explain your reasoning.
    """
    profiler_analysis = run_agent(profiler_prompt, context)

    # 3. The Skeptic (The Filter) - Using Structured Outputs
    skeptic_prompt = f"""
    You are the Skeptic. Your job is to invalidate this lead. Read the Quant and Profiler reports. 
    Flag any meme-behavior, potential circle-zapping, or zero-cost signaling. 
    Return a final 'confidence_score' from 0-100 and a 3-bullet 'executive_summary'.
    
    Quant Report: {quant_analysis}
    Profiler Report: {profiler_analysis}
    """
    
    response = client.models.generate_content(
        model='gemini-3.1-flash-lite-preview',
        contents=skeptic_prompt,
        config=types.GenerateContentConfig(
            response_mime_type="application/json",
            response_schema=IntelligenceReport,
        ),
    )
    
    final_report = json.loads(response.text)

    return {
        "status": "analyzed",
        "confidence_score": final_report["confidence_score"],
        "executive_summary": final_report["executive_summary"]
    }

# Background task (APScheduler) to poll PostgreSQL for 6-hour bursts would go here
def check_bursts():
    # Logic to query PostgreSQL for 3+ zaps to one pubkey in last 6 hours
    pass

scheduler = BackgroundScheduler()
scheduler.add_job(check_bursts, 'interval', minutes=15)
scheduler.start()
```

- We use **Gemini 3.1 Flash Lite** because it is fast and cheap for "agentic" loops.
- **The Quant:** Uses actuarial logic to see if the payment volume is a statistical anomaly. It calculates the weight of the signal using $Z = \frac{x - \mu}{\sigma}$.
- **The Profiler:** Reads the text of the note to see *why* the money moved.
- **The Skeptic:** This is your "Forensic Accountant." It looks for "wash trading" or "tip farming" to make sure the lead is real. We use **Structured Outputs** to guarantee a clean JSON response.



## Phase 4: The Terminal UI (Dashboard)

The Terminal UI (`web/`)

For a B2B audience, avoid "fluff." Focus on density:

- **The "Market Radar":** A scrolling ticker of high-value zaps with AI-predicted "Intent Tags" (e.g., #HIRING, #GRANTS).
- **The "Identity Vault":** A list of known pubkeys mapped to real-world entities (e.g., "Jack Dorsey's known dev account").
- **The Pay-per-View:** A blurred-out report card that reveals the full AI analysis upon a successful **NWC** payment.

This is the "Bloomberg" interface where you (and eventually your clients) see the results.

**Next.js Setup:** Inside the `web` folder, run `npx create-next-app@latest`. Choose Tailwind CSS and the App Router.

**Density Over Beauty:** Refer to the **Next.js code** provided.

The Main Dashboard: `app/page.tsx`

This is the core grid. It divides the screen into the real-time "Firehose" (raw >10k sat zaps) and the "Intelligence Hub" (the AI-analyzed leads).

```tsx
import React from 'react';
import { MarketRadar } from '@/components/MarketRadar';
import { IntelligenceReport } from '@/components/IntelligenceReport';
import { Activity, ShieldAlert, Zap } from 'lucide-react';

export default function TerminalDashboard() {
  return (
    <div className="min-h-screen bg-black text-zinc-300 font-mono p-4 flex flex-col">
      {/* Header */}
      <header className="flex justify-between items-center border-b border-zinc-800 pb-4 mb-4">
        <div className="flex items-center gap-3">
          <Zap className="text-amber-500" size={24} />
          <h1 className="text-xl font-bold tracking-widest text-white">kheAI // TERMINAL</h1>
          <span className="bg-zinc-800 text-xs px-2 py-1 rounded text-zinc-400">v0.1.0-alpha</span>
        </div>
        <div className="flex gap-4 text-sm">
          <div className="flex items-center gap-2"><Activity className="text-green-500" size={16}/> Relay: Connected</div>
          <div className="flex items-center gap-2"><ShieldAlert className="text-amber-500" size={16}/> Swarm: Idle</div>
        </div>
      </header>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-grow">
        
        {/* Left Column: Raw Signal (The Firehose) */}
        <div className="lg:col-span-1 border border-zinc-800 rounded bg-zinc-950 p-4 flex flex-col">
          <h2 className="text-sm uppercase tracking-widest border-b border-zinc-800 pb-2 mb-4 text-zinc-500">
            Market Radar (>10k Sats)
          </h2>
          <MarketRadar />
        </div>

        {/* Right Column: AI Analysis & Paywall */}
        <div className="lg:col-span-2 border border-zinc-800 rounded bg-zinc-950 p-4 flex flex-col">
          <h2 className="text-sm uppercase tracking-widest border-b border-zinc-800 pb-2 mb-4 text-zinc-500">
            High-Confidence Intelligence Leads
          </h2>
          <div className="space-y-4 overflow-y-auto">
            {/* Mocking two reports: one unlocked, one locked */}
            <IntelligenceReport 
              targetPubkey="npub1...xyz89" 
              identity="dev@lightning.infra"
              confidence={88}
              intent="INFRASTRUCTURE"
              isLocked={false}
            />
            <IntelligenceReport 
              targetPubkey="npub1...abc12" 
              identity="Unknown Entity"
              confidence={92}
              intent="VC_FUNDING"
              isLocked={true}
              unlockPrice={500}
            />
          </div>
        </div>

      </div>
    </div>
  );
}
```

The Raw Feed Component: `components/MarketRadar.tsx`

This component will eventually poll your local FastAPI backend to fetch the PostgreSQL rows generated by the firehose. For now, it defines the visual structure of a raw economic signal.

```tsx
import React from 'react';

export function MarketRadar() {
  // In production, fetch this from your local Python API
  const mockSignals = [
    { id: 1, amount: 50000, sender: "npub1whale...", receiver: "npub1dev...", time: "10:42:01 UTC" },
    { id: 2, amount: 15000, sender: "npub1fund...", receiver: "npub1node...", time: "10:38:14 UTC" },
    { id: 3, amount: 21000, sender: "npub1anon...", receiver: "npub1core...", time: "10:15:55 UTC" },
  ];

  return (
    <div className="space-y-3 font-mono text-xs overflow-y-auto">
      {mockSignals.map((sig) => (
        <div key={sig.id} className="p-3 border border-zinc-800 bg-black hover:border-zinc-700 transition-colors">
          <div className="flex justify-between text-amber-500 mb-1">
            <span>⚡ {sig.amount.toLocaleString()} SATS</span>
            <span className="text-zinc-600">{sig.time}</span>
          </div>
          <div className="flex justify-between text-zinc-400">
            <span>FROM: {sig.sender.substring(0, 12)}</span>
          </div>
          <div className="flex justify-between text-zinc-400">
            <span>TO:   {sig.receiver.substring(0, 12)}</span>
          </div>
        </div>
      ))}
    </div>
  );
}
```

The Monetization Layer: `components/IntelligenceReport.tsx`

This is where the actuarial rigor pays off. The UI explicitly hides the Skeptic and Profiler outputs behind a Nostr Wallet Connect (NWC) paywall, proving the commercial viability of the agent's work.

```tsx
'use client';
import React, { useState } from 'react';
import { Lock, Unlock, Zap } from 'lucide-react';

interface ReportProps {
  targetPubkey: string;
  identity: string;
  confidence: number;
  intent: string;
  isLocked: boolean;
  unlockPrice?: number;
}

export function IntelligenceReport({ targetPubkey, identity, confidence, intent, isLocked, unlockPrice }: ReportProps) {
  const [locked, setLocked] = useState(isLocked);

  const handleNwcPayment = () => {
    // Placeholder for actual NWC window.webln.sendPayment()
    console.log(`Initiating NWC payment for ${unlockPrice} sats...`);
    alert(`Mock: Requesting Lightning Invoice for ${unlockPrice} sats via NWC`);
    setLocked(false); 
  };

  return (
    <div className={`p-4 border ${locked ? 'border-zinc-800 bg-zinc-900/50' : 'border-green-900/50 bg-green-950/10'} rounded font-mono`}>
      {/* Report Header (Always Visible) */}
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-white text-lg font-bold">{identity}</h3>
          <p className="text-zinc-500 text-sm">Target: {targetPubkey}</p>
        </div>
        <div className="text-right">
          <div className="text-green-400 font-bold text-lg">{confidence}% CONFIDENCE</div>
          <div className="text-xs tracking-widest text-amber-500">INTENT: {intent}</div>
        </div>
      </div>

      {/* Dynamic Content Based on Paywall State */}
      {locked ? (
        <div className="flex flex-col items-center justify-center p-6 border border-dashed border-zinc-700 bg-black rounded">
          <Lock className="text-zinc-600 mb-2" size={24} />
          <p className="text-zinc-400 text-sm mb-4">Swarm Intelligence Output Encrypted</p>
          <button 
            onClick={handleNwcPayment}
            className="flex items-center gap-2 bg-amber-600 hover:bg-amber-500 text-black px-4 py-2 text-sm font-bold transition-colors rounded"
          >
            <Zap size={16} /> Pay {unlockPrice} SATS to Decrypt
          </button>
        </div>
      ) : (
        <div className="space-y-4 border-t border-zinc-800 pt-4 mt-2 text-sm">
          <div>
            <span className="text-zinc-500 block mb-1">=== QUANTITATIVE ANALYSIS ===</span>
            <p className="text-zinc-300">Target received a 1.2M sat anomaly spike over 48h. Z-Score indicates a 3.4σ deviation from baseline retail tipping. High probability of structured capital deployment.</p>
          </div>
          <div>
            <span className="text-zinc-500 block mb-1">=== PROFILER CONSENSUS ===</span>
            <p className="text-zinc-300">Semantic clustering of recent Kind 1 notes indicates aggressive deployment of sovereign self-hosted infrastructure. Primary vocabulary: "bare-metal", "local-first", "Docker Swarm".</p>
          </div>
          <div>
            <span className="text-zinc-500 block mb-1">=== SKEPTIC CLEARANCE ===</span>
            <p className="text-green-500">Passed. No circular zapping detected in immediate social graph. Senders represent verified external liquidity, not internal tip-farming.</p>
          </div>
        </div>
      )}
    </div>
  );
}
```



## The Architecture in Practice

With this UI drafted, your complete flow looks like this:

1. **NDK (TypeScript)** catches the Zap and writes it to PostgreSQL.
2. **`main.py` (FastAPI/Python)** reads the PostgreSQL DB, identifies the $>10k$ sat burst, and triggers the Gemini agent debate.
3. **`page.tsx` (Next.js)** polls the FastAPI endpoint. If the confidence is high, it generates the encrypted `<IntelligenceReport />`.
4. A VC clicks the unlock button, triggering a WebLN/NWC command in the browser, settling the payment instantly over the Lightning network to your node.



**The Paywall (NWC):** We use **Nostr Wallet Connect**. This allows a user to click "Unlock" and pay you in Bitcoin instantly to see the AI's secret analysis.



## Summary of the Data Flow

| **Stage**    | **Component**      | **Action**                                     |
| ------------ | ------------------ | ---------------------------------------------- |
| **Inbound**  | Relays             | Raw protocol data (Kind 9735)                  |
| **Filter**   | Firehose (TS)      | If > 10,000 sats, Save to PostgreSQL           |
| **Reason**   | Swarm (Python)     | Quant, Profiler, and Skeptic debate the signal |
| **Outbound** | Terminal (Next.js) | Display scored leads with a Zap-paywall        |



## Pro-Tips for Success

- **Monitor your SSD:** Nostr data can grow fast. Since you're running on a 120GB SSD, make sure your "Firehose" script includes a "Time-to-Live" (TTL) to delete zaps older than 30 days.
- **The API Key:** Never hardcode your Gemini API key. Use a `.env` file in your `swarm-engine` folder.
- **Start Small:** Run the **Firehose** first. Don't worry about the AI or UI until you see "⚡ HIGH VALUE SIGNAL" appearing in your terminal logs.





## Launching the System

Once you have the `.env` and `package.json` in place, you only need to use these commands:

The "One Command" Launch:

```bash
npm run launch
```

**What this does:** It builds your Docker images, links the `.env` variables, and starts the services in "detached" mode (running in the background).



## Monitoring the "Pulse":

To see if your Firehose is catching zaps in real-time:

```bash
npm run logs:firehose
```



## Checking the AI's "Thoughts":

To see the Swarm Engine debating:

```bash
npm run logs:swarm
```



## Sub-Project Initializations

To ensure the `launch` command works, make sure you have initialized the sub-folders correctly:

- **In `services/firehose`:** Ensure you have a `Dockerfile` that runs `npm install` and `npm start`.
- **In `services/swarm-engine`:** Ensure you have a `Dockerfile` that installs `fastapi` and `uvicorn`.
- **In `web`:** Ensure your Next.js project is ready to be built.

