// routes/practice.js
const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth'); // nếu bạn đang bắt buộc login

// Route hiển thị trang luyện hội thoại
router.get('/conversation', requireAuth, (req, res) => {
  res.render('conversation', { user: req.session.user }); 
  // user để truyền vào EJS, nếu bạn không cần có thể bỏ { user: ... }
});

module.exports = router;
