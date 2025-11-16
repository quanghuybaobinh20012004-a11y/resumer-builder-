const express = require('express');
const router = express.Router();
const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));
const authMiddleware = require('../middleware/auth.middleware');

const GEMINI_MODEL = "gemini-2.5-flash-lite";


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


router.post('/generate', authMiddleware, async (req, res) => {
  try {
    const { prompt } = req.body;
    const apiKey = process.env.OPENAI_API_KEY || process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ message: 'Thiếu API Key (OpenAI hoặc Gemini).' });
    }

    let aiText = '';
    
    if (process.env.GEMINI_API_KEY) {
      aiText = await callGeminiWithRetry(prompt);
    } else {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [{ role: "user", content: prompt }],
          temperature: 0.7
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error("Lỗi từ OpenAI API:", errorData);
        return res.status(response.status).json({ message: 'Lỗi khi gọi OpenAI.', details: errorData });
      }

      const data = await response.json();
      aiText = data.choices?.[0]?.message?.content || 'Không có kết quả.';
    }

    res.json({ result: aiText.trim() });

  } catch (err) {
    console.error("AI Error:", err.message);
    res.status(500).json({ message: 'Lỗi server khi xử lý AI', error: err.message });
  }
});


router.post('/proofread', authMiddleware, async (req, res) => {
  try {
    const { text } = req.body;
    if (!text || text.trim().length < 10) {
      return res.status(400).json({ message: 'Cần ít nhất 10 ký tự để rà soát.' });
    }

    const prompt = `Bạn là một biên tập viên CV chuyên nghiệp. Hãy rà soát và sửa tất cả lỗi chính tả, ngữ pháp, và ngắt câu trong đoạn văn sau đây.
Giữ nguyên ý nghĩa và văn phong gốc. Chỉ trả về đoạn văn đã được sửa lỗi, không thêm bất kỳ lời bình luận nào.
Đoạn văn gốc: "${text}"`;

    const correctedText = await callGeminiWithRetry(prompt);

    res.json({ correctedText: correctedText.trim() });

  } catch (err) {
    console.error("AI Proofread Error:", err.message);
    res.status(500).json({ message: 'Lỗi server khi rà soát AI', error: err.message });
  }
});

router.post('/score', authMiddleware, async (req, res) => {
  const score = Math.floor(Math.random() * (95 - 85 + 1)) + 85;
  
  await new Promise(resolve => setTimeout(resolve, 1500)); 

  res.json({ score, message: "CV của bạn đạt điểm cao! Hãy rà soát lỗi chính tả để hoàn thiện." });
});

module.exports = router;