import 'dotenv/config';
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
  explicitRelayUrls: ["wss://relay.damus.io", "wss://nos.lol", "wss://relay.nostr.band", "wss://purplepag.es"] 
});

Meteor.startup(() => {
  console.log("⏳ Meteor is starting up...");

  if (!process.env.GEMINI_API_KEY) {
    console.warn("⚠️  WARNING: GEMINI_API_KEY is not set in .env file.");
  } else {
    console.log("✅  Sovereign AI Engine initialized with API Key.");
  }

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
          const senderPubkey = zapRequest.pubkey;
          const shortSender = zapRequest.pubkey ? `${zapRequest.pubkey}...` : "Unknown";
          const noteContent = zapRequest.content || "";

          const pTag = event.tags.find(t => t[0] === 'p'); // The 'p' tag on the Zap Receipt indicates who received the funds
          const recipientPubkey = pTag ? pTag[1] : "Unknown";
          const shortRecipient = recipientPubkey !== "Unknown" ? `${recipientPubkey}...` : "Unknown";
          const kTag = zapRequest.tags.find(t => t[0] === 'k');
          const aTag = zapRequest.tags.find(t => t[0] === 'a');
          
          let contentType = "Unknown";
          let targetKind = kTag ? kTag[1] : null;

          // Fallback: If no 'k' tag, 'a' tags (for articles) look like "30023:pubkey:identifier"
          if (!targetKind && aTag) {
             targetKind = aTag[1].split(':')[0];
          }

          // Map the Nostr Kind integer to a human-readable label
          if (targetKind) {
             switch(targetKind) {
                case "1": contentType = "Short Note / Reply"; break;
                case "30023": contentType = "Long-form Article"; break;
                case "34235": contentType = "Video"; break;
                case "9802": contentType = "Highlight"; break;
                case "30024": contentType = "Draft"; break;
                default: contentType = `Kind ${targetKind}`;
             }
          } else {
             // If a client didn't include a 'k' or 'a' tag, it's almost always a standard Kind 1
             contentType = "Short Note / Reply"; 
          }

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
          const isWhale = amountSats > 10;
          
          if (!hasIntent && !isWhale) return; 

          // ==========================================

          console.log(`🎯 TARGET SPOTTED: "${noteContent.substring(0, 20)}..." (${amountSats} SATS)`);

          // 5. ECONOMIC INTELLIGENCE ANALYSIS
          const prompt = `
            You are an Economic Intelligence Agent. 
            Context: User (${shortSender}) just sent ${amountSats} sats to User (${shortRecipient}) for a "${contentType}".
            The sender included this note: "${noteContent}".
            
            TASK: Determine if this is:
            1. SIGNAL: A payment for a service, a bug bounty, a commission, or a professional tool tip.
            2. NOISE: A "GM", a meme, general appreciation, or a random social "Like".
            
            BE SKEPTICAL. 
            - If the note is empty, it is 99% NOISE.
            - If the note contains words like "fix", "feature", "build", "hire", or "thanks for the tool", it is SIGNAL.
            - Contextual Weight: A 5000 sat zap on a "Short Note" saying "Fix this bug" is SIGNAL (bounty).
            
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
            recipient: shortRecipient, 
            contentType: contentType,
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
    //console.log(volatileLeads);
    return volatileLeads;
  }
});