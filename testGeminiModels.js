require("dotenv").config();
const fetch = require("node-fetch");

const GEMINI_KEY = process.env.GEMINI_API_KEY;

(async () => {
  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models?key=${GEMINI_KEY}`
    );
    const data = await response.json();

    console.log("📋 Danh sách model Gemini khả dụng:");
    if (data.models) {
      data.models.forEach((m, i) => {
        console.log(`${i + 1}. ${m.name}`);
      });
    } else {
      console.log(data);
    }
  } catch (err) {
    console.error("❌ Lỗi khi lấy danh sách model:", err);
  }
})();
