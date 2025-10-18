const mysql = require('mysql2/promise');
require('dotenv').config();

// Tạo connection pool
const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'nihongo',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    charset: 'utf8mb4'
});

// Hàm thực thi query không trả về kết quả
async function runQuery(sql, params = []) {
    let connection;
    try {
        connection = await pool.getConnection();
        // Kiểm tra và chuyển undefined thành null
        const safeParams = params.map(param => param === undefined ? null : param);
        
        const [result] = await connection.query(sql, safeParams);
        return result;
    } catch (error) {
        console.error('Lỗi khi thực thi query:', {
            sql,
            params,
            error: error.message,
            code: error.code,
            errno: error.errno,
            sqlState: error.sqlState,
            sqlMessage: error.sqlMessage
        });
        throw error;
    } finally {
        if (connection) {
            connection.release();
        }
    }
}

// Hàm thực thi query trả về kết quả
async function getQuery(sql, params = []) {
    let connection;
    try {
        connection = await pool.getConnection();
        // Kiểm tra và chuyển undefined thành null
        const safeParams = params.map(param => param === undefined ? null : param);
        
        const [rows] = await connection.execute(sql, safeParams);
        return rows;
    } catch (error) {
        console.error('Lỗi khi lấy dữ liệu:', {
            sql,
            params,
            error: error.message,
            code: error.code,
            errno: error.errno,
            sqlState: error.sqlState,
            sqlMessage: error.sqlMessage
        });
        throw error;
    } finally {
        if (connection) {
            connection.release();
        }
    }
}

// Hàm khởi tạo database
async function initDatabase() {
    try {
        // Kiểm tra kết nối
        const connection = await pool.getConnection();
        console.log('Đã kết nối thành công với MariaDB');
        connection.release();

        // Tạo bảng nếu chưa tồn tại
        const schema = require('fs').readFileSync('./database/schema.sql', 'utf8');
        const statements = schema.split(';').filter(stmt => stmt.trim());
        
        for (const stmt of statements) {
            if (stmt.trim()) {
                await runQuery(stmt);
            }
        }
        
        console.log('Đã khởi tạo database thành công');
    } catch (error) {
        console.error('Lỗi khi khởi tạo database:', error);
        throw error;
    }
}
// 🧩 Hàm SELECT
async function getQuery(sql, params = []) {
  const [rows] = await pool.query(sql, params);
  return rows;
}

// 🧩 Hàm INSERT / UPDATE / DELETE
async function executeQuery(sql, params = []) {
  const [result] = await pool.execute(sql, params);
  return result;
}
module.exports = {
  pool,
  runQuery,
  getQuery,
  executeQuery,
  initDatabase
};

; 