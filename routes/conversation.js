const express = require("express");
const router = express.Router();
const { requireAuth } = require("../middleware/auth");
const OpenAI = require("openai");

// Khởi tạo OpenAI client
const openai = process.env.OPENAI_API_KEY
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;

// Các scenario
const SCENARIOS = {
  greeting: {
    title: 'Chào hỏi',
    instruction: 'Bạn là người Nhật thân thiện. Trò chơi: người dùng luyện câu chào. Trả lời ngắn gọn bằng tiếng Nhật (kèm romaji nếu phù hợp), rồi dưới dòng tiếp theo dịch sang tiếng Việt, rồi 1-2 gợi ý sửa lỗi (nếu có). Giữ tông thân thiện, khuyến khích người dùng nói tiếp.'
  },
  buying: {
    title: 'Mua sắm',
    instruction: 'Bạn là nhân viên cửa hàng Nhật. Giả lập tình huống mua sắm: hỏi cần gì, trả lời văn phong lịch sự. Trả lời bằng tiếng Nhật, kèm dịch sang tiếng Việt và 1-2 câu mẫu thay thế.'
  },
  directions: {
    title: 'Hỏi đường',
    instruction: 'Bạn là người bản xứ chỉ đường. Phản hồi cụ thể, dùng chỉ dẫn ngắn gọn. Trả lời bằng tiếng Nhật, có dịch tiếng Việt và bản romaji nếu cần.'
  },
  restaurant: {
    title: 'Đi ăn nhà hàng',
    instruction: 'Bạn là nhân viên nhà hàng. Hỏi khách muốn gọi món gì, gợi ý vài món ăn phổ biến. Trả lời bằng tiếng Nhật lịch sự, kèm dịch tiếng Việt và gợi ý câu khách có thể nói.'
  },
  school: {
    title: 'Ở trường học',
    instruction: 'Bạn là bạn cùng lớp người Nhật. Trò chuyện về lớp học, bài tập, giờ nghỉ. Trả lời thân thiện bằng tiếng Nhật, kèm dịch và câu hỏi để tiếp tục câu chuyện.'
  },
  travel: {
    title: 'Du lịch',
    instruction: 'Bạn là hướng dẫn viên du lịch ở Nhật. Gợi ý các điểm đến, trả lời ngắn gọn bằng tiếng Nhật, kèm dịch tiếng Việt và câu hỏi để khách kể về trải nghiệm.'
  }
};

// GET /scenarios → trả về danh sách scenario cho frontend
router.get('/scenarios', (req, res) => {
  const scenarios = Object.entries(SCENARIOS).map(([key, val]) => ({
    key,
    title: val.title
  }));
  res.json({ success: true, scenarios });
});

// Helper: build prompt từ history
function buildPrompt(scenarioKey, history) {
  const sc = SCENARIOS[scenarioKey] || SCENARIOS['greeting'];
  const system = `${sc.instruction}\n\nHãy đóng vai theo tình huống trên. Luôn trả lời bằng tiếng Nhật (kèm romaji nếu hợp lý), rồi dưới phần trả lời chính hãy thêm một dòng dịch sang tiếng Việt và một dòng "Gợi ý/Chỉnh sửa" ngắn.`;
  const convo = history.map(item => {
    const who = item.role === 'user' ? 'User' : 'Partner';
    return `${who}: ${item.text}`;
  }).join('\n');
  return `${system}\n\nConversation so far:\n${convo}\nPartner:`;
}

// POST / → nhận message và trả phản hồi AI
router.post("/", requireAuth, async (req, res) => {
  try {
    const { scenario = "greeting", message } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({ success: false, error: "Prompt không được để trống." });
    }

    // kiểm tra OpenAI
    if (!openai) {
      return res.status(500).json({ success: false, error: "AI chưa được cấu hình." });
    }

    // session history
    if (!req.session.conversationPractice) req.session.conversationPractice = [];
    req.session.conversationPractice.push({ role: "user", text: message, ts: Date.now() });

    const history = req.session.conversationPractice.slice(-8);
    const convoText = history.map(h => `${h.role === "user" ? "User" : "AI"}: ${h.text}`).join("\n");
    const prompt = `${SCENARIOS[scenario]?.instruction || SCENARIOS.greeting.instruction}\n\nConversation so far:\n${convoText}\nAI:`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }]
    });

    const reply = completion.choices[0].message.content;

    req.session.conversationPractice.push({ role: "assistant", text: reply, ts: Date.now() });
    req.session.conversationPractice = req.session.conversationPractice.slice(-20);

    res.json({ success: true, reply });
  } catch (err) {
    console.error("🔥 Lỗi gọi OpenAI:", err);
    res.status(500).json({ success: false, error: "AI hiện không khả dụng.", details: err.message });
  }
});


// POST /clear → xóa history session
router.post('/clear', requireAuth, (req, res) => {
  req.session.conversationPractice = [];
  res.json({ success: true });
});

module.exports = router;
