import { Meteor } from 'meteor/meteor';
import NDK from '@nostr-dev-kit/ndk';
import { GoogleGenAI } from '@google/genai';
import bolt11 from 'light-bolt11-decoder';

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
      console.log("🔥 Zap Hunter Online & Monitoring...");

      const sub = ndk.subscribe({ kinds: [9735], limit: 10 }, { closeOnEose: false });

      sub.on("event", async (event) => {
        try {
          // 1. EXTRACT CORE TAGS
          const descriptionTag = event.tags.find(t => t[0] === 'description');
          if (!descriptionTag) return; // Not a valid zap receipt

          const eTag = event.tags.find(t => t[0] === 'e');
          const zappedNoteId = eTag ? eTag[1] : event.id;
          
          const bolt11Tag = event.tags.find(t => t[0] === 'bolt11');
          const amountTag = event.tags.find(t => t[0] === 'amount');

          // 2. CALCULATE EXACT SATS (Primary: Bolt11, Fallback: Amount Tag)
          let amountSats = 0;
          if (bolt11Tag) {
            try {
              const decoded = bolt11.decode(bolt11Tag[1]);
              const millisatoshis = decoded.sections.find(s => s.name === 'amount').value;
              amountSats = Math.floor(millisatoshis / 1000);
            } catch (e) {
              // Silently catch invoice errors and rely on the fallback below
            }
          }
          
          if (amountSats === 0 && amountTag) {
            amountSats = Math.floor(parseInt(amountTag[1]) / 1000);
          }

          // 3. PARSE SENDER & NOTE
          const zapRequest = JSON.parse(descriptionTag[1]);
          const shortSender = zapRequest.pubkey ? `${zapRequest.pubkey.substring(0, 8)}...` : "Unknown";
          const noteContent = zapRequest.content || "";

          // ==========================================
          // 4. SKEPTIC GATES (Filter before AI execution)
          // ==========================================
          
          // Gate A: Ignore micro-dust (< 100 sats)
          if (amountSats < 100) return;

          // Gate B: Ignore empty or 1-emoji notes
          if (noteContent.trim().length < 3) return;

          // Gate C: API Quota Saver. Only analyze Whales or explicit intent.
          const intentWords = ['fix', 'build', 'bounty', 'hire', 'feature', 'tool'];
          const hasIntent = intentWords.some(word => noteContent.toLowerCase().includes(word));
          const isWhale = amountSats > 0;
          
          //if (!hasIntent || !isWhale) return; 

          // ==========================================

          console.log(`🎯 TARGET SPOTTED: "${noteContent.substring(0, 20)}..." (${amountSats} SATS)`);

          // 5. ECONOMIC INTELLIGENCE ANALYSIS
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

          const result = await ai.models.generateContent({
            model: 'gemini-3.1-flash-lite-preview',
            contents: [{ role: 'user', parts: [{ text: prompt }] }]
          });

          const rawText = result.candidates[0].content.parts[0].text.replace(/```json/g, '').replace(/```/g, '').trim();
          const aiResponse = JSON.parse(rawText);
          const isSignal = aiResponse.verdict.toUpperCase().includes("SIGNAL");

          // 6. UPDATE DASHBOARD
          volatileLeads.unshift({
            id: event.id,
            zappedNoteId: zappedNoteId,
            amount: amountSats,
            note: noteContent,
            sender: shortSender,
            confidence: aiResponse.confidence,
            verdict: aiResponse.verdict,
            isSignal: isSignal,
            time: new Date().toLocaleTimeString()
          });

          if (volatileLeads.length > 15) volatileLeads.pop();
          console.log(`✅ Result: ${aiResponse.verdict} (${aiResponse.confidence}%)`);

        } catch (err) {
            console.error("❌ Processing Error on Zap:", err.message);
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