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

    const prompt = `
Bạn là một giáo viên tiếng Nhật. Hãy chấm câu trả lời nghe của học viên.

- Đáp án gốc: "${correctAnswer}"
- Câu học viên: "${userAnswer}"

Hãy trả về kết quả dưới dạng JSON với 3 trường:
{
  "score": số_điểm_0_đến_100,
  "highlight": "highlight phần sai (nếu có), nếu đúng hoàn toàn ghi 'Không có lỗi'",
  "feedback": "nhận xét ngắn gọn bằng tiếng Việt"
}
    `;

    const aiRes = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.3
    });

    let resultText = aiRes.choices[0].message.content;

    // Parse JSON an toàn
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
  } catch (error) {
    console.error("❌ Lỗi AI:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
