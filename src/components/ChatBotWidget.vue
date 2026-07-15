<template>
  <div class="chatbot-container" :class="{ 'is-mobile-full': isOpen }">
    <!-- 1. 접힌 상태 (플로팅 버튼) -->
    <button v-if="!isOpen" class="floating-btn" @click="toggleChat">
      <span class="icon">💬</span>
      <span class="text">챗봇</span>
    </button>

    <!-- 2. 펼친 상태 (대화창) -->
    <div v-else class="chat-window">
      <div class="chat-header">
        <h3>LocalHub 챗봇</h3>
        <button class="close-btn" @click="toggleChat">✕</button>
      </div>
      
      <div class="chat-messages" ref="messageBox">
        <div 
          v-for="(msg, index) in messages" 
          :key="index" 
          :class="['message-wrapper', msg.role]"
        >
          <div class="message-bubble">{{ msg.content }}</div>
        </div>
      </div>

      <div class="chat-input-area">
        <input 
          v-model="inputMessage" 
          @keyup.enter="sendMessage" 
          placeholder="지역 정보를 물어보세요..." 
        />
        <button @click="sendMessage">전송</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, nextTick } from 'vue';

const isOpen = ref(false);
const inputMessage = ref('');
const messageBox = ref(null);
const messages = ref([
  { role: 'assistant', content: '안녕하세요! 궁금한 지역 정보를 물어보세요.' }
]);

const toggleChat = () => {
  isOpen.value = !isOpen.value;
};

const sendMessage = async () => {
  if (!inputMessage.value.trim()) return;

  // 유저 메시지 추가
  messages.value.push({ role: 'user', content: inputMessage.value });
  const userPrompt = inputMessage.value;
  inputMessage.value = '';
  
  scrollToBottom();

  try {
    const history = messages.value.slice(0, -1); // 방금 추가한 유저 메시지 제외한 이전 대화 내역
    const response = await fetch('http://localhost:8000/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        message: userPrompt,
        history: history
      })
    });
    const data = await response.json();
    messages.value.push({ role: 'assistant', content: data.reply });
  } catch (error) {
    messages.value.push({ role: 'assistant', content: '오류가 발생했습니다. 다시 시도해주세요.' });
  }
  
  scrollToBottom();
};

const scrollToBottom = () => {
  nextTick(() => {
    if (messageBox.value) {
      messageBox.value.scrollTop = messageBox.value.scrollHeight;
    }
  });
};
</script>

<style scoped>
.chatbot-container {
  position: fixed;
  bottom: 20px;
  right: 20px;
  z-index: 1000;
  font-family: sans-serif;
}
.floating-btn {
  background: #4f46e5;
  color: white;
  border: none;
  border-radius: 50px;
  padding: 12px 20px;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
  display: flex;
  align-items: center;
  gap: 8px;
}
.chat-window {
  width: 360px;
  height: 500px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 8px 24px rgba(0,0,0,0.2);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
.chat-header {
  background: #4f46e5;
  color: white;
  padding: 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.chat-header h3 { margin: 0; font-size: 16px; }
.close-btn { background: none; border: none; color: white; cursor: pointer; font-size: 18px; }
.chat-messages {
  flex: 1;
  padding: 16px;
  overflow-y: auto;
  background: #f8fafc;
}
.message-wrapper { display: flex; margin-bottom: 12px; }
.message-wrapper.user { justify-content: flex-end; }
.message-bubble {
  max-width: 75%;
  padding: 10px 14px;
  border-radius: 12px;
  font-size: 14px;
  line-height: 1.4;
  white-space: pre-wrap;
}
.message-wrapper.assistant .message-bubble { background: white; border: 1px solid #e2e8f0; }
.message-wrapper.user .message-bubble { background: #4f46e5; color: white; }
.chat-input-area { padding: 12px; display: flex; gap: 8px; border-top: 1px solid #e2e8f0; background: white; }
.chat-input-area input { flex: 1; padding: 8px 12px; border: 1px solid #cbd5e1; border-radius: 6px; }
.chat-input-area button { background: #4f46e5; color: white; border: none; padding: 0 16px; border-radius: 6px; cursor: pointer; }

/* 모바일 대응 반응형 CSS */
@media (max-width: 640px) {
  .chatbot-container.is-mobile-full {
    position: fixed;
    top: 0; left: 0; right: 0; bottom: 0;
    width: 100%; height: 100%;
  }
  .chatbot-container.is-mobile-full .chat-window {
    width: 100%; height: 100%;
    border-radius: 0;
  }
}
</style>