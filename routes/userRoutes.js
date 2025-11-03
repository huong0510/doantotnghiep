const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { getQuery, runQuery } = require('../database/db');

// 🧩 Middleware kiểm tra đăng nhập
const requireUser = (req, res, next) => {
  if (!req.session.user) return res.redirect('/login');
  next();
};

// ✅ Đảm bảo thư mục uploads tồn tại
const avatarDir = path.join(__dirname, '..', 'public', 'uploads', 'avatars');
fs.mkdirSync(avatarDir, { recursive: true });

// ⚙️ Cấu hình nơi lưu ảnh đại diện
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, avatarDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `avatar_${req.session.user.id}_${Date.now()}${ext}`);
  }
});
const upload = multer({ storage });

// 📄 Trang xem thông tin cá nhân
router.get('/profile', requireUser, async (req, res) => {
  try {
    const [user] = await getQuery('SELECT * FROM users WHERE id = ?', [req.session.user.id]);
    res.render('user/profile_view', { title: 'Thông tin cá nhân', user });
  } catch (err) {
    console.error('❌ Lỗi tải thông tin user:', err);
    res.status(500).send('Lỗi server khi tải thông tin người dùng');
  }
});

// ✏️ Trang chỉnh sửa thông tin
router.get('/profile/edit', requireUser, async (req, res) => {
  try {
    const [user] = await getQuery('SELECT * FROM users WHERE id = ?', [req.session.user.id]);
    res.render('user/profile', { title: 'Chỉnh sửa thông tin cá nhân', user, message: null });
  } catch (err) {
    console.error('❌ Lỗi tải user để sửa:', err);
    res.status(500).send('Lỗi server khi tải thông tin người dùng');
  }
});

// 💾 Lưu thay đổi thông tin cá nhân (kèm avatar)
router.post('/profile', requireUser, upload.single('avatar'), async (req, res) => {
  try {
    const userId = req.session.user.id;
    const { fullname, email, phone, password, date_of_birth, address, bio } = req.body;

    // 👉 Xử lý ảnh đại diện
    const avatarPath = req.file
      ? `/uploads/avatars/${req.file.filename}`
      : req.session.user.avatar || null;

    // 👉 Nếu có password mới thì hash
    if (password && password.trim() !== '') {
      const hashed = await bcrypt.hash(password, 10);
      await runQuery(
        `UPDATE users 
         SET fullname=?, email=?, phone=?, password=?, date_of_birth=?, address=?, bio=?, avatar=? 
         WHERE id=?`,
        [fullname, email, phone, hashed, date_of_birth, address, bio, avatarPath, userId]
      );
    } else {
      await runQuery(
        `UPDATE users 
         SET fullname=?, email=?, phone=?, date_of_birth=?, address=?, bio=?, avatar=? 
         WHERE id=?`,
        [fullname, email, phone, date_of_birth, address, bio, avatarPath, userId]
      );
    }

    // ✅ Cập nhật lại session
    Object.assign(req.session.user, {
      fullname,
      email,
      phone,
      date_of_birth,
      address,
      bio,
      avatar: avatarPath
    });

    // 👉 Sau khi lưu, chuyển về trang xem profile
    res.redirect('/user/profile');
  } catch (err) {
    console.error('❌ Lỗi cập nhật thông tin user:', err);
    res.status(500).send('Lỗi server khi cập nhật thông tin người dùng');
  }
});

module.exports = router;
