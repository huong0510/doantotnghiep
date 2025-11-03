const express = require('express');
const router = express.Router();
const { getQuery } = require('../database/db');

router.get('/login', (req, res) => {
  res.render('admin/login', { title: 'Đăng nhập Admin' });
});

router.post('/login', async (req, res) => {
  const { username, password } = req.body;

  try {
    const users = await getQuery('SELECT * FROM users WHERE username = ? AND password = ?', [username, password]);
    const user = users[0];

    if (!user || user.role !== 'admin') {
      return res.render('admin/login', { title: 'Đăng nhập Admin', error: 'Sai thông tin hoặc không có quyền admin!' });
    }

    // ✅ Lưu session
    req.session.user = {
      id: user.id,
      username: user.username,
      isAdmin: true
    };

    res.redirect('/admin');
  } catch (error) {
    console.error(error);
    res.render('admin/login', { title: 'Đăng nhập Admin', error: 'Lỗi server!' });
  }
});

router.get('/logout', (req, res) => {
  req.session.destroy(() => res.redirect('/admin/login'));
});

module.exports = router;
