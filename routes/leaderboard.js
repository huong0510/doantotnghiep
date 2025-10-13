const express = require('express');
const router = express.Router();
const { getQuery } = require('../database/db');
const { requireAuth } = require('../middleware/auth');

// Trang bảng xếp hạng
router.get('/', requireAuth, async (req, res) => {
    try {
        const { gameType } = req.query;
        let query = `
            SELECT u.fullname, u.username, 
                   SUM(gs.score) as total_score,
                   COUNT(*) as games_played,
                   SUM(gs.correct_answers) as total_correct,
                   SUM(gs.wrong_answers) as total_wrong
            FROM game_scores gs
            JOIN users u ON gs.user_id = u.id
        `;

        // Nếu có chọn game cụ thể
        if (gameType) {
            query += ` WHERE gs.game_type = ?`;
        }

        query += `
            GROUP BY u.id
            ORDER BY total_score DESC
            LIMIT 10
        `;

        const leaderboard = await getQuery(query, gameType ? [gameType] : []);

        res.render('leaderboard', {
            title: 'Bảng xếp hạng',
            user: req.session.user,
            leaderboard: leaderboard,
            gameType: gameType
        });
    } catch (error) {
        console.error('Lỗi khi lấy bảng xếp hạng:', error);
        res.status(500).send('Lỗi server');
    }
});

module.exports = router; 