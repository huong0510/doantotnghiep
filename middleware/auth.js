// Middleware kiểm tra đăng nhập
exports.requireAuth = (req, res, next) => {
    if (!req.session.user) {
        return res.redirect('/auth/login');
    }
    next();
};

// Middleware kiểm tra admin
exports.requireAdmin = (req, res, next) => {
    if (!req.session.user || req.session.user.role !== 'admin') {
        return res.status(403).json({ error: 'Không có quyền truy cập' });
    }
    next();
}; 
exports.requireAuth = (req, res, next) => {
    if (!req.session || !req.session.user) {
        return res.redirect('/auth/login'); // chưa login thì đưa về login
    }
    next();
};

