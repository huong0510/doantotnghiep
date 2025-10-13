const express = require("express");
const router = express.Router();
const { getQuery } = require("../database/db");

// 📄 Trang xem kế hoạch học đã lưu
router.get("/", async (req, res) => {
    try {
        const plans = await getQuery("SELECT * FROM learning_plan ORDER BY created_at DESC");
        res.render("viewPlan", { title: "Kế hoạch học đã lưu", plans });
    } catch (error) {
        console.error(error);
        res.status(500).send("Lỗi khi tải danh sách kế hoạch");
    }
});

module.exports = router;
