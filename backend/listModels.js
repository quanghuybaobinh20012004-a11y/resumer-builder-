require('dotenv').config();
const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));

async function listModels() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error("Thiếu GEMINI_API_KEY trong .env");

    const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;

    const res = await fetch(url);
    if (!res.ok) {
        const text = await res.text();
        throw new Error(`Lỗi Google API: ${res.status} - ${text}`);
    }

    const data = await res.json();

    console.log("=== Raw JSON trả về từ Google ===");
    console.log(JSON.stringify(data, null, 2));
}

listModels().catch(err => console.error(err.message));
