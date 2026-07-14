<template>
  <div class="chatbot-container" :class="{ 'is-open': isOpen }">
    <div class="chat-header" @click="toggleChat">
      <h3>🤖 지역 정보 도우미</h3>
      <button class="close-btn">{{ isOpen ? '▼' : '▲' }}</button>
    </div>
    
    <div class="chat-body" v-show="isOpen">
      <div class="messages" ref="messagesContainer">
        <div 
          v-for="(msg, index) in messages" 
          :key="index" 
          :class="['message', msg.role === 'user' ? 'user-message' : 'bot-message']"
        >
          <div class="message-content">{{ msg.content }}</div>
        </div>
        <div v-if="isLoading" class="message bot-message loading">
          <div class="message-content">...</div>
        </div>
      </div>
      
      <div class="chat-input">
        <input 
          type="text" 
          v-model="inputMessage" 
          @keyup.enter="sendMessage"
          placeholder="지역 관광지, 맛집을 물어보세요!"
        />
        <button @click="sendMessage">전송</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, nextTick } from 'vue'

const props = defineProps({
  isOpen: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['update:isOpen'])

const inputMessage = ref('')
const isLoading = ref(false)
const messagesContainer = ref(null)
const messages = ref([
  { role: 'bot', content: '안녕하세요! 지역 관광지, 축제, 맛집에 대해 무엇이든 물어보세요.' }
])

const toggleChat = () => {
  emit('update:isOpen', !props.isOpen)
}

const scrollToBottom = async () => {
  await nextTick()
  if (messagesContainer.value) {
    messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
  }
}

const sendMessage = async () => {
  if (!inputMessage.value.trim() || isLoading.value) return

  const userText = inputMessage.value
  messages.value.push({ role: 'user', content: userText })
  inputMessage.value = ''
  isLoading.value = true
  scrollToBottom()

  try {
    // 백엔드 연동 전 임시 딜레이 및 응답
    // 실제 연동 시: await axios.post('/api/chat', { message: userText })
    await new Promise(resolve => setTimeout(resolve, 1000))
    messages.value.push({ role: 'bot', content: '아직 백엔드가 연동되지 않았습니다. API가 연결되면 적절한 답변을 드릴게요!' })
  } catch (error) {
    messages.value.push({ role: 'bot', content: '오류가 발생했습니다. 잠시 후 다시 시도해주세요.' })
  } finally {
    isLoading.value = false
    scrollToBottom()
  }
}
</script>

<style scoped>
.chatbot-container {
  position: fixed;
  bottom: 20px;
  right: 20px;
  width: 350px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 5px 15px rgba(0,0,0,0.15);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  transition: all 0.3s ease;
  z-index: 1000;
}
.chatbot-container:not(.is-open) {
  height: auto;
  cursor: pointer;
}
.chat-header {
  background: #764ba2;
  color: white;
  padding: 1rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  cursor: pointer;
}
.chat-header h3 {
  margin: 0;
  font-size: 1.1rem;
}
.close-btn {
  background: none;
  border: none;
  color: white;
  font-size: 1.2rem;
  cursor: pointer;
}
.chat-body {
  height: 400px;
  display: flex;
  flex-direction: column;
}
.messages {
  flex: 1;
  padding: 1rem;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
}
.message {
  display: flex;
  max-width: 80%;
}
.user-message {
  align-self: flex-end;
}
.bot-message {
  align-self: flex-start;
}
.message-content {
  padding: 0.8rem 1rem;
  border-radius: 12px;
  line-height: 1.4;
}
.user-message .message-content {
  background: #667eea;
  color: white;
  border-bottom-right-radius: 4px;
}
.bot-message .message-content {
  background: #f1f3f5;
  color: #333;
  border-bottom-left-radius: 4px;
}
.chat-input {
  display: flex;
  padding: 1rem;
  border-top: 1px solid #eee;
  background: #fafafa;
}
.chat-input input {
  flex: 1;
  padding: 0.8rem;
  border: 1px solid #ddd;
  border-radius: 4px 0 0 4px;
  outline: none;
}
.chat-input button {
  padding: 0 1rem;
  background: #764ba2;
  color: white;
  border: none;
  border-radius: 0 4px 4px 0;
  cursor: pointer;
}
.chat-input button:hover {
  background: #5d3a82;
}
</style>
