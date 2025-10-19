const express = require("express");
const router = express.Router();
const { getQuery } = require("../database/db");
const { requireAuth } = require("../middleware/auth");
const { pool } = require('../database/db');
const { GoogleGenerativeAI } = require("@google/generative-ai");
require("dotenv").config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);


// 🩷 Route chi tiết ngữ pháp theo ID
router.get("/:id(\\d+)", requireAuth, async (req, res) => {
  try {
    const id = req.params.id;
    const grammarRows = await getQuery("SELECT * FROM grammar WHERE id = ?", [id]);

    if (grammarRows.length === 0) {
      return res.status(404).send("Không tìm thấy ngữ pháp");
    }

    // 🔹 Lấy bài luyện tập liên quan
    const exercises = await getQuery("SELECT * FROM grammar_exercises WHERE grammar_id = ?", [id]);

    res.render("grammar/detail", {
      title: "Chi tiết ngữ pháp",
      grammar: grammarRows[0],
      exercises,
    });
  } catch (err) {
    console.error("❌ Lỗi chi tiết ngữ pháp:", err);
    res.status(500).send("Lỗi server");
  }
});

// 🩷 Danh sách ngữ pháp theo level
router.get("/:level?", requireAuth, async (req, res) => {
  try {
    const level = (req.params.level || "N5").toUpperCase(); // mặc định N5
    const grammars = await getQuery("SELECT * FROM grammar WHERE level = ?", [level]);

    res.render("grammar/index", {
      title: `Ngữ pháp ${level}`,
      grammars,
      level,
    });
  } catch (err) {
    console.error("❌ Lỗi lấy ngữ pháp:", err);
    res.status(500).send("Lỗi server");
  }
});

// 🧠 API chấm điểm luyện tập
router.post("/check", requireAuth, async (req, res) => {
  try {
    const { answers } = req.body;
    let correctCount = 0;
    let total = 0;

    for (let qid in answers) {
      const result = await getQuery(
        "SELECT correct_answer FROM grammar_exercises WHERE id = ?",
        [qid.replace("q", "")]
      );

      if (result.length && result[0].correct_answer === answers[qid]) {
        correctCount++;
      }
      total++;
    }

    res.json({
      correct: correctCount === total,
      message: `Bạn làm đúng ${correctCount}/${total} câu!`,
    });
  } catch (err) {
    console.error("❌ Lỗi chấm điểm:", err);
    res.status(500).json({ message: "Lỗi server khi chấm điểm" });
  }
});
// 🔍 AI phân tích điểm yếu ngữ pháp
router.post("/analyze", requireAuth, async (req, res) => {
  try {
    const { grammarId, quizResults } = req.body;
    // quizResults = [{ question, userAnswer, correctAnswer }, ...]

    // Lấy tên ngữ pháp để AI biết đang phân tích gì
const grammar = await getQuery("SELECT structure FROM grammar WHERE id = ?", [grammarId]);
const grammarName = grammar[0]?.structure || "Ngữ pháp chưa xác định";

    const prompt = `
Bạn là giáo viên tiếng Nhật. Hãy phân tích điểm yếu của học viên dựa trên bài luyện tập ngữ pháp "${grammarName}" dưới đây:

${quizResults.map((q, i) => `
Câu ${i + 1}:
- Câu hỏi: ${q.question}
- Trả lời của học viên: ${q.userAnswer}
- Đáp án đúng: ${q.correctAnswer}
`).join('\n')}

Hãy trả lời bằng tiếng Việt, gồm 2 phần:
1. 🧠 Tổng kết điểm mạnh và điểm yếu.
2. 🎯 Gợi ý học tập tiếp theo (cụ thể, ngắn gọn).
`;

const model = genAI.getGenerativeModel({ model: "models/gemini-2.0-flash" });
    const result = await model.generateContent(prompt);
    const analysis = result.response.text();

    res.json({ success: true, analysis });
  } catch (err) {
    console.error("❌ Lỗi phân tích điểm yếu:", err);
    res.status(500).json({ success: false, message: "Lỗi server khi phân tích điểm yếu" });
  }
});

// Thêm đoạn này vào cuối file routes/grammar.js (trước module.exports)
router.get('/:id/exercises', async (req, res) => {
  const grammarId = req.params.id;

  try {
    const [exercises] = await pool.query(
      'SELECT * FROM grammar_exercises WHERE grammar_id = ?',
      [grammarId]
    );

    res.render('partials/exerciseList', { exercises, layout: false });
  } catch (err) {
    console.error('❌ Lỗi khi tải bài luyện tập:', err);
    res.status(500).send('Lỗi khi tải bài luyện tập');
  }
});










module.exports = router;
