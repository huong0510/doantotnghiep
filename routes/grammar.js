const express = require("express");
const router = express.Router();
const { getQuery } = require("../database/db");
const { requireAuth } = require("../middleware/auth");
const { pool } = require('../database/db');


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
