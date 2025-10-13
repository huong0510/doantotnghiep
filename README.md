# SMV Nihongo - Ứng Dụng Học Tiếng Nhật Thông Minh 🎌

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)
![Node.js](https://img.shields.io/badge/Node.js-14.x-brightgreen.svg)

SMV Nihongo là một ứng dụng web hiện đại giúp người học tiếng Nhật tiếp cận ngôn ngữ này một cách thú vị và hiệu quả, dựa trên giáo trình Minna no Nihongo nổi tiếng.

## 🌟 Tính Năng Nổi Bật

### 📚 Học Tập Tương Tác

- **Học Bảng Chữ Cái**: Hệ thống học Hiragana và Katakana với hình ảnh minh họa và phát âm
- **Game Học Chữ**: Các trò chơi tương tác giúp ghi nhớ bảng chữ cái
- **Game Từ Vựng**: Học từ vựng qua các mini-game thú vị
- **Quản Lý Từ Vựng**: Tổ chức từ vựng theo bài học, dễ dàng ôn tập

### 🏆 Hệ Thống Khen Thưởng

- **Bảng Xếp Hạng**: Theo dõi tiến độ và so sánh với người học khác
- **Thống Kê Chi Tiết**: Phân tích quá trình học tập
- **Báo Cáo Tiến Độ**: Theo dõi sự tiến bộ qua thời gian

## 🚀 Bắt Đầu

### Yêu Cầu Hệ Thống

- Node.js 14.x trở lên
- SQLite3
- Trình duyệt web hiện đại

### Cài Đặt

1. Clone repository:

```bash
git clone https://github.com/vigstudio/smv-nihongo.git
cd smv-nihongo
```

2. Cài đặt dependencies:

```bash
npm install
```

3. Khởi tạo database:

```bash
node database/init.js
```

4. Chạy ứng dụng:

```bash
npm start
```

Truy cập ứng dụng tại: http://localhost:9113

## 📁 Cấu Trúc Dự Án

```
smv-nihongo/
├── app.js              # Điểm khởi đầu ứng dụng
├── database/          # Database và migrations
│   ├── migrations/    # Database migrations
│   └── init.js       # Khởi tạo database
├── public/           # Static files
│   ├── css/         # Stylesheets
│   ├── js/          # Client-side scripts
│   └── images/      # Hình ảnh
├── routes/           # Route handlers
├── views/            # EJS templates
└── assets/           # Tài nguyên ứng dụng
```

## 🤝 Đóng Góp

Chúng tôi rất hoan nghênh mọi đóng góp! Bạn có thể:

1. Fork dự án
2. Tạo branch mới (`git checkout -b feature/AmazingFeature`)
3. Commit thay đổi (`git commit -m 'Add some AmazingFeature'`)
4. Push lên branch (`git push origin feature/AmazingFeature`)
5. Tạo Pull Request

## 📝 License

Dự án này được phát hành dưới giấy phép MIT. Xem file `LICENSE` để biết thêm chi tiết.

## 📞 Liên Hệ

- GitHub: [@vigstudio](https://github.com/vigstudio)

## 🙏 Lời Cảm Ơn

Cảm ơn tất cả những người đã đóng góp cho dự án này. Đặc biệt là:

- Cộng đồng Minna no Nihongo
- Tất cả các contributors
- Người dùng đã góp ý và phản hồi

---

⭐️ Nếu bạn thấy dự án này hữu ích, hãy cho chúng tôi một sao trên GitHub!
