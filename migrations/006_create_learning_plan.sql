CREATE TABLE learning_plan_history (
  id INT AUTO_INCREMENT PRIMARY KEY,
  student_name VARCHAR(255),
  level VARCHAR(50),
  goals TEXT,
  weak_points TEXT,
  available_time VARCHAR(50),
  plan LONGTEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);


