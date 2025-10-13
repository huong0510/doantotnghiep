-- Thêm các trường profile cho bảng users
ALTER TABLE users
ADD COLUMN avatar VARCHAR(255) DEFAULT NULL,
ADD COLUMN full_name VARCHAR(100) DEFAULT NULL,
ADD COLUMN bio TEXT DEFAULT NULL,
ADD COLUMN date_of_birth DATE DEFAULT NULL,
ADD COLUMN address TEXT DEFAULT NULL,
ADD COLUMN last_password_change TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- Tạo bảng user_game_history để lưu lịch sử chơi game
CREATE TABLE IF NOT EXISTS user_game_history (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    game_type VARCHAR(50) NOT NULL,
    score INT NOT NULL,
    level INT NOT NULL,
    played_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Tạo bảng user_achievements để lưu thành tích của user
CREATE TABLE IF NOT EXISTS user_achievements (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    achievement_type VARCHAR(50) NOT NULL,
    achievement_name VARCHAR(100) NOT NULL,
    description TEXT,
    earned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
); 