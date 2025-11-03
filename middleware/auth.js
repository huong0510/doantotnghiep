// middleware/auth.js

// 🧩 Cho phép user hoặc admin đều được truy cập
exports.requireAuth = (req, res, next) => {
  if (!req.session.user && !req.session.admin) {
    console.log("🚫 Không có session hợp lệ, chuyển hướng về login");
    return res.redirect("/auth/login"); // hoặc "/admin/login" tùy loại tài khoản
  }
  next();
};

// 👤 Chỉ cho phép user (học viên)
exports.requireUser = (req, res, next) => {
  if (!req.session.user) {
    return res.redirect("/auth/login");
  }
  next();
};

// 🧑‍💼 Chỉ cho phép admin
exports.requireAdmin = (req, res, next) => {
  if (!req.session.admin) {
    return res.redirect("/admin/login");
  }
  next();
};


