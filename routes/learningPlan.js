const express = require("express");
const router = express.Router();
require("dotenv").config();
const { getQuery, runQuery } = require("../database/db");
const { requireAuth } = require("../middleware/auth"); // 🧩 Thêm dòng này


const GEMINI_KEY = process.env.GEMINI_API_KEY;

// 📄 Giao diện kế hoạch học (🔒 yêu cầu đăng nhập)
router.get("/", requireAuth, (req, res) => {
  res.render("learningPlan", { title: "Kế hoạch học tiếng Nhật" });
})


// 📥 POST /learning-plan/generate
router.post("/generate", async (req, res) => {
    try {
        const { name, level, goals, weakPoints, availableTime } = req.body;

        // ✅ Lấy danh sách bài học ngữ pháp
        const lessons = await getQuery(
            "SELECT id, structure, meaning FROM grammar WHERE level = ?",
            [level]
        );

        if (!lessons || lessons.length === 0) {
            return res.status(404).json({ message: `Không tìm thấy bài học cho level ${level}` });
        }

        // ✅ Prompt cho AI
        const prompt = `
Hãy tạo kế hoạch học tiếng Nhật chi tiết cho trình độ ${level}.
Tên học viên: ${name}
Mục tiêu: ${goals}
Kỹ năng yếu: ${weakPoints}
Thời gian học mỗi ngày: ${availableTime}

Danh sách bài học gợi ý:
${lessons.map((l, i) => `${i + 1}. ${l.structure}: ${l.meaning}`).join("\n")}

👉 Yêu cầu:
- Chia thành các buổi học (Buổi 1, Buổi 2, ...).
- Gợi ý nội dung học và bài ngữ pháp tương ứng.
- Mô tả ngắn gọn từng buổi (1–3 câu).
- Viết bằng tiếng Việt, dễ hiểu.
`;

        // ✅ Gọi Gemini API (dùng model hợp lệ)
        const fetch = await import("node-fetch");
        const response = await fetch.default(
            `https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent?key=${GEMINI_KEY}`,
            {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    contents: [{ role: "user", parts: [{ text: prompt }] }],
                }),
            }
        );

        const data = await response.json();
        console.log("🔍 Gemini response:", JSON.stringify(data, null, 2));

        let aiPlan = "Không tạo được kế hoạch.";
        if (data?.candidates?.[0]?.content?.parts?.[0]?.text) {
            aiPlan = data.candidates[0].content.parts[0].text.trim();
        } else if (data.error) {
            console.error("⚠️ Gemini error:", data.error.message);
            aiPlan = "Lỗi từ AI: " + data.error.message;
        }

        // ✅ Lưu vào DB
        await runQuery(
            "INSERT INTO learning_plan_history (student_name, level, goals, weak_points, available_time, plan, created_at) VALUES (?, ?, ?, ?, ?, ?, NOW())",
            [name, level, goals, weakPoints, availableTime, aiPlan]
        );

        res.json({
            message: "✅ Tạo và lưu kế hoạch thành công!",
            level,
            plan: aiPlan,
        });
    } catch (error) {
        console.error("❌ Lỗi khi tạo kế hoạch học:", error);
        res.status(500).json({ error: "Lỗi server khi tạo kế hoạch học" });
    }
});
// 📥 Lưu kế hoạch học thủ công (khi bấm nút 💾)
router.post("/save", async (req, res) => {
  try {
    const { student_name, level, plan } = req.body;

    if (!student_name || !level || !plan) {
      return res.status(400).json({ message: "Thiếu dữ liệu để lưu kế hoạch." });
    }

    await runQuery(
      "INSERT INTO learning_plan_history (student_name, level, plan) VALUES (?, ?, ?)",
      [student_name, level, plan]
    );

    res.json({ message: "✅ Lưu kế hoạch thành công!" });
  } catch (error) {
    console.error("❌ Lỗi khi lưu kế hoạch:", error);
    res.status(500).json({ message: "Lỗi server khi lưu kế hoạch." });
  }
});

// 📄 Giao diện xem lịch sử kế hoạch
router.get("/history-view", (req, res) => {
    res.render("learningPlanHistory", { title: "Lịch sử kế hoạch học" });
});

// 📦 API lấy danh sách kế hoạch (cho trang lịch sử)
router.get("/history", async (req, res) => {
    try {
        const plans = await getQuery(
            "SELECT id, student_name, level, created_at FROM learning_plan_history ORDER BY created_at DESC"
        );
        res.json(plans);
    } catch (error) {
        console.error("❌ Lỗi khi lấy danh sách kế hoạch:", error);
        res.status(500).json({ message: "Lỗi khi lấy danh sách kế hoạch" });
    }
});

// 🔍 Xem chi tiết kế hoạch
router.get("/:id", async (req, res) => {
    const { id } = req.params;
    try {
        const plan = await getQuery("SELECT * FROM learning_plan_history WHERE id = ?", [id]);
        if (plan.length === 0) return res.status(404).json({ message: "Không tìm thấy kế hoạch" });
        res.json(plan[0]);
    } catch (error) {
        console.error("❌ Lỗi khi lấy chi tiết kế hoạch:", error);
        res.status(500).json({ message: "Lỗi khi lấy chi tiết kế hoạch" });
    }
});

// 🗑 Xóa kế hoạch học theo ID
router.delete("/:id", async (req, res) => {
    const { id } = req.params;
    try {
        const result = await runQuery("DELETE FROM learning_plan_history WHERE id = ?", [id]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "Không tìm thấy kế hoạch để xóa" });
        }
        res.json({ message: "🗑️ Đã xóa kế hoạch thành công!" });
    } catch (error) {
        console.error("❌ Lỗi khi xóa kế hoạch:", error);
        res.status(500).json({ message: "Lỗi server khi xóa kế hoạch" });
    }
});

module.exports = router;
