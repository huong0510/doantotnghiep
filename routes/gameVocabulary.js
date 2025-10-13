const express = require('express');
const router = express.Router();
const gameVocabularyController = require('../controllers/gameVocabularyController');

// Lấy danh sách bài học cho game
router.get('/lessons', gameVocabularyController.getLessons);

// Lấy từ vựng theo bài học cho game
router.get('/vocabulary/:lesson', gameVocabularyController.getVocabularyByLesson);

// Lưu điểm game
router.post('/save-score', gameVocabularyController.saveScore);

module.exports = router; 