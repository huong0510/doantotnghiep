require('dotenv').config();

console.log("🔧 Đã load file .env");
console.log("📌 DB_HOST =", process.env.DB_HOST);
console.log("📌 OPENAI_API_KEY =", process.env.OPENAI_API_KEY ? process.env.OPENAI_API_KEY.slice(0, 8) + "..." : "❌ CHƯA CÓ");

const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
const path = require('path');
const expressLayouts = require('express-ejs-layouts');
const { initDatabase } = require('./database/db');
const { requireAuth } = require('./middleware/auth');
const OpenAI = require("openai");

// --- Import routes ---
const listeningRoutes = require('./routes/listening');
const practiceRoutes = require('./routes/practice');
const conversationRoutes = require('./routes/conversation');
const authRoutes = require('./routes/auth');
const alphabetsRoutes = require('./routes/alphabets');
const gamesRoutes = require('./routes/games');
const leaderboardRoutes = require('./routes/leaderboard');
const vocabularyRoutes = require('./routes/vocabulary');
const gameVocabularyRoutes = require('./routes/gameVocabulary');
const grammarRoutes = require("./routes/grammar");
const apiRoutes = require("./routes/api");
const learningPlanRoutes = require('./routes/learningplan');
const viewPlanRoute = require("./routes/viewPlan");
const evaluateRoutes = require("./routes/evaluate");

const app = express();

// --- Middleware cơ bản ---
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));



// --- Session: phải đặt TRƯỚC khi dùng req.session ---
app.use(session({
  secret: 'smv-nihongo-secret',
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false } // chạy localhost thì false
}));

// --- View engine ---
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(expressLayouts);
app.set('layout', 'layout');
app.set('layout extractScripts', true);
app.set('layout extractStyles', true);


// --- Log request ---
app.use((req, res, next) => {
  console.log(`📥 [${req.method}] ${req.url}`);
  next();
});

// --- Routes (đặt sau khi đã có session) ---
app.use("/", authRoutes);  
app.use("/listening", listeningRoutes);
app.use("/practice", practiceRoutes);
app.use("/conversation", conversationRoutes);
app.use("/alphabets", alphabetsRoutes);
app.use("/games", gamesRoutes);
app.use("/leaderboard", leaderboardRoutes);
app.use("/vocabulary", vocabularyRoutes);
app.use("/game-vocabulary", gameVocabularyRoutes);
app.use("/grammar", grammarRoutes);
app.use("/api", apiRoutes);
app.use("/learning-plan", requireAuth, learningPlanRoutes);
app.use("/view-plan", viewPlanRoute);
app.use("/api", evaluateRoutes);




// --- Khởi tạo OpenAI ---
const openai = process.env.OPENAI_API_KEY ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY }) : null;

async function callOpenAI(prompt) {
  if (!openai) throw new Error("Chưa cấu hình OPENAI_API_KEY");
  console.log(`🤖 Gọi OpenAI với prompt:`, prompt);

  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [{ role: "user", content: prompt }],
  });

  return completion.choices[0].message.content;
}
async function getGrammars(level) {
  const grammars = await getQuery("SELECT * FROM grammar WHERE level = ?", [level]);
  return grammars;
}
// --- API gọi AI ---
app.post("/api/chat-ai", async (req, res) => {
  try {
    console.log("📩 Body nhận được từ client:", req.body);
    const userMessage = req.body.message || req.body.question;
    if (!userMessage) {
      return res.status(400).json({ error: "Thiếu message trong body" });
    }

    const answer = await callOpenAI(userMessage);
    console.log("✅ [API] Phản hồi từ OpenAI:", answer);
    res.json({ reply: answer });
  } catch (err) {
    console.error("❌ Lỗi khi gọi OpenAI:", err);
    res.status(500).json({
      error: "OpenAI API đang bận hoặc key không hợp lệ",
      details: err.message
    });
  }
});

// --- Routes ---
app.use('/auth', authRoutes);
app.use('/listening', requireAuth, listeningRoutes);
app.use('/practice', practiceRoutes);
app.use('/api/conversation', conversationRoutes);
app.use('/alphabets', requireAuth, alphabetsRoutes);
app.use('/games', requireAuth, gamesRoutes);
app.use('/leaderboard', requireAuth, leaderboardRoutes);
app.use('/vocabulary', requireAuth, vocabularyRoutes);
app.use('/api/game/vocabulary', gameVocabularyRoutes);

// Trang chủ
app.get('/', requireAuth, (req, res) => {
  res.render('index', { title: 'Trang chủ', user: req.session.user });
});

// Daily plan (không bắt buộc login nếu bạn muốn)
app.get('/dailyplan', (req, res) => {
  res.render('dailyplan');
});

// --- Error handler ---
app.use((req, res) => {
  res.status(404).render('error', {
    title: 'Không tìm thấy trang',
    message: 'Trang bạn đang tìm kiếm không tồn tại.',
    user: req.session ? req.session.user : null
  });
});

app.use((err, req, res, next) => {
  console.error("💥 Lỗi server:", err.stack);
  res.status(500).render('error', {
    title: 'Lỗi server',
    message: 'Đã xảy ra lỗi, vui lòng thử lại sau.',
    user: req.session ? req.session.user : null
  });
});

// --- Start server ---
const PORT = process.env.PORT || 9113;
app.listen(PORT, '0.0.0.0', async () => {
  try {
    await initDatabase();
    console.log(`🚀 Server đang chạy tại http://localhost:${PORT}`);
  } catch (error) {
    console.error('❌ Lỗi khi khởi động server:', error);
  }
});
