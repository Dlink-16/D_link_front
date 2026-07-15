<!-- src/views/CategoryDetailView.vue -->
<template>
  <div class="category-detail-container">
    <!-- 상단 헤더 및 뒤로가기 -->
    <header class="detail-header">
      <button class="back-btn" @click="goBack">← 홈으로 돌아가기</button>
      <h1 class="title">대전/충청 종합 지역 정보</h1>
      <p class="subtitle">카테고리를 선택하여 LocalHub가 추천하는 상세 정보를 확인해 보세요.</p>
    </header>

    <!-- 탭 내비게이션 버튼 (홈 화면 스타일의 카테고리 전환 버튼) -->
    <section class="tab-navigation">
      <div class="tab-grid">
        <button 
          type="button" 
          class="tab-card" 
          :class="{ active: activeTab === 'tour' }" 
          @click="activeTab = 'tour'"
        >
          🏞️ 관광지
        </button>
        <button 
          type="button" 
          class="tab-card" 
          :class="{ active: activeTab === 'food' }" 
          @click="activeTab = 'food'"
        >
          🍕 맛집
        </button>
        <button 
          type="button" 
          class="tab-card" 
          :class="{ active: activeTab === 'festival' }" 
          @click="activeTab = 'festival'"
        >
          🎉 축제·행사
        </button>
      </div>
    </section>

    <p v-if="isLoading" class="result-state">지역 정보를 불러오는 중입니다...</p>
    <p v-else-if="loadError" class="result-state error-state">{{ loadError }}</p>

    <!-- 선택된 카테고리의 지역 정보 카드 리스트 -->
    <template v-else-if="items.length">
      <div class="items-list">
        <div
          v-for="item in items"
          :key="item.id"
          class="detail-card"
        >
          <div class="card-img-box">
            <img v-if="item.image" :src="item.image" :alt="item.name" class="card-img" @error="item.image = ''" />
            <div v-else class="card-img card-placeholder">{{ currentCategory.icon }}</div>
          </div>
          <div class="card-info">
            <h2>{{ item.name }}</h2>
            <p class="description">{{ item.description }}</p>
            <p class="content-type">{{ item.contentType }}</p>
          </div>
        </div>
      </div>

      <nav v-if="totalPages > 1" class="pagination" aria-label="지역 정보 페이지">
        <button type="button" :disabled="currentPage === 1" @click="goToPage(currentPage - 1)">이전</button>
        <button
          v-for="page in visiblePages"
          :key="page"
          type="button"
          class="page-button"
          :class="{ active: page === currentPage }"
          :aria-current="page === currentPage ? 'page' : undefined"
          @click="goToPage(page)"
        >
          {{ page }}
        </button>
        <button type="button" :disabled="currentPage === totalPages" @click="goToPage(currentPage + 1)">다음</button>
      </nav>
    </template>
    <p v-else class="result-state">표시할 {{ currentCategory.title }} 정보가 없습니다.</p>
  </div>
</template>

<script setup>
import { computed, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import apiClient from '@/utils/api';
import { normalizePlace, PLACE_CATEGORIES } from '@/utils/places';

const route = useRoute();
const router = useRouter();

// 현재 활성화된 탭 관리 ('tour', 'food', 'festival')
const activeTab = ref('tour');
const items = ref([]);
const isLoading = ref(false);
const loadError = ref('');
const currentPage = ref(1);
const totalItems = ref(0);
const pageSize = 12;
let latestRequestId = 0;

const currentCategory = computed(() => PLACE_CATEGORIES[activeTab.value] || PLACE_CATEGORIES.tour);
const totalPages = computed(() => Math.ceil(totalItems.value / pageSize));
const visiblePages = computed(() => {
  const start = Math.max(1, Math.min(currentPage.value - 2, totalPages.value - 4));
  const end = Math.min(totalPages.value, start + 4);
  return Array.from({ length: Math.max(0, end - start + 1) }, (_, index) => start + index);
});

const loadPlaces = async () => {
  const requestId = ++latestRequestId;
  isLoading.value = true;
  loadError.value = '';

  try {
    const contentType = currentCategory.value.contentType;
    const [listResponse, countResponse] = await Promise.all([
      apiClient.get('/places/', {
        params: { content_type: contentType, page: currentPage.value, limit: pageSize }
      }),
      apiClient.get('/places/count', {
        params: { content_type: contentType }
      })
    ]);

    if (requestId !== latestRequestId) {
      return;
    }
    totalItems.value = countResponse.data.total;
    items.value = listResponse.data.map(normalizePlace);
  } catch (error) {
    if (requestId !== latestRequestId) {
      return;
    }
    console.error(`${currentCategory.value.title} 정보 로드 실패:`, error);
    items.value = [];
    totalItems.value = 0;
    loadError.value = '지역 정보를 불러오지 못했습니다. 잠시 후 다시 시도해주세요.';
  } finally {
    if (requestId === latestRequestId) {
      isLoading.value = false;
    }
  }
};

const resetPaginationAndLoad = () => {
  if (currentPage.value === 1) {
    loadPlaces();
    return;
  }
  currentPage.value = 1;
};

const goToPage = (page) => {
  if (page < 1 || page > totalPages.value || page === currentPage.value) {
    return;
  }
  currentPage.value = page;
  window.scrollTo({ top: 0, behavior: 'smooth' });
};

// 진입 시 URL 파라미터가 있다면 해당 탭을 열어줌 (예: /category/food -> 맛집 탭 활성화)
const setTabFromRoute = () => {
  const categoryParam = route.params.name;
  if (categoryParam && PLACE_CATEGORIES[categoryParam]) {
    activeTab.value = categoryParam;
  }
};

setTabFromRoute();
watch(activeTab, resetPaginationAndLoad, { immediate: true });
watch(currentPage, loadPlaces);

// 페이지가 켜진 상태에서 라우터 파라미터가 바뀔 때를 감지
watch(() => route.params.name, () => {
  setTabFromRoute();
});

const goBack = () => {
  router.push('/');
};
</script>

<style scoped>
.category-detail-container {
  max-width: 860px;
  margin: 0 auto;
  padding: 32px 16px;
  display: flex;
  flex-direction: column;
  gap: 28px;
}

.detail-header {
  display: flex;
  flex-direction: column;
  gap: 12px;
  border-bottom: 2px solid #f1f5f9;
  padding-bottom: 20px;
}

.back-btn {
  align-self: flex-start;
  background: none;
  border: none;
  color: #4f46e5;
  font-weight: 600;
  cursor: pointer;
  padding: 0;
  font-size: 0.95rem;
}

.back-btn:hover {
  text-decoration: underline;
}

.title {
  margin: 0;
  font-size: 2rem;
  color: #0f172a;
}

.subtitle {
  margin: 0;
  color: #64748b;
  font-size: 1.05rem;
}

/* 탭 스타일 */
.tab-navigation {
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 16px;
  padding: 16px;
}

.tab-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
}

.tab-card {
  border: 1px solid #e2e8f0;
  background: #f8fafc;
  border-radius: 12px;
  padding: 14px 10px;
  text-align: center;
  cursor: pointer;
  font-weight: 600;
  color: #0f172a;
  font-size: 1rem;
  transition: all 0.2s ease;
}

.tab-card:hover,
.tab-card.active {
  border-color: #4f46e5;
  background: #eef2ff;
  color: #4f46e5;
}

/* 리스트 스타일 */
.items-list {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.detail-card {
  display: flex;
  gap: 24px;
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 16px;
  padding: 20px;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.detail-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.08);
}

.card-img-box {
  width: 220px;
  height: 150px;
  border-radius: 12px;
  overflow: hidden;
  flex-shrink: 0;
  border: 1px solid #e2e8f0;
}

.card-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.card-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  background: #e2e8f0;
  font-size: 3rem;
}

.card-info {
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.card-info h2 {
  margin: 0 0 12px 0;
  font-size: 1.35rem;
  color: #0f172a;
}

.description {
  margin: 0;
  color: #475569;
  line-height: 1.6;
  font-size: 0.98rem;
}

.content-type {
  margin: 10px 0 0;
  color: #4f46e5;
  font-size: 0.85rem;
  font-weight: 600;
}

.result-state {
  margin: 0;
  padding: 32px 16px;
  border: 1px solid #e2e8f0;
  border-radius: 16px;
  background: white;
  color: #64748b;
  text-align: center;
}

.error-state {
  color: #b91c1c;
}

.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
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

.pagination button:disabled {
  cursor: not-allowed;
  opacity: 0.45;
}

@media (max-width: 640px) {
  .tab-grid {
    grid-template-columns: 1fr;
  }
  .detail-card {
    flex-direction: column;
  }
  .card-img-box {
    width: 100%;
    height: 180px;
  }
}
</style>
