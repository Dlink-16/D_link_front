<template>
  <nav v-if="totalPages > 0" class="pagination" :aria-label="ariaLabel">
    <button type="button" :disabled="currentPage === 1" @click="selectPage(1)">처음</button>
    <button type="button" :disabled="currentPage === 1" @click="selectPage(currentPage - 1)">이전</button>
    <button
      v-for="page in visiblePages"
      :key="page"
      type="button"
      class="page-button"
      :class="{ active: page === currentPage }"
      :aria-current="page === currentPage ? 'page' : undefined"
      :aria-label="`${page}페이지`"
      @click="selectPage(page)"
    >
      {{ page }}
    </button>
    <button type="button" :disabled="currentPage === totalPages" @click="selectPage(currentPage + 1)">다음</button>
    <button type="button" :disabled="currentPage === totalPages" @click="selectPage(totalPages)">끝</button>
  </nav>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  currentPage: {
    type: Number,
    required: true
  },
  totalPages: {
    type: Number,
    required: true
  },
  ariaLabel: {
    type: String,
    default: '페이지 이동'
  }
});

const emit = defineEmits(['change']);

const visiblePages = computed(() => {
  const start = Math.max(1, Math.min(props.currentPage - 2, props.totalPages - 4));
  const end = Math.min(props.totalPages, start + 4);
  return Array.from({ length: Math.max(0, end - start + 1) }, (_, index) => start + index);
});

const selectPage = (page) => {
  if (page < 1 || page > props.totalPages || page === props.currentPage) {
    return;
  }
  emit('change', page);
};
</script>

<style scoped>
.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
  min-height: 38px;
}

.pagination button {
  min-width: 38px;
  padding: 8px 11px;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  background: white;
  color: #334155;
  cursor: pointer;
}

.pagination button:hover:not(:disabled),
.pagination .page-button.active {
  border-color: #4f46e5;
  background: #4f46e5;
  color: white;
}

.pagination button:focus-visible {
  outline: 2px solid #818cf8;
  outline-offset: 2px;
}

.pagination button:disabled {
  cursor: not-allowed;
  opacity: 0.45;
}

@media (max-width: 480px) {
  .pagination {
    gap: 6px;
  }

  .pagination button {
    min-width: 34px;
    padding: 7px 9px;
    font-size: 0.85rem;
  }
}
</style>
