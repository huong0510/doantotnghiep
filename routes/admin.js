const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const { pool, runQuery, getQuery } = require('../database/db');

// ============================
// 🧩 Middleware kiểm tra quyền Admin
// ============================
const requireAdmin = (req, res, next) => {
  console.log("🧩 Kiểm tra quyền admin:", req.session.admin);

  if (!req.session.admin) {
    console.log("🚫 Không có session admin");
    return res.redirect('/admin/login');
  }

  console.log("✅ Admin hợp lệ:", req.session.admin.username);
  next();
};

// ============================
// 🏠 Trang chính admin
// ============================
router.get('/', requireAdmin, async (req, res) => {
  res.render('admin/index', {
    title: 'Bảng điều khiển Admin',
    user: req.session.admin
  });
});

// ============================
// 🔐 Đăng nhập admin
// ============================
router.get('/login', (req, res) => {
  res.render('admin/login', { title: 'Đăng nhập Admin' });
});

router.post('/login', async (req, res) => {
  const { username, password } = req.body;

  try {
    const admin = await getQuery('SELECT * FROM admins WHERE username = ?', [username]);

    if (admin.length === 0) {
      return res.render('admin/login', { title: 'Đăng nhập Admin', error: 'Không tìm thấy tài khoản admin này.' });
    }

    const user = admin[0];
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.render('admin/login', { title: 'Đăng nhập Admin', error: 'Sai mật khẩu!' });
    }

    // ✅ Lưu session RIÊNG CHO ADMIN
    req.session.admin = {
      id: user.id,
      username: user.username,
      role: 'admin'
    };

    console.log("✅ Đăng nhập admin thành công:", req.session.admin);

    res.redirect('/admin');
  } catch (error) {
    console.error('❌ Lỗi đăng nhập admin:', error);
    res.status(500).send('Lỗi server khi đăng nhập.');
  }
});

// ============================
// 🚪 Đăng xuất
// ============================
router.get('/logout', (req, res) => {
  delete req.session.admin;
  console.log("👋 Admin đã đăng xuất");
  res.redirect('/admin/login');
});

// ============================
// 📊 Thống kê tiến độ học tập
// ============================
router.get("/progress", requireAdmin, async (req, res) => {
  try {
    const { level } = req.query;
    let sql = `
      SELECT 
        h.id AS plan_id,
        h.student_name,
        h.level,
        COUNT(p.id) AS total_lessons,
        SUM(CASE WHEN p.status = 'completed' THEN 1 ELSE 0 END) AS completed_lessons,
        ROUND(
          (SUM(CASE WHEN p.status = 'completed' THEN 1 ELSE 0 END) / COUNT(p.id)) * 100,
          1
        ) AS progress_percent,
        MAX(p.updated_at) AS last_update
      FROM learning_plan_history h
      LEFT JOIN learning_progress p ON h.id = p.plan_id
    `;

    if (level) sql += ` WHERE h.level = '${level}'`;

    sql += `
      GROUP BY h.id, h.student_name, h.level
      ORDER BY progress_percent DESC
    `;

    const progress = await getQuery(sql);

    res.render("admin/learning_progress", { 
      title: "📊 Tiến độ học tập người dùng", 
      progress,
      selectedLevel: level || ""
    });
  } catch (err) {
    console.error("❌ Lỗi truy vấn tiến độ:", err);
    res.status(500).send("Lỗi máy chủ nội bộ");
  }
});

// ============================
// 👥 Quản lý người dùng
// ============================
router.get("/users", requireAdmin, async (req, res) => {
  try {
    const users = await getQuery(`
      SELECT id, username, fullname, email, phone, role, created_at 
      FROM users
      ORDER BY id ASC
    `);
    res.render("admin/users", { title: "Quản lý người dùng", users });
  } catch (err) {
    console.error("❌ Lỗi khi lấy danh sách người dùng:", err);
    res.status(500).send("Lỗi server khi tải danh sách người dùng");
  }
});

// 🟢 Thêm người dùng
router.get("/users/add", requireAdmin, (req, res) => {
  res.render("admin/user_add", { title: "Thêm người dùng" });
});

router.post("/users/add", requireAdmin, async (req, res) => {
  try {
    const { username, password, fullname, phone, email, role } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);

    await runQuery(
      `INSERT INTO users (username, password, fullname, phone, email, role)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [username, hashedPassword, fullname, phone, email, role]
    );

    res.redirect("/admin/users");
  } catch (err) {
    console.error("❌ Lỗi thêm người dùng:", err);
    res.status(500).send("Lỗi khi thêm người dùng");
  }
});

// ✏️ Sửa người dùng
router.get("/users/edit/:id", requireAdmin, async (req, res) => {
  try {
    const id = req.params.id;
    const [user] = await getQuery("SELECT * FROM users WHERE id = ?", [id]);
    if (!user) return res.status(404).send("Không tìm thấy người dùng");

    res.render("admin/user_edit", { title: "Sửa người dùng", user });
  } catch (err) {
    console.error("❌ Lỗi khi lấy người dùng để sửa:", err);
    res.status(500).send("Lỗi server khi tải người dùng");
  }
});

router.post("/users/edit/:id", requireAdmin, async (req, res) => {
  try {
    const id = req.params.id;
    const { fullname, phone, email, role } = req.body;

    await runQuery(
      `UPDATE users SET fullname=?, phone=?, email=?, role=? WHERE id=?`,
      [fullname, phone, email, role, id]
    );

    res.redirect("/admin/users");
  } catch (err) {
    console.error("❌ Lỗi khi cập nhật người dùng:", err);
    res.status(500).send("Lỗi khi cập nhật người dùng");
  }
});

// 🗑️ Xóa người dùng
router.get("/users/delete/:id", requireAdmin, async (req, res) => {
  try {
    const id = req.params.id;
    await runQuery("DELETE FROM users WHERE id = ?", [id]);
    res.redirect("/admin/users");
  } catch (err) {
    console.error("❌ Lỗi khi xóa người dùng:", err);
    res.status(500).send("Lỗi khi xóa người dùng");
  }
});

// ============================
// 🎮 Quản lý trò chơi
// ============================
router.get("/games", requireAdmin, async (req, res) => {
  try {
    const userSearch = req.query.userSearch || '';
    const gameSearch = req.query.gameSearch || '';

    const [userStats] = await pool.query(`
      SELECT u.id, u.username, s.total_games_played, s.total_score, s.last_login
      FROM user_statistics s
      JOIN users u ON s.user_id = u.id
      WHERE u.username LIKE ?
      ORDER BY s.total_score DESC
    `, [`%${userSearch}%`]);

    const [gameScores] = await pool.query(`
      SELECT g.id, u.username, g.game_type, g.score, g.correct_answers, g.wrong_answers, g.max_combo, g.level, g.created_at
      FROM game_scores g
      JOIN users u ON g.user_id = u.id
      WHERE u.username LIKE ? OR g.game_type LIKE ?
      ORDER BY g.created_at DESC
    `, [`%${gameSearch}%`, `%${gameSearch}%`]);

    res.render("admin/games", {
      title: "Quản lý Trò chơi",
      stats: userStats,
      scores: gameScores,
      userSearch,
      gameSearch
    });
  } catch (err) {
    console.error("❌ Lỗi truy vấn trò chơi:", err);
    res.status(500).send("Lỗi server khi tải dữ liệu trò chơi");
  }
});

module.exports = router;
