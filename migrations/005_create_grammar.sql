DROP TABLE IF EXISTS grammar;

CREATE TABLE grammar (
  id INT AUTO_INCREMENT PRIMARY KEY,
  level VARCHAR(5) NOT NULL,
  structure VARCHAR(255) NOT NULL,
  meaning VARCHAR(255) NOT NULL,
  example TEXT,
  translation TEXT
) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;



