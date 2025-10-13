// routes/evaluate.js
const express = require("express");
const router = express.Router();
const OpenAI = require("openai");

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Hàm chuẩn hóa chuỗi tiếng Nhật
function normalizeJapanese(str) {
  if (!str) return "";
  return str
    .trim()
    .replace(/\s+/g, "") // xóa khoảng trắng
    .replace(/[。、．]/g, "。") // đồng nhất dấu chấm câu
    .replace(/！/g, "!")
    .replace(/？/g, "?")
    .normalize("NFKC"); // chuẩn hóa unicode (xử lý kana, fullwidth)
}

router.post("/evaluate-answer", async (req, res) => {
  try {
    let { userAnswer, correctAnswer } = req.body;

    // Chuẩn hóa
    const normalizedUser = normalizeJapanese(userAnswer);
    const normalizedCorrect = normalizeJapanese(correctAnswer);

    // Nếu giống hệt sau khi chuẩn hóa → cho 100 điểm luôn
    if (normalizedUser === normalizedCorrect) {
      return res.json({
        success: true,
        score: 100,
        feedback: "Câu trả lời hoàn toàn chính xác. Rất tốt!",
        highlight: userAnswer,
      });
    }

    // Prompt cho GPT
    const prompt = `
So sánh câu trả lời học viên với đáp án gốc (tiếng Nhật).
- Đáp án gốc: "${correctAnswer}"
- Học viên: "${userAnswer}"

Yêu cầu:
1. Nếu câu trả lời gần đúng hoặc chỉ sai vài ký tự nhỏ, hãy chấm điểm cao.
2. Chỉ highlight phần sai trong câu trả lời học viên bằng [* ... *].
3. Trả về JSON **hợp lệ** có dạng:
{
  "score": <số điểm 0–100>,
  "feedback": "<nhận xét bằng tiếng Việt, ngắn gọn>",
  "highlight": "<câu trả lời học viên với các phần sai được bọc bằng [*...*]>"
}
`;

    const aiRes = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.2,
    });

    let raw = aiRes.choices[0].message.content;

    let parsed;
    try {
      parsed = JSON.parse(raw);
    } catch (e) {
      console.error("⚠️ Parse JSON thất bại:", raw);
      parsed = {
        score: 60,
        feedback: "Không thể phân tích hoàn toàn. Vui lòng kiểm tra lại.",
        highlight: userAnswer,
      };
    }

    res.json({ success: true, ...parsed });
  } catch (err) {
    console.error("❌ API error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
