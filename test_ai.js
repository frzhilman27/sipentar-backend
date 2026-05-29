require('dotenv').config();
const { GoogleGenAI } = require('@google/genai');

async function test() {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: 'Tanya tentang infrastruktur desa.',
    });
    console.log("Success:", response.text);
  } catch (err) {
    console.error("Failed:", err);
  }
}
test();
