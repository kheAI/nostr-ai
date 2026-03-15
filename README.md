# ⚡ kheAI: Autonomous Zap Hunter (v0.1)

> **"In the Lightning Firehose, Every Sat is a Vote; Every Note is a Lead."**

**kheAI** is a decentralized Economic Intelligence Agent built for the Nostr protocol. It monitors the global firehose of Zap receipts (`Kind 9735`) to separate social "Noise" (meaningless likes) from commercial "Signal" (bounties, service payments, and professional inquiries).

By treating the Lightning Network as a real-time ledger of human intent, kheAI identifies 1% of transactions that represent high-value opportunities before they ever reach a traditional job board.



## 🧠 The "Skeptic" Methodology

Most AI agents are "too nice"—they waste tokens on everything. kheAI uses a **Triple-Gate Skeptic Framework** to protect your API quota and your attention.

| **Gate**   | **Name**             | **Logic**                                                    |
| ---------- | -------------------- | ------------------------------------------------------------ |
| **Gate A** | **The Deductible**   | Discards any Zap under **100 sats**. Low-value micro-tips rarely carry professional intent. |
| **Gate B** | **The Emoji Filter** | Kills the process if the note is empty or purely visual (e.g., "👍", "🤙", "LFG"). |
| **Gate C** | **Whale & Intent**   | Only triggers AI reasoning if it detects a **Whale** (>5,000 sats) OR high-intent keywords (`fix`, `build`, `bounty`, `hire`). |



## 🚀 Core Architecture

- **Ingestion:** Persistent relay connections via `NDK` (Nostr Dev Kit) targeting `wss://relay.damus.io`, `nos.lol`, and others.
- **The Source of Truth:** Uses `light-bolt11-decoder` to extract the exact Satoshi count directly from the invoice—ignoring often-inaccurate relay tags.
- **The Brain:** Powered by **Gemini 3.1 Flash (Lite)** for near-instant, "skeptical" inference.
- **The Interface:** A reactive, zero-latency dashboard built with **Meteor 3** and **Blaze**.



## 🛠️ Tech Stack

| **Component**    | **Technology**           |
| ---------------- | ------------------------ |
| **Runtime**      | Meteor 3.x (Node.js 20+) |
| **Protocol**     | Nostr (`Kind: 9735`)     |
| **Verification** | `light-bolt11-decoder`   |
| **AI Reasoning** | Gemini 3.1 Flash (Lite)  |
| **Reactivity**   | Blaze + ReactiveVar      |



## 🏁 Getting Started

### 1. Environment Configuration

kheAI requires a Google AI Studio API key for the reasoning layer.

```bash
export GEMINI_API_KEY="your_api_key_here"
```

### 2. Installation

Initialize the environment and pull the necessary Nostr and AI dependencies.

```bash
# Clone the repository and enter the app directory
cd dev/nostr-ai/app

# Install dependencies
meteor npm install
```

### 3. Ignition

Start the agent and the monitoring dashboard.

```bash
meteor run
```

Access the intelligence feed at `http://localhost:3000`.


## 📈 Future Roadmap

- **Persistent Memory:** Transitioning `volatileLeads` from server RAM to a local MongoDB collection for long-term lead tracking.
- **Sovereign Inference:** Moving from Gemini API to local SLMs (Small Language Models) running on Raspberry Pi/Jetson Nano hardware.
- **Automated Response:** Implementing Nostr "Zaps-back" for autonomous bounty claims and agent-to-agent payments.

