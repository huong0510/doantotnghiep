const fs = require('fs');
const path = require('path');
const https = require('https');
const cheerio = require('cheerio');
const { promisify } = require('util');
const mkdir = promisify(fs.mkdir);
const writeFile = promisify(fs.writeFile);

const BASE_URL = 'https://jls.vnjpclub.com/tu-vung-minna-no-nihongo-bai-';
const OUTPUT_DIR = path.join(__dirname, '../database/seed/lessons');

async function fetchPage(url) {
    return new Promise((resolve, reject) => {
        https.get(url, (response) => {
            let data = '';
            response.on('data', (chunk) => {
                data += chunk;
            });
            response.on('end', () => {
                resolve(data);
            });
        }).on('error', (err) => {
            reject(err);
        });
    });
}

async function extractTableData(html) {
    const $ = cheerio.load(html);
    const rows = [];
    
    $('.search_result tbody tr').each((i, row) => {
        const cells = $(row).find('td');
        if (cells.length >= 7) {
            const word = $(cells[0]).text().trim();
            const romaji = $(cells[1]).text().trim();
            const audio = $(cells[2]).find('a').attr('href') || '';
            const type = $(cells[3]).text().trim();
            const kanji = $(cells[4]).text().trim();
            const kanjiReading = $(cells[5]).text().trim();
            const meaning = $(cells[6]).text().trim();
            
            rows.push({
                word,
                romaji,
                audio,
                type,
                kanji,
                kanjiReading,
                meaning
            });
        }
    });
    
    return rows;
}

async function saveToTextFile(lessonNumber, data) {
    const filePath = path.join(OUTPUT_DIR, `lesson${lessonNumber}.txt`);
    const content = data.map(item => 
        `${item.word}|${item.romaji}|${item.audio}|${item.type}|${item.kanji}|${item.kanjiReading}|${item.meaning}`
    ).join('\n');
    
    await writeFile(filePath, content, 'utf8');
    console.log(`Đã lưu bài ${lessonNumber} vào ${filePath}`);
}

async function crawlLesson(lessonNumber) {
    try {
        console.log(`Đang crawl bài ${lessonNumber}...`);
        const url = `${BASE_URL}${lessonNumber}.html`;
        const html = await fetchPage(url);
        const data = await extractTableData(html);
        await saveToTextFile(lessonNumber, data);
    } catch (error) {
        console.error(`Lỗi khi crawl bài ${lessonNumber}:`, error);
    }
}

async function crawlAllLessons() {
    try {
        // Tạo thư mục output nếu chưa tồn tại
        await mkdir(OUTPUT_DIR, { recursive: true });
        
        // Crawl từ bài 16 đến 50
        for (let i = 16; i <= 50; i++) {
            await crawlLesson(i);
            // Đợi 1 giây để tránh quá tải server
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
        
        console.log('Đã crawl xong tất cả các bài!');
    } catch (error) {
        console.error('Lỗi khi crawl:', error);
    }
}

// Chạy script
crawlAllLessons(); 