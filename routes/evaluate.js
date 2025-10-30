// routes/evaluate.js
const express = require("express");
const router = express.Router();
const OpenAI = require("openai");

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Chuẩn hóa chuỗi tiếng Nhật
function normalizeJapanese(str) {
  if (!str) return "";
  return str
    .trim()
    .replace(/\s+/g, "")
    .replace(/[。、．]/g, "。")
    .replace(/！/g, "!")
    .replace(/？/g, "?")
    .normalize("NFKC");
}

router.post("/evaluate-answer", async (req, res) => {
  try {
    const { userAnswer, correctAnswer } = req.body;

    const normalizedUser = normalizeJapanese(userAnswer);
    const normalizedCorrect = normalizeJapanese(correctAnswer);

    // Nếu giống hệt thì không cần hỏi AI
    if (normalizedUser === normalizedCorrect) {
      return res.json({
        success: true,
        score: 100,
        feedback: "Câu trả lời hoàn toàn chính xác 🎉 Rất tốt!",
        highlight: userAnswer,
        errors: [
          {
            original: "-",
            user: "-",
            type: "✅ Không có lỗi",
            suggestion: "Câu trả lời chính xác.",
          },
        ],
      });
    }

    // 🧠 Prompt yêu cầu JSON chặt chẽ
    const prompt = `
Bạn là giáo viên tiếng Nhật. Hãy so sánh "Câu học viên" với "Đáp án gốc" để tìm tất cả lỗi sai.

⚠️ Trả về **chính xác 1 đối tượng JSON duy nhất** (không giải thích gì thêm).

Cấu trúc JSON:
{
  "score": <số nguyên 0–100>,
  "feedback": "<nhận xét tiếng Việt>",
  "highlight": "<câu học viên, phần sai được bọc bằng [*...*]>",
  "errors": [
    {
      "original": "<phần đúng trong đáp án>",
      "user": "<phần sai của học viên>",
      "type": "<Ngữ pháp | Từ vựng | Thiếu từ | Cấu trúc>",
      "suggestion": "<gợi ý sửa ngắn gọn>"
    }
  ]
}

Đáp án gốc: "${correctAnswer}"
Câu học viên: "${userAnswer}"
    `;

    const aiRes = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.2,
      messages: [{ role: "user", content: prompt }],
    });

    let raw = aiRes.choices[0].message.content;
    let parsed;

    try {
      parsed = JSON.parse(raw);
    } catch (e) {
      console.warn("⚠️ Parse JSON lỗi:", raw);
      parsed = {
        score: 70,
        feedback: "AI không trả đúng định dạng JSON, dùng kết quả mặc định.",
        highlight: userAnswer,
        errors: [],
      };
    }

    // 🩵 Nếu không có errors hoặc highlight thì tự xử lý thủ công
    if (!parsed.errors || !Array.isArray(parsed.errors)) {
      parsed.errors = [];
      const regex = /\[\*(.*?)\*\]/g;
      const matches = [...(parsed.highlight || "").matchAll(regex)];

      matches.forEach((m) => {
        parsed.errors.push({
          original: correctAnswer,
          user: m[1],
          type: "Ngữ pháp",
          suggestion: `Phần "${m[1]}" có thể sai ngữ pháp.`,
        });
      });
    }

    // ✅ Đảm bảo có feedback, highlight, score
    parsed.feedback = parsed.feedback || "Không có nhận xét.";
    parsed.highlight = parsed.highlight || userAnswer;
    parsed.score = parsed.score || Math.max(50, 100 - parsed.errors.length * 10);

    // ✅ Nếu không có lỗi nào → vẫn tạo 1 dòng giả để FE hiển thị bảng
    if (parsed.errors.length === 0) {
      parsed.errors.push({
        original: "-",
        user: "-",
        type: "✅ Không có lỗi",
        suggestion: "Câu trả lời chính xác.",
      });
      parsed.highlight = "Không có lỗi 🎯";
    }

    console.log("✅ Evaluate result:", parsed);

    res.json({ success: true, ...parsed });
  } catch (err) {
    console.error("❌ Evaluate API error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
