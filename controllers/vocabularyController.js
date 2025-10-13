const { getQuery } = require('../database/db');
const fs = require('fs');

const vocabularyController = {
    // Hiển thị trang từ vựng
    async showVocabulary(req, res) {
        try {
            const lesson = parseInt(req.query.lesson) || 1;

            // Lấy danh sách các bài học có dữ liệu
            const lessons = await getQuery('SELECT DISTINCT lesson FROM vocabulary ORDER BY lesson');

            // Lấy danh sách từ vựng theo bài học
            const vocabulary = await getQuery(
                'SELECT * FROM vocabulary WHERE lesson = ? ORDER BY id',
                [lesson]
            );

            // Ghi log ra file để kiểm tra dữ liệu thực tế
            fs.writeFileSync('debug_lessons.json', JSON.stringify({ lessons, vocabulary }, null, 2));

            // Render view với title
            res.render('vocabulary', {
                title: `Bài ${lesson} - Từ vựng`, // ✅ thêm title
                vocabulary,
                lesson,
                lessons: lessons.map(l => l.lesson)
            });
        } catch (error) {
            console.error('Lỗi khi lấy dữ liệu từ vựng:', error);
            res.status(500).send('Đã xảy ra lỗi khi tải trang từ vựng');
        }
    }
};

module.exports = vocabularyController;
