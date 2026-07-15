<template>
  <div v-if="open" class="popup-overlay">
    <div class="popup-card" role="dialog" aria-modal="true">
      <div class="popup-icon" :class="type === 'error' ? 'error' : 'success'">
        {{ type === 'error' ? '✕' : '✓' }}
      </div>
      <h3>{{ title }}</h3>
      <p>{{ message }}</p>
      <button type="button" class="popup-button" @click="handleConfirm">{{ confirmText }}</button>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  open: Boolean,
  title: {
    type: String,
    default: '완료'
  },
  message: {
    type: String,
    default: '작업이 완료되었습니다.'
  },
  confirmText: {
    type: String,
    default: '확인'
  },
  type: {
    type: String,
    default: 'success'
  }
});

const emit = defineEmits(['confirm', 'close']);

const handleConfirm = () => {
  emit('confirm');
  emit('close');
};
</script>

<style scoped>
.popup-overlay {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.55);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 2000;
  padding: 20px;
}

.popup-card {
  width: min(360px, 100%);
  background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
  border-radius: 16px;
  box-shadow: 0 20px 45px rgba(15, 23, 42, 0.2);
  padding: 28px 24px;
  text-align: center;
  animation: popup-in 0.2s ease-out;
}

.popup-icon {
  width: 56px;
  height: 56px;
  margin: 0 auto 14px;
  border-radius: 50%;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28px;
  font-weight: bold;
}

.popup-icon.success {
  background: linear-gradient(135deg, #10b981, #059669);
}

.popup-icon.error {
  background: linear-gradient(135deg, #ef4444, #dc2626);
}

.popup-card h3 {
  margin: 0 0 8px;
  color: #0f172a;
  font-size: 20px;
}

.popup-card p {
  margin: 0 0 18px;
  color: #475569;
  line-height: 1.5;
}

.popup-button {
  border: none;
  padding: 10px 18px;
  border-radius: 999px;
  background: linear-gradient(135deg, #4f46e5, #6366f1);
  color: white;
  cursor: pointer;
  font-weight: 600;
}

@keyframes popup-in {
  from {
    opacity: 0;
    transform: translateY(8px) scale(0.98);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}
</style>
