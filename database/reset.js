const mysql = require('mysql2/promise');
const { runQuery } = require('./db');

async function resetDatabase() {
    let connection;
    try {
        // Kết nối đến MySQL
        connection = await mysql.createConnection({
            host: 'localhost',
            user: 'root',
            password: '',
            multipleStatements: true
        });

        console.log('--- Xóa database cũ ---');
        await connection.query('DROP DATABASE IF EXISTS nihongo');
        console.log('Đã xóa database cũ');

        console.log('--- Tạo database mới ---');
        await connection.query('CREATE DATABASE nihongo');
        console.log('Đã tạo database mới');

        console.log('--- Chọn database ---');
        await connection.query('USE nihongo');
        console.log('Đã chọn database nihongo');

        console.log('--- Xóa bảng migrations_log ---');
        await connection.query('DROP TABLE IF EXISTS migrations_log');
        console.log('Đã xóa bảng migrations_log');

        console.log('--- Hoàn thành reset database! ---');
    } catch (error) {
        console.error('Lỗi khi reset database:', error);
        throw error;
    } finally {
        if (connection) {
            await connection.end();
        }
    }
}

// Chạy reset database
resetDatabase().catch(console.error); 