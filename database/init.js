const fs = require('fs');
const path = require('path');
const { db } = require('./db');

// Đọc file schema.sql
const schema = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');

// Thực thi các câu lệnh SQL
db.serialize(() => {
    db.exec(schema, (err) => {
        if (err) {
            console.error('Lỗi khởi tạo database:', err);
        } else {
            console.log('Đã khởi tạo database thành công');
        }
    });
}); 