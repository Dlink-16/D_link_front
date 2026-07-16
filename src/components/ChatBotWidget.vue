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
          
          <!-- 장소 추천 시 지도 + 주소 목록 카드 -->
          <div v-if="msg.locations && msg.locations.length > 0" class="location-card">
            <div class="location-map" :ref="el => { if (el) mapRefs[index] = el }"></div>
            <div class="location-list">
              <div 
                v-for="(loc, li) in msg.locations" 
                :key="li" 
                class="location-item"
                @click="focusMarker(index, li)"
              >
                <span class="loc-number">{{ li + 1 }}</span>
                <div class="loc-info">
                  <strong>{{ loc.name }}</strong>
                  <span class="loc-address">{{ loc.address }}</span>
                </div>
              </div>
            </div>
          </div>
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
import { ref, nextTick, onMounted } from 'vue';
import { chatStore } from '@/store/chatStore';
import apiClient from '@/utils/api';

// --- Leaflet 로드 ---
let leafletReady = null;
const loadLeaflet = () => {
  if (leafletReady) return leafletReady;
  leafletReady = new Promise((resolve, reject) => {
    if (window.L) { resolve(window.L); return; }
    if (!document.getElementById('leaflet-style')) {
      const style = document.createElement('link');
      style.id = 'leaflet-style';
      style.rel = 'stylesheet';
      style.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(style);
    }
    if (document.getElementById('leaflet-script')) {
      document.getElementById('leaflet-script').addEventListener('load', () => resolve(window.L), { once: true });
      return;
    }
    const script = document.createElement('script');
    script.id = 'leaflet-script';
    script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
    script.onload = () => resolve(window.L);
    script.onerror = reject;
    document.head.appendChild(script);
  });
  return leafletReady;
};

const isOpen = ref(false);
const inputMessage = ref('');
const messageBox = ref(null);
const windowWidth = ref(420);
const windowHeight = ref(650);
const mapRefs = ref({});
const mapInstances = {};
const markerGroups = {};
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
    const msgObj = { role: 'assistant', content: data.reply };
    
    // 챗봇 추천 장소 데이터가 있는 경우 메시지에 포함 + 전역 스토어에도 저장
    if (data.locations && data.locations.length > 0) {
      msgObj.locations = data.locations;
      chatStore.setLocations(data.locations);
    }
    messages.value.push(msgObj);
    
    // 장소 데이터가 있으면 지도 렌더링
    if (msgObj.locations) {
      // 지도가 뜰 때 답답하지 않도록 자동으로 창 너비를 키워줌
      if (windowWidth.value < 750) {
        windowWidth.value = 750;
      }
      
      await nextTick();
      const msgIndex = messages.value.length - 1;
      renderMiniMap(msgIndex, msgObj.locations);
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

// --- 미니 지도 렌더링 ---
const renderMiniMap = async (msgIndex, locations) => {
  const L = await loadLeaflet();
  await nextTick();

  const container = mapRefs.value[msgIndex];
  if (!container) return;

  // 이미 생성된 맵이 있으면 제거
  if (mapInstances[msgIndex]) {
    mapInstances[msgIndex].remove();
  }

  const map = L.map(container, {
    zoomControl: false,
    scrollWheelZoom: true,
    attributionControl: false
  });
  mapInstances[msgIndex] = map;

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    subdomains: ['a', 'b', 'c']
  }).addTo(map);

  const group = L.featureGroup();
  markerGroups[msgIndex] = [];

  locations.forEach((loc, i) => {
    if (loc.lat && loc.lng) {
      const marker = L.marker([loc.lat, loc.lng])
        .bindPopup(`<b>${loc.name}</b><br>${loc.address}`)
        .addTo(group);
      markerGroups[msgIndex].push(marker);
    }
  });

  group.addTo(map);

  if (markerGroups[msgIndex].length > 0) {
    map.fitBounds(group.getBounds().pad(0.15));
  } else {
    map.setView([36.35, 127.38], 13);
  }

  // Leaflet은 컨테이너 크기 변경 후 invalidateSize 필요
  setTimeout(() => map.invalidateSize(), 200);
};

// 목록 항목 클릭 시 해당 마커로 포커스
const focusMarker = (msgIndex, locIndex) => {
  const map = mapInstances[msgIndex];
  const markers = markerGroups[msgIndex];
  if (map && markers && markers[locIndex]) {
    const marker = markers[locIndex];
    map.setView(marker.getLatLng(), 16, { animate: true });
    marker.openPopup();
  }
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
  background: linear-gradient(135deg, #4f46e5, #6366f1);
  color: white;
  border: none;
  border-radius: 50px;
  padding: 14px 24px;
  cursor: pointer;
  box-shadow: 0 4px 14px rgba(79, 70, 229, 0.3);
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 15px;
  font-weight: 600;
  transition: transform 0.2s, box-shadow 0.2s;
}
.floating-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(79, 70, 229, 0.4);
}
.chat-window {
  width: 420px; /* 초기값 (스크립트에서 덮어씀) */
  height: 650px;
  background: white;
  border-radius: 18px;
  box-shadow: 0 10px 40px rgba(0,0,0,0.15), 0 2px 10px rgba(0,0,0,0.05);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  position: relative;
  border: 1px solid rgba(0,0,0,0.05);
  transition: width 0.3s ease, height 0.3s ease; /* 부드러운 크기 전환 */
}
/* 좌측 상단 리사이즈 핸들 */
.resize-handle {
  position: absolute;
  top: 0;
  left: 0;
  width: 24px;
  height: 24px;
  cursor: nwse-resize;
  z-index: 10;
}
.chat-header {
  background: linear-gradient(135deg, #4f46e5, #6366f1);
  color: white;
  padding: 18px 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid rgba(255,255,255,0.1);
}
.chat-header h3 { margin: 0; font-size: 17px; font-weight: 600; letter-spacing: -0.5px; }
.close-btn { background: none; border: none; color: white; cursor: pointer; font-size: 20px; opacity: 0.8; transition: opacity 0.2s; }
.close-btn:hover { opacity: 1; }
.chat-messages {
  flex: 1;
  padding: 20px;
  overflow-y: auto;
  background: #f8fafc;
}
.message-wrapper { display: flex; margin-bottom: 16px; flex-wrap: wrap; }
.message-wrapper.user { justify-content: flex-end; }
.message-bubble {
  max-width: 80%;
  padding: 12px 16px;
  border-radius: 16px;
  font-size: 15px;
  line-height: 1.5;
  white-space: pre-wrap;
  box-shadow: 0 2px 5px rgba(0,0,0,0.02);
}
.message-wrapper.assistant .message-bubble { 
  background: white; 
  border: 1px solid #e2e8f0; 
  border-top-left-radius: 4px;
}
.message-wrapper.user .message-bubble { 
  background: linear-gradient(135deg, #4f46e5, #4338ca); 
  color: white; 
  border-top-right-radius: 4px;
}

/* 장소 추천 카드 (지도 + 주소 목록) */
.location-card {
  width: 100%;
  display: flex;
  margin-top: 10px;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  overflow: hidden;
  background: white;
  min-height: 200px;
  max-height: 260px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.03);
}
.location-map {
  flex: 1;
  min-width: 0;
  min-height: 200px;
}
.location-list {
  width: 180px;
  min-width: 180px;
  overflow-y: auto;
  border-left: 1px solid #e2e8f0;
}
.location-item {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  padding: 10px 12px;
  cursor: pointer;
  transition: background 0.15s;
  border-bottom: 1px solid #f1f5f9;
}
.location-item:last-child { border-bottom: none; }
.location-item:hover { background: #f0f4ff; }
.loc-number {
  flex-shrink: 0;
  width: 22px;
  height: 22px;
  background: #e0e7ff;
  color: #4338ca;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  font-weight: bold;
  margin-top: 1px;
}
.loc-info {
  display: flex;
  flex-direction: column;
  gap: 3px;
  min-width: 0;
}
.loc-info strong {
  font-size: 13px;
  color: #0f172a;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.loc-address {
  font-size: 11px;
  color: #64748b;
  word-break: break-all;
  line-height: 1.4;
}
.chat-input-area { 
  padding: 16px 20px; 
  display: flex; 
  gap: 10px; 
  border-top: 1px solid #e2e8f0; 
  background: white; 
}
.chat-input-area input { 
  flex: 1; 
  padding: 12px 16px; 
  border: 1px solid #cbd5e1; 
  border-radius: 24px; 
  font-size: 14.5px;
  transition: border-color 0.2s, box-shadow 0.2s;
}
.chat-input-area input:focus {
  outline: none;
  border-color: #4f46e5;
  box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.1);
}
.chat-input-area button { 
  background: #4f46e5; 
  color: white; 
  border: none; 
  padding: 0 20px; 
  border-radius: 24px; 
  cursor: pointer; 
  transition: all 0.2s; 
  font-weight: 500;
  font-size: 14.5px;
}
.chat-input-area button:hover:not(:disabled) {
  background: #4338ca;
  transform: translateY(-1px);
}
.chat-input-area button:disabled { background: #94a3b8; cursor: not-allowed; transform: none; }

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