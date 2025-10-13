const { runQuery } = require('../database/db');

// Lấy danh sách bài học cho game
exports.getLessons = async (req, res) => {
    try {
        const query = `
            SELECT DISTINCT v.lesson, vl.name 
            FROM vocabulary v
            LEFT JOIN vocabulary_lesson vl ON v.lesson = vl.lesson
            WHERE v.lesson IS NOT NULL
            ORDER BY v.lesson ASC
        `;
        const lessons = await runQuery(query);
        res.json(lessons);
    } catch (error) {
        console.error('Error getting lessons:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Lấy từ vựng theo bài học cho game
exports.getVocabularyByLesson = async (req, res) => {
    try {
        const { lesson } = req.params;
        const query = `
            SELECT word, meaning, romaji, kanji, kanji_reading
            FROM vocabulary 
            WHERE lesson = ?
        `;
        const vocabulary = await runQuery(query, [lesson]);
        res.json(vocabulary);
    } catch (error) {
        console.error('Error getting vocabulary:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Lưu điểm game
exports.saveScore = async (req, res) => {
    try {
        const { userId, score, correctAnswers, wrongAnswers, maxCombo, level } = req.body;

        // Cho phép 0, chỉ reject khi null hoặc undefined
        if (
            userId == null ||
            score == null ||
            correctAnswers == null ||
            wrongAnswers == null ||
            maxCombo == null ||
            level == null
        ) {
            return res.status(400).json({ 
                success: false,
                error: 'Thiếu thông tin cần thiết' 
            });
        }

        // Lưu điểm vào DB
        await runQuery(
            'INSERT INTO game_scores (user_id, game_type, score, correct_answers, wrong_answers, max_combo, level) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [userId, 'vocabulary', score, correctAnswers, wrongAnswers, maxCombo, level]
        );

        // Cập nhật thống kê người dùng
        await runQuery(
            'UPDATE user_statistics SET total_games_played = total_games_played + 1, total_score = total_score + ? WHERE user_id = ?',
            [score, userId]
        );

        res.json({ 
            success: true,
            message: 'Lưu điểm thành công',
            redirectUrl: '/leaderboard?gameType=vocabulary'
        });
    } catch (error) {
        console.error('Error saving score:', error);
        res.status(500).json({ 
            success: false,
            error: 'Lỗi server',
            details: error.message 
        });
    }
};