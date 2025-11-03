const express = require("express");
const router = express.Router();
const { getQuery, runQuery } = require("../database/db");

// 📘 Trang danh sách từ vựng (có tìm kiếm)
router.get("/", async (req, res) => {
  try {
    const search = req.query.search ? `%${req.query.search}%` : "%%";

    const vocabularies = await getQuery(
      `
      SELECT v.id, v.word, v.romaji, v.type, v.meaning, 
             v.kanji, v.kanji_reading, l.name AS lesson_name
      FROM vocabulary v
      LEFT JOIN vocabulary_lesson l ON v.lesson = l.lesson
      WHERE v.word LIKE ? OR v.meaning LIKE ? OR l.name LIKE ?
      ORDER BY v.id ASC
      `,
      [search, search, search]
    );

    const lessons = await getQuery(`
      SELECT lesson, name FROM vocabulary_lesson ORDER BY lesson ASC
    `);

    res.render("admin/vocabulary", {
      title: "Quản lý từ vựng",
      vocabularies,
      lessons,
      search: req.query.search || "",
    });
  } catch (err) {
    console.error("❌ Lỗi truy vấn từ vựng:", err);
    res.status(500).send("Lỗi khi lấy dữ liệu từ vựng.");
  }
});

// ➕ Thêm từ vựng
router.post("/add", async (req, res) => {
  try {
    const { lesson, word, romaji, type, meaning, kanji, kanji_reading } = req.body;
    await runQuery(
      `INSERT INTO vocabulary (lesson, word, romaji, type, meaning, kanji, kanji_reading) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [lesson, word, romaji, type, meaning, kanji, kanji_reading]
    );
    res.redirect("/admin/vocabulary");
  } catch (err) {
    console.error("❌ Lỗi thêm từ vựng:", err);
    res.status(500).send("Lỗi khi thêm từ vựng.");
  }
});

// ✏️ Sửa từ vựng
router.post("/edit/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { lesson, word, romaji, type, meaning, kanji, kanji_reading } = req.body;

    await runQuery(
      `UPDATE vocabulary 
       SET lesson=?, word=?, romaji=?, type=?, meaning=?, kanji=?, kanji_reading=?
       WHERE id=?`,
      [lesson, word, romaji, type, meaning, kanji, kanji_reading, id]
    );

    res.redirect("/admin/vocabulary");
  } catch (err) {
    console.error("❌ Lỗi sửa từ vựng:", err);
    res.status(500).send("Lỗi khi sửa từ vựng.");
  }
});

// ❌ Xóa từ vựng
router.post("/delete/:id", async (req, res) => {
  try {
    const { id } = req.params;
    await runQuery(`DELETE FROM vocabulary WHERE id = ?`, [id]);
    res.redirect("/admin/vocabulary");
  } catch (err) {
    console.error("❌ Lỗi xóa từ vựng:", err);
    res.status(500).send("Lỗi khi xóa từ vựng.");
  }
});

module.exports = router;
