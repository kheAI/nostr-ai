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
          const noteContent = zapRequest.content || "No note.";
          const amountTag = event.tags.find(t => t[0] === 'amount');
          const amountSats = amountTag ? Math.floor(parseInt(amountTag[1]) / 1000) : "10k+";
          
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

          volatileLeads.unshift({
            id: event.id,
            amount: amountSats,
            note: noteContent,
            confidence: aiResponse.confidence,
            verdict: aiResponse.verdict,
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