// listening.js
const express = require('express');
const fs = require('fs');
const path = require('path');
const { requireAuth } = require('../middleware/auth');
const OpenAI = require("openai");

const router = express.Router();

// Khởi tạo OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// ==================== ROUTE: Render trang luyện nghe ====================
router.get('/', requireAuth, (req, res) => {
  try {
    const dataPath = path.join(__dirname, '../data/listening.json');
    const data = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));

    const lessonNumber = req.query.lesson || 1;
    const key = `lesson${lessonNumber}`;
    const lessons = data[key] || data.lesson1;

    res.render('listening', {
      title: 'Luyện nghe',
      currentLesson: lessonNumber,
      lessons,
      totalLessons: Object.keys(data).length
    });
  } catch (error) {
    console.error("❌ Lỗi đọc file listening.json:", error);
    res.status(500).send("Lỗi hệ thống");
  }
});

// ==================== API: Chấm điểm & Feedback AI ====================
router.post('/feedback', requireAuth, async (req, res) => {
  try {
    const { userAnswer, correctAnswer } = req.body;

    // 🔹 Prompt hoàn chỉnh (có dữ liệu thực tế)
    const prompt = `
Bạn là giáo viên tiếng Nhật phụ trách kỹ năng NGHE HIỂU.
Hãy chấm câu trả lời của học viên dựa trên mức độ hiểu đúng nội dung.

Dưới đây là dữ liệu:
- Câu hỏi / đoạn nghe (đáp án đúng): "${correctAnswer}"
- Câu học viên nghe và trả lời: "${userAnswer}"

1️⃣ **Chấm điểm chính xác** (0–100) dựa trên mức độ hiểu và truyền tải đúng ý.
2️⃣ **Phát hiện lỗi chi tiết** gồm:
   - "Từ vựng": dùng sai hoặc nghe nhầm từ.
   - "Cấu trúc": sai ngữ pháp, chia động từ, hoặc thiếu thành phần ngữ pháp bắt buộc.
   - "Thiếu ý": chỉ khi học viên bỏ sót một phần quan trọng trong ý chính (KHÔNG được tự suy diễn vì câu ngắn hơn).
   - "Nghe nhầm": nếu dùng từ hoặc cụm hoàn toàn khác nghĩa với bản gốc.
3️⃣ **Đưa ra gợi ý ngắn gọn** để cải thiện cho từng lỗi.
4️⃣ **Không tạo lỗi giả** nếu câu trả lời vẫn đúng ngữ pháp hoặc hợp nghĩa.
5️⃣ Trả về đúng định dạng JSON, không kèm thêm văn bản thừa:

Trả về đúng định dạng JSON (không thêm văn bản thừa):

{
  "score": <số nguyên 0-100>,
  "highlight": "<câu học viên, đánh dấu phần sai bằng [*...*]>",
  "feedback": "<nhận xét ngắn bằng tiếng Việt>",
  "errors": [
    {
      "original": "<phần đúng hoặc ý đúng>",
      "user": "<phần sai hoặc thiếu>",
      "type": "<Từ vựng / Cấu trúc / Thiếu ý / Nghe nhầm>",
      "typeColor": "<warning hoặc danger>",
      "suggestion": "<Cách nói hoặc diễn đạt đúng hơn>"
    }
  ]
}
`;

    const aiRes = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "Bạn là giáo viên tiếng Nhật chuyên về kỹ năng nghe hiểu." },
        { role: "user", content: prompt }
      ],
      temperature: 0.4,
    });

    let raw = aiRes.choices[0].message.content.trim();
    let parsed;

    try {
      parsed = JSON.parse(raw);
    } catch (err) {
      console.warn("⚠️ JSON parse lỗi:", raw);
      parsed = {
        score: 0,
        highlight: "Không thể phân tích câu trả lời.",
        feedback: "AI không trả đúng định dạng JSON.",
        errors: []
      };
    }

    res.json({ success: true, ...parsed });
  } catch (error) {
    console.error("❌ Lỗi AI (Listening):", error);
    res.status(500).json({ success: false, error: error.message });
  }
});


module.exports = router;
