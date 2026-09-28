import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { GoogleGenerativeAI } from "@google/generative-ai";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json({ limit: "1mb" }));

const PORT = process.env.PORT || 5050;
const MODEL_NAME = process.env.MODEL_NAME || "gemini-2.5-flash";

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  console.warn("[WARN] GEMINI_API_KEY belum di-set. Buat server/.env lalu jalankan ulang server.");
}

const genAI = new GoogleGenerativeAI(apiKey || "MISSING_KEY");
const model = genAI.getGenerativeModel({ model: MODEL_NAME });

/**
 * Memory sederhana per sessionId (in-memory).
 * Untuk production: simpan ke Redis/DB.
 */
const memoryStore = new Map(); // sessionId -> [{role, parts:[{text}]}]

function buildSystemInstruction({ tone = "santai", domain = "kesehatan-klinik" } = {}) {
  const toneStyle =
    tone === "formal"
      ? "Gunakan bahasa Indonesia yang formal, ringkas, profesional."
      : "Gunakan bahasa Indonesia yang santai, ramah, tetap sopan.";

  const domainRules =
    domain === "kesehatan-klinik"
      ? `
Kamu adalah chatbot customer service klinik Ratnasari Sehat RSa.
Fokus: jam operasional, layanan poli (mis. Poli KIA), alur pendaftaran, estimasi biaya umum (jika ada), lokasi, kontak, dan edukasi kesehatan ringan.
Jika pertanyaan memerlukan diagnosis/terapi, berikan edukasi umum dan arahkan konsultasi dokter.
Selalu tambahkan disclaimer singkat: "Informasi ini bersifat umum dan tidak menggantikan konsultasi dokter."
`
      : "Jawab sesuai pengetahuan umum, tetap aman dan bertanggung jawab.";

  return `${toneStyle}\n${domainRules}`.trim();
}

app.get("/api/health", (req, res) => {
  res.json({ ok: true, model: MODEL_NAME, time: new Date().toISOString() });
});

app.post("/api/chat", async (req, res) => {
  try {
    const { message, sessionId, settings } = req.body || {};
    if (!message || typeof message !== "string") {
      return res.status(400).json({ error: "message wajib string" });
    }

    const {
      tone = "santai",
      domain = "kesehatan-klinik",
      useMemory = true,
      temperature = 0.6,
      topP = 0.95,
      maxOutputTokens = 512
    } = settings || {};

    const systemInstruction = buildSystemInstruction({ tone, domain });

    // Ambil riwayat jika memory ON
    const history = useMemory && sessionId ? (memoryStore.get(sessionId) || []) : [];

    // Format sesuai "contents" Gemini API style via SDK: role + parts[{text}]
    const contents = [
      { role: "user", parts: [{ text: `SYSTEM:\n${systemInstruction}\n\nUSER:\n${message}` }] }
    ];

    // Kalau pakai memory, kirim beberapa pesan terakhir (batasi biar hemat token)
    // Note: Kita menyimpan "role:user/model" saja. Untuk ringkas, kirim max 10.
    if (history.length) {
      const last = history.slice(-10);
      // Prepend history before current message for better context
      contents.unshift(...last);
    }

    const result = await model.generateContent({
      contents,
      generationConfig: {
        temperature,
        topP,
        maxOutputTokens
      }
    });

    const reply = result?.response?.text?.() ?? "Maaf, saya belum bisa menjawab saat ini.";

    // Simpan ke memory
    if (useMemory && sessionId) {
      const prev = memoryStore.get(sessionId) || [];
      prev.push({ role: "user", parts: [{ text: message }] });
      prev.push({ role: "model", parts: [{ text: reply }] });
      // Batasi 30 item (15 turn)
      memoryStore.set(sessionId, prev.slice(-30));
    }

    res.json({ reply });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error", details: String(err?.message || err) });
  }
});

app.listen(PORT, () => {
  console.log(`✅ Backend running on http://localhost:${PORT} (model=${MODEL_NAME})`);
});
