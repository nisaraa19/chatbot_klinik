<template>
  <div class="app-container">
    <div class="header">
      <div>
        <h2>Solumedis AI Chatbot</h2>
        <p class="subtitle">Didukung teknologi Gemini GenerateContent untuk layanan kesehatan cerdas</p>
      </div>
      <div class="status-wrap">
        <span :class="['status-badge', isOnline ? 'online' : 'offline']">
          ● {{ isOnline ? 'online' : 'offline' }}
        </span>
        <button class="btn-reset" @click="resetChat">Reset</button>
      </div>
    </div>

    <div class="grid-container">
      <!-- PANEL KIRI (CHAT) -->
      <div class="panel-main">
        <div class="chat-box" ref="chatBox">
          <div 
            v-for="(msg, index) in messages" 
            :key="index" 
            :class="['message', msg.sender]"
          >
            <div class="msg-bubble">
              {{ msg.text }}
            </div>
          </div>
          <div v-if="loading" class="message bot">
            <div class="msg-bubble loading">Sedang mengetik...</div>
          </div>
        </div>

        <div class="quick-replies">
          <button @click="sendQuickReply('Jam operasional klinik?')">Jam operasional klinik?</button>
          <button @click="sendQuickReply('Cara daftar pasien baru?')">Cara daftar pasien baru?</button>
          <button @click="sendQuickReply('Layanan Poli KIA apa saja?')">Layanan Poli KIA apa saja?</button>
        </div>

        <div class="input-group">
          <input 
            v-model="inputMessage" 
            @keyup.enter="sendMessage" 
            placeholder="Tulis pesan... (Enter untuk kirim)" 
            :disabled="loading"
          />
          <button class="btn-send" @click="sendMessage" :disabled="loading || !inputMessage.trim()">
            Kirim
          </button>
        </div>
      </div>

      <!-- PANEL KANAN (KONFIGURASI) -->
      <div class="panel-side">
        <h3>Konfigurasi</h3>
        
        <div class="field">
          <label>Gaya Bahasa</label>
          <select v-model="settings.tone">
            <option value="formal">Formal</option>
            <option value="santai">Santai</option>
          </select>
        </div>

        <div class="field">
          <label>Domain</label>
          <select v-model="settings.domain">
            <option value="kesehatan-klinik">Kesehatan Klinik</option>
            <option value="umum">Umum</option>
          </select>
        </div>

        <div class="field checkbox-field">
          <label>Memory Percakapan</label>
          <input type="checkbox" v-model="settings.useMemory" />
        </div>

        <div class="field">
          <label>Temperature (kreativitas)</label>
          <input type="number" step="0.1" min="0" max="1" v-model.number="settings.temperature" />
        </div>

        <div class="field">
          <label>topP</label>
          <input type="number" step="0.05" min="0" max="1" v-model.number="settings.topP" />
        </div>

        <div class="field">
          <label>maxOutputTokens</label>
          <input type="number" v-model.number="settings.maxOutputTokens" />
        </div>

        <p class="note">
          Tips: <b>temperature</b> lebih besar = jawaban lebih kreatif. Matikan <b>memory</b> bila ingin setiap pertanyaan berdiri sendiri.
        </p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, nextTick } from 'vue';

const inputMessage = ref('');
const loading = ref(false);
const isOnline = ref(false);
const chatBox = ref(null);

const sessionId = ref('session-' + Math.random().toString(36).substring(7));
const messages = ref([
  { 
    sender: 'bot', 
    text: 'Halo! Saya asisten AI Klinik Ranasari Sehat. Tanyakan jam operasional, layanan poli, atau alur pendaftaran 😊\n\n⚠️ Informasi ini bersifat umum, tidak menggantikan konsultasi dokter.' 
  }
]);

const settings = ref({
  tone: 'formal',
  domain: 'kesehatan-klinik',
  useMemory: true,
  temperature: 0.6,
  topP: 0.95,
  maxOutputTokens: 512
});

const checkHealth = async () => {
  try {
    const res = await fetch('http://localhost:5050/api/health');
    const data = await res.json();
    if (data.ok || data.status === 'ok') {
      isOnline.value = true;
    }
  } catch (err) {
    isOnline.value = false;
  }
};

const scrollToBottom = async () => {
  await nextTick();
  if (chatBox.value) {
    chatBox.value.scrollTop = chatBox.value.scrollHeight;
  }
};

const sendMessage = async () => {
  if (!inputMessage.value.trim() || loading.value) return;

  const text = inputMessage.value;
  messages.value.push({ sender: 'user', text });
  inputMessage.value = '';
  loading.value = true;
  await scrollToBottom();

  try {
    const res = await fetch('http://localhost:5050/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: text,
        sessionId: sessionId.value,
        settings: settings.value
      })
    });

    const data = await res.json();
    if (data.reply) {
      messages.value.push({ sender: 'bot', text: data.reply });
    } else {
      messages.value.push({ sender: 'bot', text: 'Maaf, gagal memproses respon AI.' });
    }
  } catch (err) {
    messages.value.push({ sender: 'bot', text: 'Gagal terhubung ke backend server.' });
  } finally {
    loading.value = false;
    await scrollToBottom();
  }
};

const sendQuickReply = (text) => {
  inputMessage.value = text;
  sendMessage();
};

const resetChat = () => {
  sessionId.value = 'session-' + Math.random().toString(36).substring(7);
  messages.value = [
    { 
      sender: 'bot', 
      text: 'Halo! Saya asisten AI Klinik Ranasari Sehat. Tanyakan jam operasional, layanan poli, atau alur pendaftaran 😊\n\n⚠️ Informasi ini bersifat umum, tidak menggantikan konsultasi dokter.' 
    }
  ];
};

onMounted(() => {
  checkHealth();
  setInterval(checkHealth, 5000);
});
</script>

<style scoped>
.app-container {
  max-width: 1000px;
  margin: 30px auto;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
  background-color: #0d1117;
  color: #c9d1d9;
  border-radius: 12px;
  border: 1px solid #30363d;
  overflow: hidden;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 24px;
  background-color: #161b22;
  border-bottom: 1px solid #30363d;
}

.header h2 {
  margin: 0;
  font-size: 18px;
  color: #f0f6fc;
}

.subtitle {
  margin: 4px 0 0 0;
  font-size: 12px;
  color: #8b949e;
}

.status-wrap {
  display: flex;
  align-items: center;
  gap: 12px;
}

.status-badge {
  font-size: 12px;
  padding: 3px 10px;
  border-radius: 12px;
  font-weight: 600;
}

.status-badge.online { background: #0e4429; color: #3fb950; }
.status-badge.offline { background: #4c1d1d; color: #f85149; }

.btn-reset {
  background: #21262d;
  border: 1px solid #30363d;
  color: #c9d1d9;
  padding: 5px 12px;
  border-radius: 6px;
  cursor: pointer;
}

.grid-container {
  display: grid;
  grid-template-columns: 1fr 280px;
}

.panel-main {
  padding: 20px;
  border-right: 1px solid #30363d;
  display: flex;
  flex-direction: column;
}

.chat-box {
  height: 320px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding-right: 8px;
}

.message {
  display: flex;
}

.message.user { justify-content: flex-end; }
.message.bot { justify-content: flex-start; }

.msg-bubble {
  max-width: 80%;
  padding: 10px 14px;
  border-radius: 8px;
  font-size: 14px;
  line-height: 1.5;
  white-space: pre-wrap;
}

.message.user .msg-bubble {
  background-color: #1f6beb;
  color: #ffffff;
}

.message.bot .msg-bubble {
  background-color: #21262d;
  color: #c9d1d9;
  border: 1px solid #30363d;
}

.quick-replies {
  display: flex;
  gap: 8px;
  margin: 16px 0 12px 0;
  flex-wrap: wrap;
}

.quick-replies button {
  background: #21262d;
  border: 1px solid #30363d;
  color: #58a6ff;
  padding: 6px 12px;
  border-radius: 16px;
  font-size: 12px;
  cursor: pointer;
}

.quick-replies button:hover {
  background: #30363d;
}

.input-group {
  display: flex;
  gap: 8px;
}

.input-group input {
  flex: 1;
  background: #161b22;
  border: 1px solid #30363d;
  color: #f0f6fc;
  padding: 10px 14px;
  border-radius: 6px;
  font-size: 14px;
}

.input-group input:focus {
  outline: none;
  border-color: #58a6ff;
}

.btn-send {
  background: #238636;
  border: none;
  color: #ffffff;
  padding: 0 18px;
  border-radius: 6px;
  font-weight: 600;
  cursor: pointer;
}

.btn-send:disabled {
  background: #21262d;
  color: #484f58;
  cursor: not-allowed;
}

.panel-side {
  padding: 20px;
  background: #161b22;
}

.panel-side h3 {
  margin: 0 0 16px 0;
  font-size: 15px;
  color: #f0f6fc;
}

.field {
  margin-bottom: 14px;
}

.field label {
  display: block;
  font-size: 12px;
  color: #8b949e;
  margin-bottom: 6px;
}

.field select, .field input[type="number"] {
  width: 100%;
  background: #0d1117;
  border: 1px solid #30363d;
  color: #c9d1d9;
  padding: 6px 10px;
  border-radius: 6px;
  box-sizing: border-box;
}

.checkbox-field {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.checkbox-field label { margin: 0; }

.note {
  font-size: 11px;
  color: #8b949e;
  line-height: 1.4;
  margin-top: 20px;
  border-top: 1px solid #30363d;
  padding-top: 12px;
}
</style>