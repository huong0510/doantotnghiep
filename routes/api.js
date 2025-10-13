const express = require("express");
const router = express.Router();
const OpenAI = require("openai");
const { requireAuth } = require("../middleware/auth");

// Khởi tạo OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * POST /api/evaluate-answer
 * Body: { userAnswer: string, correctAnswer: string }
 * Trả về: { success, score, highlight, feedback }
 */
router.post("/evaluate-answer", requireAuth, async (req, res) => {
  try {
    const { userAnswer, correctAnswer } = req.body;

    if (!userAnswer || !correctAnswer) {
      return res.status(400).json({ success: false, error: "Thiếu dữ liệu đầu vào" });
    }

    const prompt = `
Bạn là một giáo viên tiếng Nhật. Hãy chấm câu trả lời nghe của học viên.

- Đáp án gốc: "${correctAnswer}"
- Câu học viên: "${userAnswer}"

Yêu cầu trả về JSON đúng định dạng:
{
  "score": số_điểm_từ_0_đến_100,
  "highlight": "Highlight lỗi sai (nếu có), nếu đúng thì ghi 'Không có lỗi'",
  "feedback": "Nhận xét ngắn gọn bằng tiếng Việt"
}
    `;

    const aiRes = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.3
    });

    let resultText = aiRes.choices[0].message.content;

    // Thử parse JSON từ AI
    let parsed;
    try {
      parsed = JSON.parse(resultText);
    } catch (e) {
      parsed = {
        score: 0,
        highlight: "Không phân tích được",
        feedback: resultText
      };
    }

    res.json({ success: true, ...parsed });
  } catch (err) {
    console.error("❌ Lỗi AI:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
