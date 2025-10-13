// test-gemini.js
const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });

(async () => {
  try {
    const result = await model.generateContent("Xin chào! Đây là test Gemini 1.5 Pro.");
    console.log("✅ Gemini trả về:", result.response.text());
  } catch (err) {
    console.error("❌ Lỗi khi test Gemini:", err);
  }
})();
