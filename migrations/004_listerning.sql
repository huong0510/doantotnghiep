CREATE TABLE listening_exercise (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  audio_url VARCHAR(255) NOT NULL, -- link mp3, có thể để trong /public/audio/
  answer TEXT NOT NULL
);

-- Ví dụ thêm dữ liệu
INSERT INTO listening_exercise (title, audio_url, answer)
VALUES 
('Nghe câu chào hỏi', '/audio/hello.mp3', 'こんにちは'),
('Nghe giới thiệu bản thân', '/audio/self_intro.mp3', 'わたしは学生です');
