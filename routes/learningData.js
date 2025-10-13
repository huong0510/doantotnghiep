const express = require("express");
const router = express.Router();
const { getQuery } = require("../database/db"); // ✅ Sửa lại đúng đường dẫn

// 📘 Lấy dữ liệu bài học theo level
router.get("/:level", async (req, res) => {
  const { level } = req.params;

  try {
    // ✅ Truy vấn từ bảng grammar (vì bạn đang lưu bài học ở đó)
    const lessons = await getQuery(
      "SELECT id, structure, meaning, example, translation FROM grammar WHERE level = ? LIMIT 30",
      [level]
    );

    res.json({ success: true, lessons });
  } catch (err) {
    console.error("❌ Lỗi khi lấy bài học:", err);
    res.status(500).json({ success: false, error: "Không lấy được dữ liệu học" });
  }
});

module.exports = router;
