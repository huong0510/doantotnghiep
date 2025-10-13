-- Tạo database
CREATE DATABASE IF NOT EXISTS nihongo CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE nihongo;

-- Bảng users
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    fullname VARCHAR(100) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    email VARCHAR(100) UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Bảng vocabulary
CREATE TABLE IF NOT EXISTS vocabulary (
    id INT AUTO_INCREMENT PRIMARY KEY,
    lesson INT DEFAULT NULL,
    word VARCHAR(255) NOT NULL,
    romaji VARCHAR(255),
    audio VARCHAR(255),
    type VARCHAR(50) DEFAULT NULL,
    kanji VARCHAR(255),
    kanji_reading VARCHAR(255),
    meaning TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_vocabulary_lesson (lesson)
) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Bảng grammar
CREATE TABLE IF NOT EXISTS grammar (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    example TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Bảng game_scores
CREATE TABLE IF NOT EXISTS game_scores (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    game_type VARCHAR(50) NOT NULL,
    score INT NOT NULL,
    correct_answers INT NOT NULL,
    wrong_answers INT NOT NULL,
    max_combo INT NOT NULL,
    level INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- Bảng User Statistics
CREATE TABLE IF NOT EXISTS user_statistics (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    last_login DATETIME,
    total_games_played INT DEFAULT 0,
    total_score INT DEFAULT 0,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Bảng Access Logs
CREATE TABLE IF NOT EXISTS access_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    ip_address VARCHAR(45),
    accessed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    page_accessed VARCHAR(255),
    FOREIGN KEY (user_id) REFERENCES users(id)
); 