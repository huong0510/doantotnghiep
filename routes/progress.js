const express = require('express');
const router = express.Router();
const { getQuery, runQuery } = require('../database/db');

// 🟩 1️⃣ LẤY TIẾN ĐỘ — tự tạo nếu chưa có
router.get('/:planId', async (req, res) => {
  const { planId } = req.params;
  try {
    // Lấy tiến độ hiện có
    const result = await getQuery(
      'SELECT * FROM learning_progress WHERE plan_id = ? ORDER BY day_number ASC',
      [planId]
    );

    // ❌ Nếu chưa có → tự khởi tạo tiến độ mặc định
    if (result.length === 0) {
      const planData = await getQuery(
        'SELECT plan FROM learning_plan_history WHERE id = ?',
        [planId]
      );

// 🧠 Xác định tiến độ theo "Giai đoạn"
let totalStages = 5; // mặc định
try {
  const planText = planData[0].plan;

  // Lấy tất cả "Giai đoạn X"
 const stageMatches = planText.match(/^Giai đoạn\s*\d+/gim);
  if (stageMatches && stageMatches.length > 0) {
    totalStages = stageMatches.length;
    console.log(`📘 Phát hiện ${totalStages} giai đoạn trong kế hoạch.`);
  } else {
    console.warn("⚠️ Không tìm thấy 'Giai đoạn', dùng mặc định 5 giai đoạn.");
  }

  // 🔧 Tạo tiến độ theo giai đoạn
  for (let i = 1; i <= totalStages; i++) {
    await runQuery(
      'INSERT INTO learning_progress (plan_id, day_number, status) VALUES (?, ?, ?)',
      [planId, i, 'not_started']
    );
  }

  console.log(`✅ Đã tự khởi tạo tiến độ ${totalStages} giai đoạn cho plan_id=${planId}`);

  const newResult = await getQuery(
    'SELECT * FROM learning_progress WHERE plan_id = ?',
    [planId]
  );
  return res.json(newResult);

} catch (e) {
  console.error("❌ Lỗi khi xử lý nội dung kế hoạch:", e);
  res.status(500).json({ error: "Không thể phân tích kế hoạch để tạo tiến độ." });
}



      // 🔧 Tạo tiến độ tương ứng
      for (let i = 1; i <= totalDays; i++) {
        await runQuery(
          'INSERT INTO learning_progress (plan_id, day_number, status) VALUES (?, ?, ?)',
          [planId, i, 'not_started']
        );
      }

      console.log(`✅ Đã tự khởi tạo tiến độ ${totalDays} ngày cho plan_id=${planId}`);

      const newResult = await getQuery(
        'SELECT * FROM learning_progress WHERE plan_id = ? ORDER BY day_number ASC',
        [planId]
      );
      return res.json(newResult);
    }

    // ✅ Nếu đã có tiến độ → trả về luôn
    res.json(result);
  } catch (err) {
    console.error('❌ Lỗi khi lấy tiến độ:', err);
    res.status(500).json({ error: 'Lỗi khi lấy tiến độ học' });
  }
});

// 🟨 2️⃣ KHỞI TẠO THỦ CÔNG
router.post('/init', async (req, res) => {
  const { planId, totalDays = 10 } = req.body;
  try {
    const existing = await getQuery(
      'SELECT * FROM learning_progress WHERE plan_id = ?',
      [planId]
    );

    if (existing.length > 0) {
      return res.status(400).json({ message: 'Tiến độ đã tồn tại rồi!' });
    }

    for (let i = 1; i <= totalDays; i++) {
      await runQuery(
        'INSERT INTO learning_progress (plan_id, day_number, status) VALUES (?, ?, ?)',
        [planId, i, 'not_started']
      );
    }

    res.json({ message: 'Khởi tạo tiến độ thành công!' });
  } catch (err) {
    console.error('❌ Lỗi khi khởi tạo tiến độ:', err);
    res.status(500).json({ error: 'Lỗi khi khởi tạo tiến độ học' });
  }
});

// 🟡 Cập nhật trạng thái + trả progress mới
router.post('/update', async (req, res) => {
  const { planId, dayNumber, status } = req.body; // <-- quan trọng: trùng key với FE
  try {
    await runQuery(
      'UPDATE learning_progress SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE plan_id = ? AND day_number = ?',
      [status, planId, dayNumber]
    );

    const progress = await getQuery(
      'SELECT * FROM learning_progress WHERE plan_id = ? ORDER BY day_number ASC',
      [planId]
    );

    res.json({ message: `Ngày ${dayNumber} → ${status}`, progress });
  } catch (err) {
    console.error('❌ Lỗi khi cập nhật tiến độ:', err);
    res.status(500).json({ error: 'Lỗi khi cập nhật tiến độ học' });
  }
});


module.exports = router;
