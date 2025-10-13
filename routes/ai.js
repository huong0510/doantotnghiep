const express = require('express');
const fetch = require('node-fetch');
const router = express.Router();

router.post('/ask', async (req, res) => {
    const { question } = req.body;

    if (!question) {
        return res.status(400).json({ error: "Thiếu câu hỏi" });
    }

    try {
        const response = await fetch(
            "https://generativelanguage.googleapis.com/v1/models/gemini-1.5-pro:generateContent?key=" + process.env.GEMINI_API_KEY,
            {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: question }] }]
                })
            }
        );

        const data = await response.json();
        res.json(data);
    } catch (error) {
        console.error("AI API Error:", error);
        res.status(500).json({ error: "Lỗi khi gọi AI API" });
    }
});
router.post('/plan', async (req, res) => {
    try {
        const response = await fetch(
            "https://generativelanguage.googleapis.com/v1/models/gemini-1.5-pro:generateContent?key=" + process.env.GEMINI_API_KEY,
            {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    contents: [{
                        parts: [{
                            text: "Tạo một kế hoạch học tiếng Nhật trong 1 ngày cho người mới bắt đầu (ví dụ: từ vựng, ngữ pháp, luyện nghe). Trả lời ngắn gọn."
                        }]
                    }]
                })
            }
        );

        const data = await response.json();
        const plan = data?.candidates?.[0]?.content?.parts?.[0]?.text || "Không có dữ liệu.";
        res.json({ plan });
    } catch (err) {
        console.error("AI API Error:", err);
        res.status(500).json({ plan: "Lỗi khi gọi AI" });
    }
});

module.exports = router;
