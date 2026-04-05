const { GoogleGenerativeAI } = require('@google/generative-ai');

const API_KEY = "AIzaSyB5bkg6DpYlrkj5WRrWFgWJMAipPj3lm8I"; 
const genAI = new GoogleGenerativeAI(API_KEY);

async function runTest() {
  console.log("🚀 Starting Gemini API Test...");
  try {
    // 👇 CHANGED TO THE ACTIVE 2026 MODEL 👇
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    const result = await model.generateContent("Reply with exactly these words: 'Hello World, the key works!'");
    
    console.log("\n✅ SUCCESS! The AI responded:");
    console.log(result.response.text());
  } catch (error) {
    console.log("\n❌ FAILED! Here is the pure error:");
    console.error(error);
  }
}

runTest();