import { Meteor } from 'meteor/meteor';
import NDK from '@nostr-dev-kit/ndk';
import { GoogleGenAI } from '@google/genai';

// 1. Check for the API Key immediately
const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
  console.log("❌ ERROR: GEMINI_API_KEY is not set in your terminal!");
  console.log("Fix: run 'export GEMINI_API_KEY=your_key_here' before 'meteor run'");
}

const volatileLeads = [];
const ai = new GoogleGenAI({ apiKey: apiKey || 'dummy_key' });

const ndk = new NDK({ 
  explicitRelayUrls: ["wss://relay.damus.io", "wss://nos.lol"] 
});

// We remove 'async' from the main startup to prevent the Meteor boot-hang
Meteor.startup(() => {
  console.log("⏳ Meteor is starting up...");

  // Run the Nostr logic in a separate "task" so the server can finish booting
  (async () => {
    try {
      console.log("📡 Attempting to connect to Nostr relays...");
      
      // Add a 5-second timeout to the connection so it doesn't hang forever
      await ndk.connect(5000); 
      
      console.log("🔥 Zap Hunter (Safe Mode) Online!");

      const sub = ndk.subscribe({ kinds: [9735], limit: 10 }, { closeOnEose: false });

      sub.on("event", async (event) => {
        // DEBUG: See every zap hitting your server
        console.log(`📩 Received Zap Receipt: ${event.id.substring(0, 8)}...`);

        try {
          const descriptionTag = event.tags.find(t => t[0] === 'description');
          if (!descriptionTag) return;

          const zapRequest = JSON.parse(descriptionTag[1]);
          const noteContent = zapRequest.content || "No note.";
          
          // 3. Temporarily set threshold to 0 just to verify the AI is working
          const threshold = 0; 

          console.log(`🧠 Asking AI to analyze: "${noteContent}"`);

          const result = await ai.models.generateContent({
            model: 'gemini-3.1-flash-lite-preview',
            contents: [{ role: 'user', parts: [{ text: `Analyze if this Nostr note is a business lead or social noise: "${noteContent}". Reply ONLY in JSON: {"confidence": 0-100, "verdict": "string"}` }] }]
          });

          const rawText = result.candidates[0].content.parts[0].text.replace(/```json/g, '').replace(/```/g, '').trim();
          const aiResponse = JSON.parse(rawText);

          volatileLeads.unshift({
            id: event.id,
            note: noteContent,
            confidence: aiResponse.confidence,
            verdict: aiResponse.verdict,
            time: new Date().toLocaleTimeString()
          });

          if (volatileLeads.length > 15) volatileLeads.pop();
          console.log("✅ Lead added to UI");

        } catch (err) {
           console.error("❌ Processing Error:", err.message);
        }
      });

    } catch (err) {
      console.error("❌ Startup Task Failed:", err.message);
    }
  })();

  console.log("✅ Server boot sequence complete. Check localhost:3000");
});

Meteor.methods({
  async 'getLatestLeads'() {
    return volatileLeads;
  }
});