import { Meteor } from 'meteor/meteor';
import NDK from '@nostr-dev-kit/ndk';
import { GoogleGenAI } from '@google/genai'; // Updated Import

const volatileLeads = [];

// Initialize the New Client
const ai = new GoogleGenAI({ 
  apiKey: process.env.GEMINI_API_KEY || 'YOUR_API_KEY' 
});

const ndk = new NDK({ explicitRelayUrls: ["wss://relay.damus.io"] });

Meteor.startup(async () => {
  await ndk.connect();
  console.log("🔥 Zap Hunter (GenAI v2) Online");

  const sub = ndk.subscribe({ kinds: [9735], limit: 0 }, { closeOnEose: false });

  sub.on("event", async (event) => {
    try {
      const descriptionTag = event.tags.find(t => t[0] === 'description');
      if (!descriptionTag) return;

      const zapRequest = JSON.parse(descriptionTag[1]);
      const noteContent = zapRequest.content || "No note.";

      // The new SDK uses a flat 'models.generateContent' call
      const result = await ai.models.generateContent({
        model: 'gemini-3.1-flash-lite-preview', // Or 'gemini-3-flash'
        contents: `
          Analyze this Nostr zap note: "${noteContent}".
          Is this a commercial lead or just social noise?
          Reply in JSON: {"confidence": 0-100, "verdict": "short text"}
        `
      });

      // Simple clean-up of the AI response string
      const rawText = result.text.replace(/```json/g, '').replace(/```/g, '').trim();
      const aiResponse = JSON.parse(rawText);

      volatileLeads.unshift({
        id: event.id,
        note: noteContent,
        ...aiResponse,
        time: new Date().toLocaleTimeString()
      });

      if (volatileLeads.length > 10) volatileLeads.pop();
    } catch (err) {
      // Log errors if you want to debug the AI parsing
      // console.error("Agent Error:", err);
    }
  });
});

Meteor.methods({
  async 'getLatestLeads'() {
    return volatileLeads;
  }
});