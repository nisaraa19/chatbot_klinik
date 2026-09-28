# Gemini AI Chatbot (Vue.js + Express.js) All code was written by Dharman

Use case: **Customer Service & Health-Info Assistant** untuk klinik (contoh: pendaftaran, jam praktik, layanan Poli KIA, info umum).
> Catatan: Bot ini **bukan pengganti dokter**. Untuk keluhan medis darurat, arahkan ke layanan gawat darurat setempat.

## Fitur Utama
- Chat UI modern (Vue 3 + Vite)
- Backend Express + Gemini API (GenerateContent)
- **Parameter kreatif**:
  - Gaya bahasa: `formal` / `santai`
  - Domain pengetahuan: `kesehatan-klinik` (default) + prompt system khusus
  - Memory percakapan (per `sessionId`) bisa ON/OFF
  - Rekomendasi/quick replies (FAQ buttons)
- Endpoint REST sederhana: `POST /api/chat`, `GET /api/health`

## Teknologi
- Frontend: Vue 3, Vite
- Backend: Node.js, Express.js
- AI: Gemini API via SDK `@google/generative-ai`

Dokumentasi referensi:
- Buat API KEY nya dari sini : https://aistudio.google.com/api-keys daftar dulu pake Gmail kalian 
- Generating content (Gemini API): https://ai.google.dev/api/generate-content
- Quickstart: https://ai.google.dev/gemini-api/docs/quickstart

## Struktur Folder
```
gemini-vue-express-chatbot/
  client/   # Vue FE
  server/   # Express BE
  docs/     # screenshots UI
```

## Konfigurasi
Buat file `server/.env`:
```bash
GEMINI_API_KEY=ISI_API_KEY_KAMU
PORT=5050
MODEL_NAME=gemini-2.5-flash
```

Sumber: Gemini API menggunakan header `x-goog-api-key` / env var `GEMINI_API_KEY`. (Docs: ai.google.dev)

## Menjalankan Project (Dev)
### 1) Backend
```bash
cd server
npm install
npm run dev
```

### 2) Frontend
```bash
cd client
npm install
npm run dev
```

Buka: `http://localhost:5173`

## Build Production (opsional)
```bash
cd client
npm run build
```
Lalu serve file `client/dist` via server static atau hosting lain.

## API
### POST /api/chat
Body:
```json
{
  "message": "Halo, jam buka klinik kapan?",
  "sessionId": "uuid-dari-client",
  "settings": {
    "tone": "santai",
    "useMemory": true,
    "temperature": 0.6,
    "topP": 0.95,
    "maxOutputTokens": 512
  }
}
```

Response:
```json
{ "reply": "..." }
```

## Catatan Keamanan & Etika
- Jangan kirim data pasien sensitif (NIK, alamat, hasil lab).
- Tambahkan disclaimer dan fallback ke petugas manusia bila pertanyaan medis berat.

## Screenshots UI
Lihat folder `docs/`:
- `docs/ui-chat.png`
- `docs/ui-settings.png`
"# Chat-bot-AI-" 
