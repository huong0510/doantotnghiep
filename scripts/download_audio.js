const fs = require('fs');
const path = require('path');
const https = require('https');
const { promisify } = require('util');
const { getQuery } = require('../database/db');
const mkdir = promisify(fs.mkdir);
const writeFile = promisify(fs.writeFile);
const access = promisify(fs.access);

const BASE_URL = 'https://jls.vnjpclub.com/audio/minna';
const AUDIO_DIR = path.join(__dirname, '../public/audio/minna');
const REPORTS_DIR = path.join(__dirname, '../reports');
const REPORT_FILE = path.join(REPORTS_DIR, 'missing_audio.txt');

async function fileExists(filePath) {
    try {
        await access(filePath, fs.constants.F_OK);
        return true;
    } catch {
        return false;
    }
}

async function downloadFile(url, filePath) {
    // Kiểm tra file đã tồn tại
    if (await fileExists(filePath)) {
        console.log(`File đã tồn tại, bỏ qua: ${filePath}`);
        return { success: true, filePath };
    }

    return new Promise((resolve, reject) => {
        https.get(url, (response) => {
            if (response.statusCode === 200) {
                const fileStream = fs.createWriteStream(filePath);
                response.pipe(fileStream);
                fileStream.on('finish', () => {
                    fileStream.close();
                    console.log(`Đã tải: ${filePath}`);
                    resolve({ success: true, filePath });
                });
            } else {
                console.log(`Bỏ qua file không tồn tại: ${url}`);
                resolve({ success: false, filePath, url, statusCode: response.statusCode });
            }
        }).on('error', (err) => {
            console.log(`Bỏ qua file không tồn tại: ${url}`);
            resolve({ success: false, filePath, url, error: err.message });
        });
    });
}

async function downloadLessonAudio(lessonNumber) {
    try {
        // Lấy danh sách audio từ database
        const audioFiles = await getQuery(
            'SELECT DISTINCT audio FROM vocabulary WHERE lesson = ? AND audio IS NOT NULL AND audio != ""',
            [lessonNumber]
        );

        if (audioFiles.length === 0) {
            console.log(`Không có file audio cho bài ${lessonNumber}`);
            return [];
        }

        const lessonDir = path.join(AUDIO_DIR, `bai${String(lessonNumber).padStart(2, '0')}`);
        await mkdir(lessonDir, { recursive: true });
        
        const results = [];
        for (const file of audioFiles) {
            if (!file.audio) continue; // Bỏ qua nếu audio trống
            
            const fileName = path.basename(file.audio);
            if (!fileName) continue; // Bỏ qua nếu không có tên file
            
            const url = `${BASE_URL}/bai${String(lessonNumber).padStart(2, '0')}/${fileName}`;
            const filePath = path.join(lessonDir, fileName);
            const result = await downloadFile(url, filePath);
            results.push(result);
        }
        return results;
    } catch (error) {
        console.error(`Lỗi khi tải audio bài ${lessonNumber}:`, error);
        return [];
    }
}

async function generateReport(failedFiles) {
    try {
        // Tạo thư mục reports nếu chưa tồn tại
        await mkdir(REPORTS_DIR, { recursive: true });

        const report = ['=== BÁO CÁO CÁC FILE AUDIO LỖI HOẶC KHÔNG TỒN TẠI ===\n'];
        
        // Nhóm theo bài học
        const byLesson = {};
        failedFiles.forEach(file => {
            const lesson = file.filePath.match(/bai(\d+)/)[1];
            if (!byLesson[lesson]) {
                byLesson[lesson] = [];
            }
            byLesson[lesson].push(file);
        });

        // Tạo báo cáo theo từng bài
        Object.keys(byLesson).sort((a, b) => a - b).forEach(lesson => {
            report.push(`\nBài ${lesson}:`);
            byLesson[lesson].forEach(file => {
                report.push(`- ${path.basename(file.filePath)}`);
                if (file.statusCode) {
                    report.push(`  + Mã lỗi: ${file.statusCode}`);
                }
                if (file.error) {
                    report.push(`  + Lỗi: ${file.error}`);
                }
                report.push(`  + URL: ${file.url}`);
            });
        });

        // Thống kê
        report.push('\n=== THỐNG KÊ ===');
        report.push(`Tổng số file lỗi: ${failedFiles.length}`);
        Object.keys(byLesson).forEach(lesson => {
            report.push(`Bài ${lesson}: ${byLesson[lesson].length} file`);
        });

        // Lưu báo cáo
        await writeFile(REPORT_FILE, report.join('\n'), 'utf8');
        console.log(`Đã tạo báo cáo tại: ${REPORT_FILE}`);
    } catch (error) {
        console.error('Lỗi khi tạo báo cáo:', error);
    }
}

async function downloadAllAudio() {
    try {
        console.log('Bắt đầu tải file audio...');
        
        // Lấy số bài học từ database
        const lessons = await getQuery('SELECT DISTINCT lesson FROM vocabulary ORDER BY lesson');
        
        // Tải audio cho từng bài
        const allResults = [];
        for (const lesson of lessons) {
            console.log(`Đang tải audio bài ${lesson.lesson}...`);
            const results = await downloadLessonAudio(lesson.lesson);
            allResults.push(...results);
        }

        // Lọc các file lỗi
        const failedFiles = allResults.filter(result => !result.success);
        
        // Tạo báo cáo
        if (failedFiles.length > 0) {
            await generateReport(failedFiles);
        }

        console.log('Đã tải xong tất cả file audio!');
    } catch (error) {
        console.error('Lỗi khi tải file audio:', error);
    }
}

// Chạy script
downloadAllAudio(); 