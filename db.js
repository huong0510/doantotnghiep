// db.js
const mysql = require('mysql2/promise');

// Tạo pool kết nối MySQL
const pool = mysql.createPool({
  host: 'localhost',   // Đổi nếu khác
  user: 'root',        // User MySQL của bạn
  password: '',        // Password MySQL
  database: 'ten_db',  // Đặt tên DB thật
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

module.exports = pool;
