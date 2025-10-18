/**
 * 🧠 generateExercises.js
 * Sinh bài luyện tập ngữ pháp Nhật bằng Gemini AI
 */

require("dotenv").config();
const { GoogleGenerativeAI } = require("@google/generative-ai");
const { getQuery, executeQuery } = require("./database/db");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// 🧩 Hàm sinh bài luyện tập
async function generateExercises(structure, meaning) {
  const prompt = `
Tạo 3 câu trắc nghiệm luyện tập cho mẫu ngữ pháp "${structure}" (nghĩa: ${meaning}).
Mỗi câu gồm:
- "question": câu tiếng Nhật có chỗ trống cần điền đúng mẫu.
- 3 lựa chọn a, b, c.
- "correct_answer": chỉ rõ là "A", "B", hoặc "C".
Trả kết quả JSON dạng mảng như ví dụ:
[
  {"question":"___は日本人です。","option_a":"これ","option_b":"それ","option_c":"あれ","correct_answer":"A"},
  {"question":"___は学生です。","option_a":"私","option_b":"あなた","option_c":"彼","correct_answer":"A"}
]
`;

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
    const result = await model.generateContent(prompt);
    const text = result.response.text();
    const clean = text.replace(/```json|```/g, "").trim();
    return JSON.parse(clean);
  } catch (err) {
    console.error(`❌ Lỗi sinh bài cho "${structure}":`, err.message);
    return [];
  }
}

// 🕐 Hàm chờ
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

// 🚀 Hàm chính
async function main() {
  console.log("🚀 Đang lấy danh sách ngữ pháp...");

  // 🔹 Lấy danh sách ngữ pháp chưa có bài luyện tập
  const grammars = await getQuery(`
    SELECT g.* FROM grammar g
    LEFT JOIN grammar_exercises e ON g.id = e.grammar_id
    WHERE e.id IS NULL
    LIMIT 20
  `);

  if (grammars.length === 0) {
    console.log("✅ Tất cả ngữ pháp đã có bài luyện tập!");
    return;
  }

  for (const g of grammars) {
    console.log(`\n📘 Sinh bài luyện tập cho: ${g.structure}`);

    let success = false;
    for (let attempt = 1; attempt <= 3 && !success; attempt++) {
      try {
        const exercises = await generateExercises(g.structure, g.meaning);

        if (exercises.length > 0) {
          for (const ex of exercises) {
            await executeQuery(
              `INSERT INTO grammar_exercises 
                (grammar_id, question, option_a, option_b, option_c, correct_answer)
               VALUES (?, ?, ?, ?, ?, ?)`,
              [g.id, ex.question, ex.option_a, ex.option_b, ex.option_c, ex.correct_answer]
            );
          }
          console.log(`✅ Đã thêm ${exercises.length} bài cho "${g.structure}"`);
          success = true;
        } else {
          console.log(`⚠️ Không sinh được bài cho "${g.structure}"`);
        }
      } catch (err) {
        if (err.message.includes("429") || err.message.includes("Quota")) {
          console.log("⏳ Quota bị vượt. Đang chờ 30 giây rồi thử lại...");
          await wait(30000);
        } else {
          console.error(`❌ Lỗi tạo bài cho "${g.structure}":`, err.message);
          success = true; // bỏ qua lỗi khác
        }
      }
    }

    // 💤 Nghỉ 5 giây giữa mỗi mẫu
    await wait(5000);
  }

  console.log("\n🎉 Hoàn tất sinh bài luyện tập!");
}

main();
