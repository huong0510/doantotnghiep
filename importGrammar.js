const fs = require("fs");
const path = require("path");
const { getQuery, runQuery } = require("./database/db");

(async () => {
  try {
    const filePath = path.join(__dirname, "data", "grammar.json");// đường dẫn 

    if (!fs.existsSync(filePath)) {
      console.error("❌ Không tìm thấy file grammar.json trong thư mục gốc!");
      process.exit(1);
    }

    const rawData = fs.readFileSync(filePath, "utf8");
    const data = JSON.parse(rawData);

    // Chuẩn bị bảng
    await runQuery(`
      CREATE TABLE IF NOT EXISTS grammar (
        id INT AUTO_INCREMENT PRIMARY KEY,
        level VARCHAR(5) NOT NULL,
        structure VARCHAR(255) NOT NULL,
        meaning VARCHAR(255) NOT NULL,
        example TEXT,
        translation TEXT
      ) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
    `);

    // Import dữ liệu
    for (const level of Object.keys(data)) {
      const grammars = data[level];
      console.log(`🟡 Importing ${grammars.length} records for level ${level}...`);

      for (const item of grammars) {
        await runQuery(
          `INSERT INTO grammar (level, structure, meaning, example, translation)
           VALUES (?, ?, ?, ?, ?)`,
          [
            level.trim().toUpperCase(),
            item.structure || "",
            item.meaning || "",
            item.example || "",
            item.translation || "",
          ]
        );
      }

      console.log(`✅ Hoàn tất ${grammars.length} mẫu ngữ pháp ${level}`);
    }

    console.log("🎉 Tất cả dữ liệu đã được import thành công!");
    process.exit(0);
  } catch (err) {
    console.error("❌ Lỗi khi import dữ liệu:", err);
    process.exit(1);
  }
})();
