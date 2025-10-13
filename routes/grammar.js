const express = require("express");
const router = express.Router();
const { getQuery } = require("../database/db");
const { requireAuth } = require("../middleware/auth");

// 🩷 Route chi tiết ngữ pháp theo ID
router.get("/:id(\\d+)", requireAuth, async (req, res) => {
  try {
    const id = req.params.id;
    const rows = await getQuery("SELECT * FROM grammar WHERE id = ?", [id]);

    if (rows.length === 0) {
      return res.status(404).send("Không tìm thấy ngữ pháp");
    }

    res.render("grammar/detail", {
      title: "Chi tiết ngữ pháp",
      grammar: rows[0],
    });
  } catch (err) {
    console.error("❌ Lỗi chi tiết ngữ pháp:", err);
    res.status(500).send("Lỗi server");
  }
});

// 🩷 Route danh sách ngữ pháp theo level
router.get("/:level?", requireAuth, async (req, res) => {
  try {
    const level = (req.params.level || "N5").toUpperCase(); // mặc định N5
    const grammars = await getQuery("SELECT * FROM grammar WHERE level = ?", [level]);
    res.render("grammar/index", { title: `Ngữ pháp ${level}`, grammars, level });
  } catch (err) {
    console.error("❌ Lỗi lấy ngữ pháp:", err);
    res.status(500).send("Lỗi server");
  }
});

module.exports = router;
