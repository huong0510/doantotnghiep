const fs = require('fs');
const path = require('path');
const { promisify } = require('util');
const readFile = promisify(fs.readFile);
const writeFile = promisify(fs.writeFile);
const unlink = promisify(fs.unlink);

const INPUT_DIR = path.join(__dirname, '../database/seed/lessons');
const OUTPUT_DIR = path.join(__dirname, '../database/seed/lessons');

async function convertToSQL(lessonNumber) {
    try {
        const inputPath = path.join(INPUT_DIR, `lesson${lessonNumber}.txt`);
        const outputPath = path.join(OUTPUT_DIR, `lesson${lessonNumber}.sql`);
        
        // Đọc file text
        const content = await readFile(inputPath, 'utf8');
        const lines = content.split('\n');
        
        // Tạo câu lệnh SQL
        let sql = `-- Bài ${lessonNumber}\n`;
        sql += 'INSERT INTO vocabulary (lesson, word, romaji, audio, type, kanji, kanji_reading, meaning) VALUES\n';
        
        const values = lines.map(line => {
            const [word, romaji, audio, type, kanji, kanjiReading, meaning] = line.split('|');
            // Chuyển đổi dấu \ thành / trong đường dẫn audio
            const fixedAudio = audio.replace(/\\/g, '/');
            return `(${lessonNumber}, '${word.replace(/'/g, "''")}', '${romaji.replace(/'/g, "''")}', '${fixedAudio}', '${type || ''}', '${kanji.replace(/'/g, "''")}', '${kanjiReading.replace(/'/g, "''")}', '${meaning.replace(/'/g, "''")}')`;
        });
        
        sql += values.join(',\n') + ';';
        
        // Lưu file SQL
        await writeFile(outputPath, sql, 'utf8');
        console.log(`Đã chuyển đổi bài ${lessonNumber} thành SQL`);

        // Xóa file .txt sau khi chuyển đổi xong
        await unlink(inputPath);
        console.log(`Đã xóa file ${inputPath}`);
    } catch (error) {
        console.error(`Lỗi khi chuyển đổi bài ${lessonNumber}:`, error);
    }
}

async function convertAllLessons() {
    try {
        // Chuyển đổi từ bài 16 đến 50
        for (let i = 16; i <= 50; i++) {
            await convertToSQL(i);
        }
        
        console.log('Đã chuyển đổi xong tất cả các bài!');
    } catch (error) {
        console.error('Lỗi khi chuyển đổi:', error);
    }
}

// Chạy script
convertAllLessons(); 