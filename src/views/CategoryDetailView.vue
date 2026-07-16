<!-- src/views/CategoryDetailView.vue -->
<template>
  <div class="category-detail-container">
    <!-- 상단 헤더 및 뒤로가기 -->
    <header class="detail-header">
      <button class="back-btn" @click="goBack">← 홈으로 돌아가기</button>
      <h1 class="title">대전/충청 종합 지역 정보</h1>
      <p class="subtitle">카테고리를 선택하여 D.link가 추천하는 상세 정보를 확인해 보세요. 🌟</p>
    </header>

    <!-- ➡️ 탭 내비게이션 (가로 스크롤 슬라이더 구성) -->
    <section class="tab-navigation">
      <div class="tab-slider-wrapper">
        <!-- 왼쪽 이동 버튼 -->
        <button type="button" class="scroll-btn prev" @click="scrollTabs(-200)">
          &lt;
        </button>

        <!-- 스크롤 가능한 탭 컨테이너 -->
        <div ref="tabScrollContainer" class="tab-scroll-container">
          <button 
            v-for="(cat, key) in categoriesConfig" 
            :key="key"
            type="button" 
            class="tab-card" 
            :class="{ active: activeTab === key }" 
            @click="activeTab = key"
          >
            <span class="tab-icon">{{ cat.icon }}</span>
            <span class="tab-text">{{ cat.title }}</span>
          </button>
        </div>

        <!-- 오른쪽 이동 버튼 -->
        <button type="button" class="scroll-btn next" @click="scrollTabs(200)">
          &gt;
        </button>
      </div>
    </section>

    <section class="category-search" aria-label="카테고리 장소 검색">
      <input
        v-model="searchQuery"
        type="search"
        :placeholder="`${currentCategoryConfig.title} 이름 또는 주소 검색`"
        @keydown.enter.prevent="handleSearch"
      />
      <button type="button" class="search-button" @click="handleSearch">검색</button>
      <button type="button" class="reset-button" :disabled="!searchQuery && !appliedSearch" @click="clearSearch">초기화</button>
    </section>

    <p v-if="appliedSearch && !isLoading && !loadError" class="search-summary">
      ‘{{ appliedSearch }}’ 검색 결과 {{ totalItems }}건
    </p>

    <p v-if="isLoading" class="result-state">지역 정보를 불러오는 중입니다...</p>
    <p v-else-if="loadError" class="result-state error-state">{{ loadError }}</p>

    <!-- 선택된 카테고리의 지역 정보 카드 리스트 -->
    <template v-else-if="items.length">
      <div class="items-list">
        <div
          v-for="item in items"
          :key="item.id"
          class="detail-card"
          role="button"
          tabindex="0"
          :aria-label="`${item.name} 위치 지도 보기`"
          @click="openMapModal(item)"
          @keydown.enter.prevent="openMapModal(item)"
          @keydown.space.prevent="openMapModal(item)"
        >
          <div class="card-img-box">
            <img v-if="item.image" :src="item.image" :alt="item.name" class="card-img" @error="item.image = ''" />
            <div v-else class="card-img card-placeholder">{{ currentCategoryConfig.icon }}</div>
          </div>
          <div class="card-info">
            <h2>{{ item.name }}</h2>
            <p class="description">{{ item.description }}</p>
            <p class="content-type">{{ currentCategoryConfig.title }}</p>
            <p class="map-hint">
              {{ item.latitude !== null && item.longitude !== null ? '🗺️ 카드를 눌러 지도 보기' : '위치 정보 없음' }}
            </p>
          </div>
        </div>
      </div>

      <PaginationControls
        :current-page="currentPage"
        :total-pages="totalPages"
        aria-label="지역 정보 페이지"
        @change="goToPage"
      />
    </template>
    <p v-else class="result-state">표시할 {{ currentCategoryConfig.title }} 정보가 없습니다.</p>

    <div
      v-if="selectedMapItem"
      class="map-modal-overlay"
      role="presentation"
      @click.self="closeMapModal"
    >
      <section
        class="map-modal"
        role="dialog"
        aria-modal="true"
        :aria-label="`${selectedMapItem.name} 위치 지도`"
      >
        <header class="map-modal-header">
          <div>
            <p class="map-modal-category">{{ currentCategoryConfig.title }}</p>
            <h2>{{ selectedMapItem.name }}</h2>
          </div>
          <button type="button" class="map-modal-close" aria-label="지도 닫기" @click="closeMapModal">×</button>
        </header>
        <p class="map-modal-address">{{ selectedMapItem.address }}</p>
        <p v-if="mapError" class="map-modal-error">{{ mapError }}</p>
        <div v-show="!mapError" ref="modalMapContainer" class="modal-map"></div>
      </section>
    </div>
  </div>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import PaginationControls from '@/components/PaginationControls.vue';
import apiClient from '@/utils/api';
import { loadLeaflet } from '@/utils/leaflet';
import { normalizePlace, PLACE_CATEGORIES } from '@/utils/places';

const route = useRoute();
const router = useRouter();

// 현재 활성화된 탭 관리 (기본값: 'tour')
const activeTab = ref('tour');
const items = ref([]);
const isLoading = ref(false);
const loadError = ref('');
const searchQuery = ref('');
const appliedSearch = ref('');
const currentPage = ref(1);
const totalItems = ref(0);
const selectedMapItem = ref(null);
const modalMapContainer = ref(null);
const mapError = ref('');
const pageSize = 12;
let latestRequestId = 0;
let modalMapInstance = null;

// 가로 스크롤 컨테이너 ref
const tabScrollContainer = ref(null);

// 8개 카테고리 구성 설정 정보
const categoriesConfig = {
  tour: { title: '관광지', icon: '🏞️', contentType: PLACE_CATEGORIES?.tour?.contentType || '관광지' },
  culture: { title: '문화시설', icon: '🏛️', contentType: PLACE_CATEGORIES?.culture?.contentType || '문화시설' },
  festival: { title: '축제공연행사', icon: '🎉', contentType: PLACE_CATEGORIES?.festival?.contentType || '축제공연행사' },
  course: { title: '여행코스', icon: '🗺️', contentType: PLACE_CATEGORIES?.course?.contentType || '여행코스' },
  reports: { title: '레포츠', icon: '🏂', contentType: PLACE_CATEGORIES?.reports?.contentType || '레포츠' },
  accommodation: { title: '숙박', icon: '🏨', contentType: PLACE_CATEGORIES?.accommodation?.contentType || '숙박' },
  shopping: { title: '쇼핑', icon: '🛍️', contentType: PLACE_CATEGORIES?.shopping?.contentType || '쇼핑' },
  food: { title: '음식점', icon: '🍕', contentType: PLACE_CATEGORIES?.food?.contentType || '음식점' }
};

const currentCategoryConfig = computed(() => categoriesConfig[activeTab.value] || categoriesConfig.tour);
const totalPages = computed(() => Math.ceil(totalItems.value / pageSize));

// 가로 슬라이더 수동 스크롤 조작 함수
const scrollTabs = (offset) => {
  if (tabScrollContainer.value) {
    tabScrollContainer.value.scrollBy({
      left: offset,
      behavior: 'smooth'
    });
  }
};

// ➡️ 활성화된 탭으로 가로 스크롤을 자동으로 이동시키는 함수
const scrollToActiveTab = () => {
  nextTick(() => {
    if (tabScrollContainer.value) {
      // 활성화 상태를 가진 요소를 찾습니다.
      const activeEl = tabScrollContainer.value.querySelector('.tab-card.active');
      if (activeEl) {
        // 부드럽게 화면의 가로 가운데(inline: 'center') 정렬해 줍니다.
        activeEl.scrollIntoView({
          behavior: 'smooth',
          block: 'nearest',
          inline: 'center'
        });
      }
    }
  });
};

const loadPlaces = async () => {
  const requestId = ++latestRequestId;
  isLoading.value = true;
  loadError.value = '';

  try {
    const contentType = currentCategoryConfig.value.contentType;
    const [listResponse, countResponse] = await Promise.all([
      apiClient.get('/places/', {
        params: {
          content_type: contentType,
          search: appliedSearch.value || undefined,
          page: currentPage.value,
          limit: pageSize
        }
      }),
      apiClient.get('/places/count', {
        params: { content_type: contentType, search: appliedSearch.value || undefined }
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
    console.error(`${currentCategoryConfig.value.title} 정보 로드 실패:`, error);
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

const handleSearch = () => {
  const keyword = searchQuery.value.trim();
  if (keyword === appliedSearch.value) {
    return;
  }
  appliedSearch.value = keyword;
  resetPaginationAndLoad();
};

const clearSearch = () => {
  if (!searchQuery.value && !appliedSearch.value) {
    return;
  }
  searchQuery.value = '';
  appliedSearch.value = '';
  resetPaginationAndLoad();
};

const destroyModalMap = () => {
  if (modalMapInstance) {
    modalMapInstance.remove();
    modalMapInstance = null;
  }
};

const closeMapModal = () => {
  destroyModalMap();
  selectedMapItem.value = null;
  mapError.value = '';
};

const openMapModal = async (item) => {
  if (item.latitude === null || item.longitude === null) {
    alert('이 장소는 등록된 위치 정보가 없습니다.');
    return;
  }

  selectedMapItem.value = item;
  mapError.value = '';
  await nextTick();

  try {
    const L = await loadLeaflet();
    if (selectedMapItem.value?.id !== item.id || !modalMapContainer.value) {
      return;
    }

    destroyModalMap();
    modalMapInstance = L.map(modalMapContainer.value, {
      zoomControl: true,
      scrollWheelZoom: true,
      attributionControl: false
    }).setView([item.latitude, item.longitude], 16);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      subdomains: ['a', 'b', 'c']
    }).addTo(modalMapInstance);

    const popupContent = document.createElement('strong');
    popupContent.textContent = item.name;
    L.marker([item.latitude, item.longitude])
      .addTo(modalMapInstance)
      .bindPopup(popupContent)
      .openPopup();

    requestAnimationFrame(() => modalMapInstance?.invalidateSize());
  } catch (error) {
    console.error(`${item.name} 지도 로드 실패:`, error);
    mapError.value = '지도를 불러오지 못했습니다. 잠시 후 다시 시도해주세요.';
  }
};

const handleEscape = (event) => {
  if (event.key === 'Escape' && selectedMapItem.value) {
    closeMapModal();
  }
};

// 진입 시 URL 파라미터가 있다면 해당 탭을 열어줌 (예: /category/reports -> 레포츠 활성화)
const setTabFromRoute = () => {
  const categoryParam = route.params.name;
  if (categoryParam && categoriesConfig[categoryParam]) {
    activeTab.value = categoryParam;
    // URL 매칭으로 탭 설정 시 스크롤 실행
    scrollToActiveTab();
  }
};

setTabFromRoute();

// activeTab이 바뀔 때 마다 데이터를 가져오고 스크롤 이동을 처리합니다.
watch(activeTab, () => {
  resetPaginationAndLoad();
  scrollToActiveTab();
}, { immediate: true });

watch(currentPage, loadPlaces);

// 페이지가 켜진 상태에서 라우터 파라미터가 바뀔 때를 감지
watch(() => route.params.name, () => {
  setTabFromRoute();
});

onMounted(() => window.addEventListener('keydown', handleEscape));
onBeforeUnmount(() => {
  window.removeEventListener('keydown', handleEscape);
  destroyModalMap();
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

/* ➡️ 탭 슬라이더 레이아웃 스타일 */
.tab-navigation {
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 16px;
  padding: 16px;
}

.tab-slider-wrapper {
  position: relative;
  display: flex;
  align-items: center;
  gap: 8px;
}

.tab-scroll-container {
  display: flex;
  gap: 12px;
  overflow-x: auto;
  scroll-behavior: smooth;
  /* 가로 스크롤바 숨기기 */
  -ms-overflow-style: none;
  scrollbar-width: none;
  padding: 4px;
  width: 100%;
}

.tab-scroll-container::-webkit-scrollbar {
  display: none;
}

.tab-card {
  flex: 0 0 auto;
  min-width: 130px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  border: 1px solid #e2e8f0;
  background: #f8fafc;
  border-radius: 12px;
  padding: 14px 10px;
  text-align: center;
  cursor: pointer;
  font-weight: 600;
  color: #0f172a;
  transition: all 0.2s ease;
  /* 정렬될 때 양 옆으로 보기 좋은 공백 확보 */
  scroll-margin-inline: 20px;
}

.tab-icon {
  font-size: 1.4rem;
}

.tab-text {
  font-size: 0.9rem;
  white-space: nowrap;
}

.tab-card:hover,
.tab-card.active {
  border-color: #4f46e5;
  background: #eef2ff;
  color: #4f46e5;
}

/* 스크롤 버튼 스타일 */
.scroll-btn {
  flex: 0 0 auto;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  border: 1px solid #e2e8f0;
  background: white;
  color: #334155;
  font-weight: bold;
  font-size: 1.1rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  transition: all 0.2s ease;
  user-select: none;
}

.scroll-btn:hover {
  background: #f1f5f9;
  border-color: #cbd5e1;
  color: #0f172a;
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
  cursor: pointer;
}

.category-search {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 16px;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  background: white;
}

.category-search input {
  min-width: 0;
  flex: 1;
  padding: 10px 12px;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  color: #0f172a;
  font-size: 0.95rem;
}

.category-search input:focus {
  border-color: #4f46e5;
  outline: 2px solid #e0e7ff;
}

.category-search button {
  padding: 10px 16px;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
}

.search-button {
  border: 1px solid #4f46e5;
  background: #4f46e5;
  color: white;
}

.reset-button {
  border: 1px solid #cbd5e1;
  background: #f8fafc;
  color: #475569;
}

.reset-button:disabled {
  cursor: not-allowed;
  opacity: 0.45;
}

.search-summary {
  margin: -16px 0 0;
  color: #64748b;
  font-size: 0.9rem;
  text-align: right;
}

.detail-card:hover,
.detail-card:focus-visible {
  transform: translateY(-2px);
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.08);
  outline: 2px solid #4f46e5;
  outline-offset: 2px;
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

.map-hint {
  margin: 8px 0 0;
  color: #64748b;
  font-size: 0.82rem;
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

.map-modal-overlay {
  position: fixed;
  inset: 0;
  z-index: 2000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  background: rgba(15, 23, 42, 0.68);
}

.map-modal {
  width: min(720px, 100%);
  max-height: calc(100vh - 40px);
  overflow-y: auto;
  padding: 20px;
  border-radius: 16px;
  background: white;
  box-shadow: 0 24px 60px rgba(15, 23, 42, 0.3);
}

.map-modal-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
}

.map-modal-header h2 {
  margin: 2px 0 0;
  color: #0f172a;
  font-size: 1.4rem;
}

.map-modal-category {
  margin: 0;
  color: #4f46e5;
  font-size: 0.82rem;
  font-weight: 700;
}

.map-modal-close {
  width: 36px;
  height: 36px;
  border: 0;
  border-radius: 50%;
  background: #f1f5f9;
  color: #334155;
  cursor: pointer;
  font-size: 1.5rem;
  line-height: 1;
}

.map-modal-address {
  margin: 10px 0 14px;
  color: #64748b;
}

.map-modal-error {
  padding: 48px 16px;
  border-radius: 12px;
  background: #fef2f2;
  color: #b91c1c;
  text-align: center;
}

.modal-map {
  width: 100%;
  height: 420px;
  overflow: hidden;
  border: 1px solid #cbd5e1;
  border-radius: 12px;
  background: #f8fafc;
}

@media (max-width: 640px) {
  .category-search {
    flex-wrap: wrap;
  }
  .category-search input {
    flex-basis: 100%;
  }
  .category-search button {
    flex: 1;
  }
  .detail-card {
    flex-direction: column;
  }
  .card-img-box {
    width: 100%;
    height: 180px;
  }
  .map-modal-overlay {
    padding: 12px;
  }
  .map-modal {
    padding: 16px;
  }
  .modal-map {
    height: 320px;
  }
}
</style>
