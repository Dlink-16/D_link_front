<template>
  <div class="chatbot-container" :class="{ 'is-mobile-full': isOpen }">
    <!-- 1. 접힌 상태 (플로팅 버튼) -->
    <button v-if="!isOpen" class="floating-btn" @click="toggleChat">
      <span class="icon">💬</span>
      <span class="text">챗봇</span>
    </button>

    <!-- 2. 펼친 상태 (대화창) -->
    <div v-else class="chat-window" :style="{ width: windowWidth + 'px', height: windowHeight + 'px' }">
      <!-- 크기 조절 핸들 (좌측 상단) -->
      <div class="resize-handle" @mousedown="startResize" @touchstart.passive="startResize"></div>
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
        
        <!-- 로딩 표시기 -->
        <div v-if="isLoading" class="message-wrapper assistant">
          <div class="message-bubble typing-indicator">
            <span></span><span></span><span></span>
          </div>
        </div>
      </div>

      <div class="chat-input-area">
        <input 
          v-model="inputMessage" 
          @keyup.enter="sendMessage" 
          placeholder="지역 정보를 물어보세요..." 
          :disabled="isLoading"
        />
        <button @click="sendMessage" :disabled="isLoading">전송</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, nextTick } from 'vue';
import { chatStore } from '@/store/chatStore';
import apiClient from '@/utils/api';

const isOpen = ref(false);
const inputMessage = ref('');
const messageBox = ref(null);
const windowWidth = ref(360);
const windowHeight = ref(500);
const messages = ref([
  { role: 'assistant', content: '안녕하세요! 궁금한 지역 정보를 물어보세요.' }
]);
const isLoading = ref(false);

const toggleChat = () => {
  isOpen.value = !isOpen.value;
};

const sendMessage = async () => {
  if (!inputMessage.value.trim() || isLoading.value) return;

  // 유저 메시지 추가
  messages.value.push({ role: 'user', content: inputMessage.value });
  const userPrompt = inputMessage.value;
  inputMessage.value = '';
  
  isLoading.value = true;
  scrollToBottom();

  try {
    const history = messages.value.slice(0, -1); // 방금 추가한 유저 메시지 제외한 이전 대화 내역
    const response = await apiClient.post('/chat', {
      message: userPrompt,
      history: history
    });
    
    const data = response.data;
    messages.value.push({ role: 'assistant', content: data.reply });
    
    // 챗봇 추천 장소 데이터가 있는 경우 전역 스토어에 저장
    if (data.locations && data.locations.length > 0) {
      chatStore.setLocations(data.locations);
    }
  } catch (error) {
    console.error("ChatBot Error:", error);
    if (error.response) {
      console.error("Response Data:", error.response.data);
    }
    messages.value.push({ role: 'assistant', content: '오류가 발생했습니다. 다시 시도해주세요.' });
  } finally {
    isLoading.value = false;
    scrollToBottom();
  }
};

const scrollToBottom = () => {
  nextTick(() => {
    if (messageBox.value) {
      messageBox.value.scrollTop = messageBox.value.scrollHeight;
    }
  });
};

// --- 크기 조절 (Resize) 로직 ---
let isResizing = false;
let startX = 0;
let startY = 0;
let startWidth = 0;
let startHeight = 0;

const startResize = (e) => {
  isResizing = true;
  const clientX = e.type.includes('mouse') ? e.clientX : e.touches[0].clientX;
  const clientY = e.type.includes('mouse') ? e.clientY : e.touches[0].clientY;
  startX = clientX;
  startY = clientY;
  startWidth = windowWidth.value;
  startHeight = windowHeight.value;
  document.addEventListener('mousemove', onResize);
  document.addEventListener('mouseup', stopResize);
  document.addEventListener('touchmove', onResize, { passive: true });
  document.addEventListener('touchend', stopResize);
};

const onResize = (e) => {
  if (!isResizing) return;
  const clientX = e.type.includes('mouse') ? e.clientX : e.touches[0].clientX;
  const clientY = e.type.includes('mouse') ? e.clientY : e.touches[0].clientY;
  
  // 우하단 고정이므로 마우스를 왼쪽/위로 움직일수록 크기가 증가함
  const deltaX = startX - clientX;
  const deltaY = startY - clientY;
  
  windowWidth.value = Math.max(300, Math.min(800, startWidth + deltaX));
  windowHeight.value = Math.max(400, Math.min(800, startHeight + deltaY));
};

const stopResize = () => {
  isResizing = false;
  document.removeEventListener('mousemove', onResize);
  document.removeEventListener('mouseup', stopResize);
  document.removeEventListener('touchmove', onResize);
  document.removeEventListener('touchend', stopResize);
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
  width: 360px; /* 초기값 (스크립트에서 덮어씀) */
  height: 500px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 8px 24px rgba(0,0,0,0.2);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  position: relative;
}
/* 좌측 상단 리사이즈 핸들 */
.resize-handle {
  position: absolute;
  top: 0;
  left: 0;
  width: 20px;
  height: 20px;
  cursor: nwse-resize;
  z-index: 10;
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
.chat-input-area button { background: #4f46e5; color: white; border: none; padding: 0 16px; border-radius: 6px; cursor: pointer; transition: background 0.2s; }
.chat-input-area button:disabled { background: #94a3b8; cursor: not-allowed; }

/* 로딩 애니메이션 CSS */
.typing-indicator {
  display: flex;
  gap: 4px;
  align-items: center;
  padding: 12px 14px !important;
}
.typing-indicator span {
  width: 6px;
  height: 6px;
  background-color: #94a3b8;
  border-radius: 50%;
  animation: typing 1.4s infinite ease-in-out both;
}
.typing-indicator span:nth-child(1) { animation-delay: -0.32s; }
.typing-indicator span:nth-child(2) { animation-delay: -0.16s; }
@keyframes typing {
  0%, 80%, 100% { transform: scale(0); }
  40% { transform: scale(1); }
}

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