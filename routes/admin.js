const express = require('express');
const router = express.Router();
const { runQuery, getQuery } = require('../database/db');

// Middleware kiểm tra admin
const requireAdmin = (req, res, next) => {
    if (!req.session.user || !req.session.user.isAdmin) {
        return res.status(403).json({ error: 'Không có quyền truy cập' });
    }
    next();
};

// Trang adminnpm install
router.get('/', requireAdmin, async (req, res) => {
    res.render('admin/index', {
        title: 'Quản trị',
        user: req.session.user
    });
});

// Quản lý users
router.get('/users', requireAdmin, async (req, res) => {
    try {
        const users = await getQuery(`
            SELECT u.*, us.total_games_played, us.total_score, us.last_login
            FROM users u
            LEFT JOIN user_statistics us ON u.id = us.user_id
        `);
        res.json(users);
    } catch (error) {
        res.status(500).json({ error: 'Lỗi server' });
    }
});

// Quản lý từ vựng
router.get('/vocabulary', requireAdmin, async (req, res) => {
    try {
        const vocabulary = await getQuery('SELECT * FROM vocabulary ORDER BY lesson');
        res.json(vocabulary);
    } catch (error) {
        res.status(500).json({ error: 'Lỗi server' });
    }
});

// Thêm từ vựng mới
router.post('/vocabulary', requireAdmin, async (req, res) => {
    try {
        const { lesson, japanese, vietnamese, type } = req.body;
        await runQuery(
            'INSERT INTO vocabulary (lesson, japanese, vietnamese, type) VALUES (?, ?, ?, ?)',
            [lesson, japanese, vietnamese, type]
        );
        res.json({ message: 'Thêm từ vựng thành công' });
    } catch (error) {
        res.status(500).json({ error: 'Lỗi server' });
    }
});

// Cập nhật từ vựng
router.put('/vocabulary/:id', requireAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const { lesson, japanese, vietnamese, type } = req.body;
        await runQuery(
            'UPDATE vocabulary SET lesson = ?, japanese = ?, vietnamese = ?, type = ? WHERE id = ?',
            [lesson, japanese, vietnamese, type, id]
        );
        res.json({ message: 'Cập nhật từ vựng thành công' });
    } catch (error) {
        res.status(500).json({ error: 'Lỗi server' });
    }
});

// Xóa từ vựng
router.delete('/vocabulary/:id', requireAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        await runQuery('DELETE FROM vocabulary WHERE id = ?', [id]);
        res.json({ message: 'Xóa từ vựng thành công' });
    } catch (error) {
        res.status(500).json({ error: 'Lỗi server' });
    }
});

// Thống kê truy cập
router.get('/access-stats', requireAdmin, async (req, res) => {
    try {
        const stats = await getQuery(`
            SELECT 
                DATE(accessed_at) as date,
                COUNT(*) as total_visits,
                COUNT(DISTINCT user_id) as unique_users
            FROM access_logs
            GROUP BY DATE(accessed_at)
            ORDER BY date DESC
            LIMIT 30
        `);
        res.json(stats);
    } catch (error) {
        res.status(500).json({ error: 'Lỗi server' });
    }
});

// Thống kê game
router.get('/game-stats', requireAdmin, async (req, res) => {
    try {
        const stats = await getQuery(`
            SELECT 
                game_type,
                COUNT(*) as total_games,
                AVG(score) as avg_score,
                SUM(correct_answers) as total_correct,
                SUM(wrong_answers) as total_wrong
            FROM game_scores
            GROUP BY game_type
        `);
        res.json(stats);
    } catch (error) {
        res.status(500).json({ error: 'Lỗi server' });
    }
});

module.exports = router; 