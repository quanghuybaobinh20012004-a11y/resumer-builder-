const express = require('express');
const router = express.Router();
const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));
const authMiddleware = require('../middleware/auth.middleware');

const GEMINI_MODEL = "gemini-2.5-flash";

// Hàm gọi API Google Gemini
async function callGeminiDirect(prompt) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("Thiếu API Key cho Gemini");

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`;

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Google API Error: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text || 'Không có kết quả.';
}

// Hàm Retry nếu mạng lỗi
async function callGeminiWithRetry(prompt, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      return await callGeminiDirect(prompt);
    } catch (error) {
      if (error.message.includes('503') && i < retries - 1) {
        console.warn(`Gemini API: Lỗi 503, thử lại lần ${i + 1}...`);
        await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1))); 
      } else {
        throw error;
      }
    }
  }
}

// API 1: Tạo nội dung (Generate)
router.post('/generate', authMiddleware, async (req, res) => {
  try {
    const { prompt } = req.body;
    // Ưu tiên dùng Gemini Key, fallback sang OpenAI nếu có (logic cũ của bạn)
    const apiKey = process.env.GEMINI_API_KEY || process.env.OPENAI_API_KEY;
    
    if (!apiKey) {
      return res.status(500).json({ message: 'Thiếu API Key.' });
    }

    let aiText = '';
    
    // Chỉ tập trung vào Gemini vì bạn đang cấu hình Gemini
    if (process.env.GEMINI_API_KEY) {
      aiText = await callGeminiWithRetry(prompt);
    } else {
       // (Giữ lại logic OpenAI nếu bạn muốn dùng song song)
       // ...
       return res.status(500).json({ message: 'Chưa cấu hình OpenAI fallback.' });
    }

    res.json({ result: aiText.trim() });

  } catch (err) {
    console.error("AI Error:", err.message);
    res.status(500).json({ message: 'Lỗi server khi xử lý AI', error: err.message });
  }
});

// API 2: Sửa lỗi chính tả (Proofread)
router.post('/proofread', authMiddleware, async (req, res) => {
  try {
    const { text } = req.body;
    if (!text || text.trim().length < 10) {
      return res.status(400).json({ message: 'Cần ít nhất 10 ký tự để rà soát.' });
    }

    const prompt = `Bạn là biên tập viên CV. Hãy sửa lỗi chính tả, ngữ pháp đoạn sau. Giữ nguyên ý nghĩa. Chỉ trả về text đã sửa:\n"${text}"`;
    const correctedText = await callGeminiWithRetry(prompt);

    res.json({ correctedText: correctedText.trim() });

  } catch (err) {
    console.error("AI Proofread Error:", err.message);
    res.status(500).json({ message: 'Lỗi server khi rà soát AI', error: err.message });
  }
});

// API 3: Chấm điểm CV (Score) - ĐÃ SỬA LOGIC
router.post('/score', authMiddleware, async (req, res) => {
  try {
    const { cvData } = req.body;

    if (!cvData) {
      return res.status(400).json({ message: "Không tìm thấy dữ liệu CV." });
    }

    // --- BƯỚC 1: KIỂM TRA ĐỘ DÀI NỘI DUNG (FIX LỖI 100 ĐIỂM KHI RỖNG) ---
    // Cộng gộp tất cả text trong CV lại để xem dài bao nhiêu
    const totalContent = [
        cvData.personalInfo?.summary || '',
        ...(cvData.experience || []).map(e => e.description || ''),
        ...(cvData.skills || []).map(s => (typeof s === 'string' ? s : s.value) || ''),
        ...(cvData.projects || []).map(p => p.description || '')
    ].join(' ');

    // Nếu nội dung quá ngắn (dưới 50 ký tự), trả về điểm thấp luôn
    if (totalContent.length < 50) {
        return res.json({ 
            score: 10, 
            message: "CV của bạn quá sơ sài. Hãy thêm Mục tiêu, Kinh nghiệm và Kỹ năng để AI có thể chấm điểm chính xác." 
        });
    }

    // --- BƯỚC 2: CHUẨN BỊ DỮ LIỆU GỬI AI ---
    const cvContentSummary = JSON.stringify({
      position: cvData.personalInfo?.position || "Chưa rõ vị trí",
      summary: cvData.personalInfo?.summary,
      experience: cvData.experience?.map(e => `${e.position} tại ${e.company}: ${e.description}`),
      skills: cvData.skills?.map(s => s.value || s),
      projects: cvData.projects?.map(p => `${p.name}: ${p.description}`)
    });

    // --- BƯỚC 3: VIẾT PROMPT CHẶT CHẼ HƠN ---
    const prompt = `
      Đóng vai nhà tuyển dụng khó tính. Hãy chấm điểm CV dưới đây (thang 0-100).
      Dữ liệu CV: ${cvContentSummary}

      Quy tắc chấm điểm:
      1. Nếu nội dung sơ sài, thiếu số liệu (impact), hoặc mô tả quá ngắn: Điểm phải DƯỚI 50.
      2. Nếu nội dung chung chung, không có từ khóa chuyên ngành: Điểm 50-70.
      3. Chỉ cho trên 80 nếu có số liệu cụ thể (ví dụ: tăng trưởng 20%, quản lý 5 người).
      
      Yêu cầu output: Trả về ĐÚNG định dạng JSON này (không markdown):
      { "score": <số>, "message": "<Nhận xét ngắn gọn, chỉ ra 1 điểm yếu lớn nhất>" }
    `;

    let aiResponseText = await callGeminiWithRetry(prompt);

    // Làm sạch response (xóa ```json ... ```)
    aiResponseText = aiResponseText.replace(/```json/g, '').replace(/```/g, '').trim();
    
    let result;
    try {
      result = JSON.parse(aiResponseText);
    } catch (e) {
      console.error("Lỗi parse JSON từ AI:", aiResponseText);
      // Nếu AI trả về lỗi format, fallback về điểm trung bình thấp
      result = { score: 40, message: "Hệ thống gặp khó khăn khi đọc CV. Hãy thử viết chi tiết hơn." };
    }

    res.json({ 
      score: result.score, 
      message: result.message 
    });

  } catch (err) {
    console.error("Score Error:", err.message);
    res.status(500).json({ message: 'Lỗi server khi chấm điểm', error: err.message });
  }
});

module.exports = router;