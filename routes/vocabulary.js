const express = require('express');
const router = express.Router();
const { getQuery } = require('../database/db');
const vocabularyController = require('../controllers/vocabularyController');

// Lấy từ vựng ngẫu nhiên theo bài học
router.get('/random', async (req, res) => {
    try {
        const { lesson } = req.query;
        if (!lesson) return res.status(400).json({ error: 'Thiếu tham số lesson' });

        const query = `SELECT * FROM vocabulary WHERE lesson = ? ORDER BY RANDOM() LIMIT 1`;
        const result = await getQuery(query, [lesson]);

        if (!result || result.length === 0) return res.status(404).json({ error: 'Không tìm thấy từ vựng' });

        res.json(result[0]);
    } catch (error) {
        console.error('Lỗi khi lấy từ vựng:', error);
        res.status(500).json({ error: 'Lỗi server' });
    }
});

// Lấy các lựa chọn ngẫu nhiên cho câu hỏi
router.get('/random-choices', async (req, res) => {
    try {
        const { lesson, exclude } = req.query;
        if (!lesson || !exclude) return res.status(400).json({ error: 'Thiếu tham số lesson hoặc exclude' });

        const query = `SELECT meaning FROM vocabulary WHERE lesson = ? AND meaning != ? ORDER BY RANDOM() LIMIT 3`;
        const result = await getQuery(query, [lesson, exclude]);

        if (!result || result.length < 3) return res.status(404).json({ error: 'Không đủ lựa chọn' });

        res.json(result.map(item => item.meaning));
    } catch (error) {
        console.error('Lỗi khi lấy lựa chọn:', error);
        res.status(500).json({ error: 'Lỗi server' });
    }
});

// Lấy danh sách từ vựng theo bài học
router.get('/by-lesson/:lesson', async (req, res) => {
    try {
        const { lesson } = req.params;
        if (!lesson) return res.status(400).json({ error: 'Thiếu tham số lesson' });

        const query = `SELECT * FROM vocabulary WHERE lesson = ? ORDER BY id`;
        const result = await getQuery(query, [lesson]);

        if (!result || result.length === 0) return res.status(404).json({ error: 'Không tìm thấy từ vựng' });

        res.json(result);
    } catch (error) {
        console.error('Lỗi khi lấy danh sách từ vựng:', error);
        res.status(500).json({ error: 'Lỗi server' });
    }
});

// Route hiển thị trang từ vựng
router.get('/', vocabularyController.showVocabulary);

module.exports = router;
