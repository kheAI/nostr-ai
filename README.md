# ⚡ kheAI: Autonomous Zap Hunter (v0.1)

**kheAI** is a decentralized economic intelligence agent designed to monitor the Nostr firehose and identify "Signal" in the noise of Zap receipts. It uses a skeptical AI reasoning layer to distinguish between social "likes" and potential business leads, such as bounties, tool tips, or professional inquiries.

Built with a focus on **Sovereign AI** and data sovereignty, kheAI runs locally to process global value flow in real-time.



## 🚀 Core Architecture

- **Ingestion:** Real-time Nostr subscription via `NDK` (Nostr Dev Kit).
- **Verification:** Lightning Network invoice (Bolt11) decoding to ensure 100% mathematical accuracy of zap amounts.
- **Reasoning:** Gemini 3.1 Flash (Lite) acting as an "Economic Skeptic" to filter social noise.
- **Frontend:** Reactive dashboard built with Meteor 3 and Blaze.



## 🛠️ Tech Stack

| **Component** | **Technology**               |
| ------------- | ---------------------------- |
| **Runtime**   | Meteor 3.x (Node.js 20+)     |
| **Protocol**  | Nostr (Kinds: 9735)          |
| **Lightning** | `light-bolt11-decoder`       |
| **AI Model**  | Google Gemini 3.1 Flash Lite |
| **UI**        | Blaze + ReactiveVar          |



## ⚡ Skeptic Gates (Signal Filtering)

To optimize API usage and focus on high-value data, the agent passes every zap through three "Skeptic Gates" before calling the AI:

1. **Dust Filter:** Ignores any zap under **100 sats** to focus on meaningful economic activity.
2. **Content Filter:** Skips empty notes or 1-character emojis (e.g., "👍", "🤙").
3. **Intent/Whale Filter:** Only triggers the AI if the note contains business keywords (`fix`, `build`, `bounty`, `hire`) OR if the amount exceeds **100 sats**.



## 🏁 Getting Started

### 1. Environment Setup

You must provide a Gemini API Key to enable the intelligence layer.

```bash
export GEMINI_API_KEY="your_api_key_here"
```

### 2. Installation

```bash
# Clone the repository
cd kheAI

# Install dependencies
meteor npm install
```

### 3. Run the Agent

```bash
meteor run
```

The dashboard will be available at `http://localhost:3000`.



## 📈 Future Roadmap

- **Persistent Memory:** Transitioning `volatileLeads` from server RAM to a local MongoDB collection for long-term lead tracking.
- **Sovereign Inference:** Moving from Gemini API to local SLMs (Small Language Models) running on Raspberry Pi/Jetson Nano hardware.
- **Automated Response:** Implementing Nostr "Zaps-back" for autonomous bounty claims and agent-to-agent payments.

> "BE SKEPTICAL. If the note is empty, it is 99% NOISE." — *kheAI*

