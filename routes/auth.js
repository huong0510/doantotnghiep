const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const { getQuery, runQuery } = require('../database/db');

// Trang đăng nhập
router.get('/login', (req, res) => {
    
    res.render('auth/login', { 
        title: 'Đăng nhập',
        user: req.session.user 
    });
});

// --- Đăng xuất ---
router.get("/logout", (req, res) => {
  req.session.destroy(err => {
    if (err) {
      console.error("❌ Lỗi khi logout:", err);
      return res.redirect("/");
    }
    res.redirect("/login"); // về login sau khi logout
  });
});

// Trang đăng ký
router.get('/register', (req, res) => {
    res.render('auth/register', {
        title: 'Đăng ký',
        user: req.session.user
    });
});

// Đăng ký
router.post('/register', async (req, res) => {
    try {
        const { username, fullname, phone, password } = req.body;
        
        // ✅ Kiểm tra dữ liệu bắt buộc
    if (!username || !fullname || !phone || !password) {
      return res.status(400).json({ error: 'Vui lòng điền đầy đủ thông tin' });
    }

        // Kiểm tra username đã tồn tại
        const existingUser = await getQuery('SELECT * FROM users WHERE username = ?', [username]);
        if (existingUser.length > 0) {
            return res.status(400).json({ error: 'Tên đã tồn tại' });
        }

        // Mã hóa mật khẩu
        const hashedPassword = await bcrypt.hash(password, 10);

        // ✅ Thêm user mới vào bảng `users`
    const result = await runQuery(
      `INSERT INTO users (username, password, fullname, phone, created_at) 
       VALUES (?, ?, ?, ?, NOW())`,
      [username, hashedPassword, fullname, phone]
    );

        // Tạo bản ghi thống kê cho user mới
        await runQuery(
            'INSERT INTO user_statistics (user_id) VALUES (?)',
            [result.insertId]
        );

        res.json({ message: 'Đăng ký thành công' });
    } catch (error) {
        console.error('Lỗi đăng ký:', error);
        res.status(500).json({ error: 'Lỗi server' });
    }
});

// Đăng nhập
router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;

        // Kiểm tra các trường bắt buộc
        if (!username || !password) {
            return res.status(400).json({ error: 'Vui lòng điền đầy đủ thông tin' });
        }

        // Tìm user
        const users = await getQuery('SELECT * FROM users WHERE username = ?', [username]);
        if (users.length === 0) {
            return res.status(400).json({ error: 'Tên không tồn tại' });
        }

        const user = users[0];

        // Kiểm tra mật khẩu
        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) {
            return res.status(400).json({ error: 'Sai mật khẩu' });
        }

        // Lưu session
        req.session.user = {
            id: user.id,
            username: user.username,
            fullname: user.fullname
        };

        // Cập nhật thống kê
        await runQuery(
            'UPDATE user_statistics SET last_login = CURRENT_TIMESTAMP WHERE user_id = ?',
            [user.id]
        );

        res.json({ message: 'Đăng nhập thành công' });
    } catch (error) {
        console.error('Lỗi đăng nhập:', error);
        res.status(500).json({ error: 'Lỗi server' });
    }
});

// Đăng xuất
router.post('/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/');
});

// Route GET cho logout
router.get('/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/auth/login');
});

module.exports = router; 