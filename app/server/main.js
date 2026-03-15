import { Meteor } from 'meteor/meteor';
import NDK from '@nostr-dev-kit/ndk';
import { GoogleGenAI } from '@google/genai';

const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
  console.log("❌ ERROR: GEMINI_API_KEY is not set!");
}

const volatileLeads = [];
const ai = new GoogleGenAI({ apiKey: apiKey || 'dummy_key' });

const ndk = new NDK({ 
  explicitRelayUrls: ["wss://relay.damus.io", "wss://nos.lol"] 
});

Meteor.startup(() => {
  console.log("⏳ Meteor is starting up...");

  (async () => {
    try {
      console.log("📡 Attempting to connect to Nostr relays...");
      await ndk.connect(5000); 
      console.log("🔥 Zap Hunter (Safe Mode) Online!");

      const sub = ndk.subscribe({ kinds: [9735], limit: 10 }, { closeOnEose: false });

      sub.on("event", async (event) => {
        try {
          const descriptionTag = event.tags.find(t => t[0] === 'description');
          if (!descriptionTag) return;

          const zapRequest = JSON.parse(descriptionTag[1]);
          const senderPubkey = zapRequest.pubkey; // This is the "Zapped By" hex
          const shortSender = `${senderPubkey.substring(0, 8)}...`;
          const noteContent = zapRequest.content || "";
         
          // --- ADVANCED FILTER LOGIC ---
          // 1. Keyword Filter: Only analyze if it contains specific "intent" words
          const intentWords = ['fix', 'build', 'bounty', 'hire', 'feature', 'tool'];
          const hasIntent = intentWords.some(word => noteContent.toLowerCase().includes(word));
          
          // 2. Whale Filter: Only analyze if it's a large amount (e.g., > 5000 sats)
          // FIX: Some relays use 'amount' in millisats, others don't. 
          // We'll try to find it or label it as 'Micro-zap'
          const amountTag = event.tags.find(t => t[0] === 'amount');
          const amountSats = amountTag ? Math.floor(parseInt(amountTag[1]) / 1000) : "1+";
          const isWhale = amountSats >= 5000;

          // Only trigger Gemini if there is a hint of Signal, to save your API quota
          // SKEPTIC GATE: Don't even ask Gemini if it's an empty emoji zap
          if (noteContent.trim().length < 3) return;

          console.log(`🎯 TARGET SPOTTED: "${noteContent.substring(0, 20)}..."`);
          
          // --- ADD THE PROMPT HERE ---
          const prompt = `
            You are an Economic Intelligence Agent. 
            Context: A user just sent ${amountSats} sats on Nostr with the note: "${noteContent}".
            
            TASK: Determine if this is:
            1. SIGNAL: A payment for a service, a bug bounty, or a professional tip.
            2. NOISE: A "GM", a meme, or a random social "Like".
            
            BE SKEPTICAL. If the note is empty, it is 99% NOISE.
            If the note contains words like "fix", "feature", "build", "hire", or "thanks for the tool", it is SIGNAL.
            
            Reply ONLY in JSON: {"confidence": 0-100, "verdict": "string"}
          `;

          console.log(`🧠 Analyzing Zap: "${noteContent.substring(0, 30)}..."`);

          const result = await ai.models.generateContent({
            model: 'gemini-3.1-flash-lite-preview',
            // --- USE THE PROMPT VARIABLE HERE ---
            contents: [{ role: 'user', parts: [{ text: prompt }] }]
          });

          const rawText = result.candidates[0].content.parts[0].text.replace(/```json/g, '').replace(/```/g, '').trim();
          const aiResponse = JSON.parse(rawText);

          // ONLY add to UI if it's not noise, or if confidence is low (worth a second look)
          const isSignal = aiResponse.verdict.toUpperCase().includes("SIGNAL");

          volatileLeads.unshift({
            id: event.id,
            amount: amountSats,
            note: noteContent,
            sender: zapRequest.pubkey.substring(0, 8),
            confidence: aiResponse.confidence,
            verdict: aiResponse.verdict,
            isSignal: isSignal, // Pass this to the UI for styling
            time: new Date().toLocaleTimeString()
          });

          if (volatileLeads.length > 15) volatileLeads.pop();
          console.log(`✅ Result: ${aiResponse.verdict} (${aiResponse.confidence}%)`);

        } catch (err) {
           console.error("❌ Processing Error:", err.message);
        }
      });

    } catch (err) {
      console.error("❌ Startup Task Failed:", err.message);
    }
  })();

  console.log("✅ Server boot sequence complete.");
});

Meteor.methods({
  async 'getLatestLeads'() {
    return volatileLeads;
  }
});