const express = require('express');
const router = express.Router();
const { runQuery, getQuery } = require('../database/db');

// 📘 Lưu nhật ký học tập
router.post('/save', async (req, res) => {
  try {
    const planId = req.body.planId || req.body.plan_id;
    const stageNumber = req.body.stageNumber || req.body.stage_number;
    const note = req.body.note;

    if (!planId || !stageNumber || !note) {
      return res.status(400).json({ error: 'Thiếu dữ liệu cần thiết' });
    }

    await runQuery(
      `INSERT INTO learning_journal (plan_id, stage_number, note)
       VALUES (?, ?, ?)`,
      [planId, stageNumber, note]
    );

    res.json({ message: '✅ Đã lưu nhật ký học tập thành công!' });
  } catch (err) {
    console.error('❌ Lỗi khi lưu nhật ký:', err);
    res.status(500).json({ error: 'Lỗi server khi lưu nhật ký', details: err.message });
  }
});

// 📗 Lấy danh sách nhật ký theo kế hoạch
router.get('/:planId', async (req, res) => {
  try {
    const planId = req.params.planId;
    const result = await getQuery(
      `SELECT * FROM learning_journal WHERE plan_id = ? ORDER BY created_at DESC`,
      [planId]
    );
    res.json(result);
  } catch (err) {
    console.error('❌ Lỗi khi tải nhật ký:', err);
    res.status(500).json({ error: 'Lỗi server khi tải nhật ký' });
  }
});
// ✏️ Cập nhật nhật ký
router.put('/update/:id', async (req, res) => {
  try {
    const { note } = req.body;
    const { id } = req.params;

    if (!note) return res.status(400).json({ error: 'Nội dung không được để trống' });

    await runQuery(`UPDATE learning_journal SET note = ? WHERE id = ?`, [note, id]);
    res.json({ message: '✅ Đã cập nhật nhật ký thành công!' });
  } catch (err) {
    console.error('❌ Lỗi khi cập nhật nhật ký:', err);
    res.status(500).json({ error: 'Lỗi server khi cập nhật nhật ký' });
  }
});

// 🗑️ Xóa nhật ký
router.delete('/delete/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await runQuery(`DELETE FROM learning_journal WHERE id = ?`, [id]);
    res.json({ message: '🗑️ Đã xóa nhật ký thành công!' });
  } catch (err) {
    console.error('❌ Lỗi khi xóa nhật ký:', err);
    res.status(500).json({ error: 'Lỗi server khi xóa nhật ký' });
  }
});

module.exports = router;
