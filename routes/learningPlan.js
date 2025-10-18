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


/// 📥 POST /learning-plan/generate
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

        // ✅ Lưu vào DB( lưu tự động)
        //await runQuery(
            //"INSERT INTO learning_plan_history (student_name, level, goals, weak_points, available_time, plan, created_at) VALUES (?, ?, ?, ?, ?, ?, NOW())",
            //[name, level, goals, weakPoints, availableTime, aiPlan]
        //);

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
    // 🟢 Lấy tất cả dữ liệu cần thiết từ request body
    const { student_name, level, goals, weak_points, available_time, plan } = req.body;

    // 🟠 Kiểm tra dữ liệu bắt buộc
    if (!student_name || !level || !plan) {
      return res.status(400).json({ message: "Thiếu dữ liệu để lưu kế hoạch." });
    }

    // 🟢 Lưu vào DB
    await runQuery(
      `INSERT INTO learning_plan_history (student_name, level, goals, weak_points, available_time, plan, created_at)
       VALUES (?, ?, ?, ?, ?, ?, NOW())`,
      [student_name, level, goals || "", weak_points || "", available_time || "", plan]
    );

    res.json({ message: "✅ Lưu kế hoạch thành công!" });
  } catch (error) {
    console.error("❌ Lỗi khi lưu kế hoạch:", error);
    res.status(500).json({ message: "Lỗi server khi lưu kế hoạch.", error: error.message });
  }
});


// 📄 Giao diện xem lịch sử kế hoạch
router.get("/history-view", async (req, res) => {
  try {
    const plans = await getQuery(
      "SELECT id, student_name, level, goals, created_at FROM learning_plan_history ORDER BY created_at DESC"
    );

    res.render("learningPlanHistory", { 
      title: "Lịch sử kế hoạch học",
      plans
    });
  } catch (error) {
    console.error("❌ Lỗi khi lấy danh sách kế hoạch:", error);
    res.render("learningPlanHistory", { 
      title: "Lịch sử kế hoạch học",
      plans: []
    });
  }
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
// 🧠 Trang nhập ID kế hoạch (chỉ hiển thị form)
router.get("/analysis", (req, res) => {
  res.render("analysisResult", {
    title: "Phân tích năng lực (AI)",
    plan: null // 👈 không truyền kế hoạch nào cả
  });
});
// 🧠 Phân tích năng lực học viên từ điểm số
router.post("/analyze-progress", async (req, res) => {
    console.log("📥 POST /learning-plan/analyze-progress - body:", req.body);

  try {
    const { plan_id, grammar, vocab, listening, speaking, reading, study_time, weak_points } = req.body;

    // Lấy kế hoạch từ DB
    const planData = await getQuery("SELECT * FROM learning_plan_history WHERE id = ?", [plan_id]);
    if (!planData || planData.length === 0) {
      return res.json({ success: false, message: "Không tìm thấy kế hoạch để phân tích." });
    }

    const plan = planData[0];

    // 🧩 Tạo prompt gửi AI
    const prompt = `
Phân tích năng lực học viên dựa trên điểm số sau:
- Ngữ pháp: ${grammar}
- Từ vựng: ${vocab}
- Nghe: ${listening}
- Nói: ${speaking}
- Đọc: ${reading}
- Thời gian học mỗi ngày: ${study_time} giờ
- Lỗi thường gặp: ${weak_points}

Kế hoạch gốc của học viên:
${plan.plan}

Yêu cầu:
- Đánh giá năng lực tổng thể (theo thang 0–100).
- Nêu rõ kỹ năng mạnh/yếu.
- Gợi ý điều chỉnh kế hoạch học trong 1–2 tuần tới.
- Viết bằng tiếng Việt, rõ ràng, thân thiện.
`;

    // 🔑 Gọi Gemini API
    const fetch = await import("node-fetch");
    const response = await fetch.default(
      `https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: prompt }] }],
        }),
      }
    );

    const data = await response.json();
    const analysis = data?.candidates?.[0]?.content?.parts?.[0]?.text || "Không phân tích được.";

    // 💾 Lưu kết quả phân tích vào DB
    await runQuery(
      "UPDATE learning_plan_history SET analysis = ? WHERE id = ?",
      [analysis, plan_id]
    );

    res.json({ success: true, analysis });
  } catch (err) {
    console.error("❌ Lỗi khi phân tích năng lực:", err);
    res.json({ success: false, message: "Lỗi server khi phân tích năng lực." });
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

// 🧠 PHÂN TÍCH NĂNG LỰC (AI)
router.get("/analysis/:id", async (req, res) => {
  const planId = req.params.id;
  try {
    const planData = await getQuery("SELECT * FROM learning_plan_history WHERE id = ?", [planId]);
    if (!planData || planData.length === 0) {
      return res.render("error", { title: "Không tìm thấy kế hoạch", message: "Kế hoạch không tồn tại!" });
    }

    const plan = planData[0];

    // 🧠 Prompt cho AI
    const prompt = `
Phân tích năng lực học tiếng Nhật dựa trên kế hoạch sau:
${plan.plan}

Thông tin học viên:
- Tên: ${plan.student_name}
- Trình độ: ${plan.level}
- Mục tiêu: ${plan.goals || '—'}
- Kỹ năng yếu: ${plan.weak_points || '—'}
- Thời gian học mỗi ngày: ${plan.available_time || '—'}

Yêu cầu:
- Đánh giá năng lực hiện tại.
- Nêu ra điểm mạnh và điểm yếu.
- Gợi ý cải thiện trong 1–2 tuần tới.
- Viết bằng tiếng Việt, rõ ràng, thân thiện.
`;

    // ✅ Gọi Gemini
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
    let analysis = data?.candidates?.[0]?.content?.parts?.[0]?.text || "Không phân tích được.";

    // ✅ Render ra giao diện
    res.render("analysisResult", {
      title: "Phân tích năng lực (AI)",
      plan,
      analysis
    });

  } catch (error) {
    console.error("❌ Lỗi khi phân tích năng lực:", error);
    res.render("error", { title: "Lỗi server", message: "Không thể phân tích năng lực." });
  }
});



module.exports = router;
