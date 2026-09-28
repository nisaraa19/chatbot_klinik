import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { GoogleGenerativeAI } from '@google/generative-ai';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const chatSession = {};

app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', message: 'Server berjalan lancar!' });
});

app.post('/api/chat', async (req, res) => {
    try {
        const { message, sessionId = 'default', settings = {} } = req.body;
        const {
            tone = 'santai',
            useMemory = true,
            temperature = 0.6,
            topP = 0.95,
            maxOutputTokens = 512
        } = settings;

        const systemInstruction = `
        Kamu adalah Customer Service & Health-Info Assistant untuk klinik (layanan poli KIA, pendaftaran, jam praktik, info umum).
        Gaya bahasa: ${tone}.
        Penting: kamu BUKAN pengganti dokter. Untuk kondisi darurat medis, selalu ingatkan pengguna ke UGD terdekat.
        `;

        const model = genAI.getGenerativeModel({
            model: process.env.MODEL_NAME || 'gemini-2.5-flash',
            systemInstruction,
            generationConfig: {temperature, topP, maxOutputTokens }
        });

        let chat;
        if (useMemory) {
            if (!chatSession[sessionId]) {
                chatSession[sessionId] = model.startChat({ history: []});
            }
            chat = chatSession[sessionId];
        } else {
            chat = model.startChat({ history: []});
        }

        const result = await chat.sendMessage(message);
        res.json({ reply: result.response.text() });
    } catch (err) {
        console.error('Error Backend/AI:', err);
        res.status(500).json({ error: 'Terjadi kesalahan pada server AI,'});
    }
});

const PORT = process.env.PORT || 5050;
app.listen(PORT, () => {
    console.log(`Server Backend berjalan di http://localhost:${PORT}`);
});