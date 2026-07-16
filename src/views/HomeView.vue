<template>
  <div class="home-container">
    <!-- 서비스 소개 배너 -->
    <section class="hero-card">
      <div>
        <p class="eyebrow">🌟 대전/충청 지역 정보 공유</p>
        <h1>대전/충청을 잇다, <span class="brand">D.link</span></h1>
        <p>관광지, 맛집, 축제 일정까지 한눈에 확인하고 동네 사람들과 소통해보세요.</p>
      </div>
      <button class="primary-btn" @click="goToBoard('all')">게시판 바로가기</button>
    </section>

    <!-- ➡️ 카테고리 바로가기 (좌우 화살표 스크롤) -->
    <section class="categories">
      <h3>카테고리 바로가기</h3>
      <div class="category-slider-wrapper">
        <!-- 왼쪽 이동 버튼 -->
        <button type="button" class="scroll-btn prev" @click="scrollCategories(-200)">
          &lt;
        </button>
        
        <!-- 스크롤 가능한 카테고리 영역 -->
        <div ref="categoryScrollContainer" class="category-scroll-container">
          <button 
            v-for="(cat, key) in categoryData" 
            :key="key"
            type="button" 
            class="category-card" 
            :class="{ active: selectedCategory === key }" 
            @click.stop.prevent="selectCategory(key)"
          >
            <span class="category-icon">{{ cat.icon }}</span>
            <span class="category-text">{{ cat.title }}</span>
          </button>
        </div>

        <!-- 오른쪽 이동 버튼 -->
        <button type="button" class="scroll-btn next" @click="scrollCategories(200)">
          &gt;
        </button>
      </div>
    </section>

    <!-- 📸 카테고리별 3개 이미지 그리드 및 상세 정보 섹션 -->
    <section class="category-gallery">
      <div class="gallery-header">
        <h3>대표 {{ currentCategory.title }} 미리보기 (클릭시 정보 확인)</h3>
        <button class="view-all-btn" @click="goToCategoryDetail">전체 정보 보기 ↗</button>
      </div>
      
      <p v-if="isCategoryLoading" class="gallery-state">지역 정보를 불러오는 중입니다...</p>
      <div v-else-if="currentCategory.items && currentCategory.items.length" class="gallery-grid">
        <div 
          v-for="(item, index) in currentCategory.items"
          :key="item.id"
          class="gallery-item-box"
          :class="{ active: selectedItemIndex === index }"
          @click="selectItem(index)"
        >
          <img v-if="item.image" :src="item.image" :alt="item.name" class="gallery-img" @error="item.image = ''" />
          <div v-else class="gallery-img gallery-placeholder">{{ currentCategory.icon }}</div>
          <div class="gallery-img-overlay">
            <span>{{ item.name }}</span>
          </div>
        </div>
      </div>
      <p v-else class="gallery-state error-state">{{ categoryError || '표시할 지역 정보가 없습니다.' }}</p>

      <!-- 클릭한 장소에 대한 정보 상세 안내창 -->
      <div v-if="selectedItem" class="gallery-info-panel">
        <p class="eyebrow">선택된 장소 정보</p>
        <h3>{{ selectedItem.name }}</h3>
        <p class="gallery-desc">{{ selectedItem.description }}</p>
      </div>
    </section>

    <!-- 실제 지도 및 추천 포인트 -->
    <section class="map-preview">
      <div class="map-preview-header">
        <div class="map-heading">
          <p class="map-kicker"><span class="live-dot"></span> LIVE LOCAL MAP</p>
          <h3>{{ currentCategory.title }} 위치 안내</h3>
          <p class="map-subtitle">추천 장소의 위치를 지도에서 한눈에 살펴보세요.</p>
        </div>
        <span class="map-count-badge">{{ currentCategory.markers.length }}곳 표시 중</span>
      </div>

      <div class="map-card">
        <div class="map-panel">
          <div class="map-toolbar">
            <span>📍 대전·충청권</span>
            <span class="map-toolbar-guide">마커를 눌러 장소명을 확인하세요</span>
          </div>
          <div ref="mapContainer" class="map-surface"></div>
        </div>

        <aside class="spot-list">
          <div class="spot-list-header">
            <div>
              <p>CURATED PLACES</p>
              <h4>{{ currentCategory.title }} 추천 포인트</h4>
            </div>
            <span>{{ currentCategory.items.length }}</span>
          </div>
          <div v-if="currentCategory.items && currentCategory.items.length" class="spot-items">
            <button
              v-for="(item, index) in currentCategory.items"
              :key="item.id"
              type="button"
              class="spot-item"
              :class="{ active: selectedItem?.id === item.id }"
              :disabled="item.latitude === null || item.longitude === null"
              @click="focusMapItem(item, index)"
            >
              <span class="spot-number">{{ String(index + 1).padStart(2, '0') }}</span>
              <span class="spot-name">{{ item.name }}</span>
              <span class="spot-arrow">→</span>
            </button>
          </div>
          <p v-else class="gallery-state">위치 정보가 없습니다.</p>
          <p class="spot-guide">장소를 선택하면 지도 중심이 해당 위치로 이동합니다.</p>
        </aside>
      </div>
    </section>

    <!-- 최근 게시글 목록 -->
    <section class="recent-posts">
      <h3>최근 게시글</h3>
      <ul class="post-list">
        <li v-for="post in recentPosts" :key="post.id" @click="goToDetail(post.id)">
          <div class="post-left">
            <!-- 🏷️ 게시글별 카테고리 태그 추가 (파란색 테그 스타일) -->
            <span v-if="post.category" class="post-category-tag">
              {{ post.category }}
            </span>
            <span class="post-title">{{ post.title }}</span>
          </div>
          <span class="post-date">{{ post.created_at }}</span>
        </li>
      </ul>
    </section>
  </div>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import apiClient from '@/utils/api';
import { loadLeaflet } from '@/utils/leaflet';
import { normalizePlace, PLACE_CATEGORIES, selectRepresentativePlaces } from '@/utils/places';

const router = useRouter();
const recentPosts = ref([]);
const selectedCategory = ref('tour'); // 기본값: 관광지
const selectedItemIndex = ref(0);
const isCategoryLoading = ref(false);
const categoryError = ref('');

const mapContainer = ref(null);
let mapInstance = null;
let markerLayer = null;
const mapMarkers = new Map();

// 좌우 스크롤 컨테이너 ref
const categoryScrollContainer = ref(null);

// 8개 카테고리 데이터 바인딩 (아이콘 및 기획 구성에 맞춰 설정)
const categoryData = reactive({
  tour: {
    title: '관광지',
    icon: '🏞️',
    contentType: PLACE_CATEGORIES?.tour?.contentType || '관광지',
    center: [36.35, 127.38],
    zoom: 8,
    markers: [],
    spots: [],
    items: []
  },
  culture: {
    title: '문화시설',
    icon: '🏛️',
    contentType: PLACE_CATEGORIES?.culture?.contentType || '문화시설',
    center: [36.35, 127.38],
    zoom: 8,
    markers: [],
    spots: [],
    items: []
  },
  festival: {
    title: '축제공연행사',
    icon: '🎉',
    contentType: PLACE_CATEGORIES?.festival?.contentType || '축제공연행사',
    center: [36.42, 127.42],
    zoom: 8,
    markers: [],
    spots: [],
    items: []
  },
  course: {
    title: '여행코스',
    icon: '🗺️',
    contentType: PLACE_CATEGORIES?.course?.contentType || '여행코스',
    center: [36.35, 127.38],
    zoom: 8,
    markers: [],
    spots: [],
    items: []
  },
  reports: {
    title: '레포츠',
    icon: '🏂',
    contentType: PLACE_CATEGORIES?.reports?.contentType || '레포츠',
    center: [36.35, 127.38],
    zoom: 8,
    markers: [],
    spots: [],
    items: []
  },
  accommodation: {
    title: '숙박',
    icon: '🏨',
    contentType: PLACE_CATEGORIES?.accommodation?.contentType || '숙박',
    center: [36.35, 127.38],
    zoom: 8,
    markers: [],
    spots: [],
    items: []
  },
  shopping: {
    title: '쇼핑',
    icon: '🛍️',
    contentType: PLACE_CATEGORIES?.shopping?.contentType || '쇼핑',
    center: [36.35, 127.38],
    zoom: 8,
    markers: [],
    spots: [],
    items: []
  },
  food: {
    title: '음식점',
    icon: '🍕',
    contentType: PLACE_CATEGORIES?.food?.contentType || '음식점',
    center: [36.34, 127.39],
    zoom: 8,
    markers: [],
    spots: [],
    items: []
  }
});

const currentCategory = computed(() => categoryData[selectedCategory.value]);
const selectedItem = computed(() => currentCategory.value.items[selectedItemIndex.value] || null);
const loadedCategories = new Set();

// 가로 스크롤 이동 함수
const scrollCategories = (offset) => {
  if (categoryScrollContainer.value) {
    categoryScrollContainer.value.scrollBy({
      left: offset,
      behavior: 'smooth'
    });
  }
};

const loadCategoryPlaces = async (categoryKey) => {
  if (loadedCategories.has(categoryKey)) {
    return;
  }

  const targetCategory = categoryData[categoryKey];
  isCategoryLoading.value = true;
  categoryError.value = '';

  try {
    const { data } = await apiClient.get('/places/', {
      params: { content_type: targetCategory.contentType, random: true, page: 1, limit: 20 }
    });
    const places = selectRepresentativePlaces(data.map(normalizePlace));

    targetCategory.items = places;
    targetCategory.markers = places
      .filter((place) => place.latitude !== null && place.longitude !== null)
      .map((place) => ({ id: place.id, name: place.name, lat: place.latitude, lng: place.longitude }));
    targetCategory.spots = places.map((place) => place.name);
    loadedCategories.add(categoryKey);
  } catch (error) {
    console.error(`${targetCategory.title} 정보 로드 실패:`, error);
    categoryError.value = '지역 정보를 불러오지 못했습니다. 잠시 후 다시 시도해주세요.';
  } finally {
    isCategoryLoading.value = false;
  }
};

const renderCategoryMap = async () => {
  if (!mapContainer.value) {
    return;
  }

  const L = await loadLeaflet();

  if (!mapInstance) {
    mapInstance = L.map(mapContainer.value, {
      zoomControl: true,
      scrollWheelZoom: true,
      attributionControl: false
    });

    markerLayer = L.layerGroup().addTo(mapInstance);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      subdomains: ['a', 'b', 'c']
    }).addTo(mapInstance);
  }

  const targetCategory = currentCategory.value;
  mapInstance.setView(targetCategory.center, targetCategory.zoom);
  markerLayer.clearLayers();
  mapMarkers.clear();

  if (targetCategory.markers) {
    targetCategory.markers.forEach((marker) => {
      const popupContent = document.createElement('strong');
      popupContent.textContent = marker.name;
      const leafletMarker = L.marker([marker.lat, marker.lng])
        .bindPopup(popupContent)
        .addTo(markerLayer);
      mapMarkers.set(marker.id, leafletMarker);
    });
  }
};

const selectCategory = (category) => {
  selectedCategory.value = category;
  selectedItemIndex.value = 0;
};

const selectItem = (index) => {
  selectedItemIndex.value = index;

  const item = currentCategory.value.items[index];
  if (!mapInstance || !item || item.latitude === null || item.longitude === null) {
    return;
  }

  mapInstance.flyTo([item.latitude, item.longitude], 15, { duration: 0.8 });
  mapMarkers.get(item.id)?.openPopup();
};

const focusMapItem = (_item, index) => {
  selectItem(index);
};

const goToCategoryDetail = () => {
  router.push(`/category/${selectedCategory.value}`);
};

const loadRecentPosts = async () => {
  try {
    const { data } = await apiClient.get('/posts/');
    recentPosts.value = data.slice(0, 3);
  } catch (error) {
    console.error('최근 게시글 로드 실패:', error);
    recentPosts.value = [];
  }
};

onMounted(async () => {
  loadRecentPosts();
  await loadCategoryPlaces(selectedCategory.value);
  await nextTick();
  renderCategoryMap();
});

watch(selectedCategory, async (category) => {
  selectedItemIndex.value = 0;
  await loadCategoryPlaces(category);
  await nextTick();
  renderCategoryMap();
});

onBeforeUnmount(() => {
  if (mapInstance) {
    mapInstance.remove();
    mapInstance = null;
    markerLayer = null;
    mapMarkers.clear();
  }
});

const goToBoard = (category) => {
  router.push({ path: '/board', query: { category } });
};

const goToDetail = (id) => {
  router.push(`/board/${id}`);
};
</script>

<style scoped>
.home-container {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.hero-card {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 20px;
  padding: 28px;
  background: linear-gradient(135deg, #eef2ff 0%, #f8fafc 100%);
  border: 1px solid #e2e8f0;
  border-radius: 16px;
}

.eyebrow {
  margin: 0 0 8px;
  color: #4f46e5;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  font-size: 0.8rem;
}

.hero-card h1 {
  margin: 0 0 8px;
  font-size: 1.6rem;
}

.hero-card p {
  margin: 0;
  color: #475569;
  line-height: 1.6;
}

.brand {
  color: #4f46e5;
}

.primary-btn {
  border: none;
  padding: 10px 16px;
  border-radius: 999px;
  background: #4f46e5;
  color: white;
  cursor: pointer;
  font-weight: 600;
  white-space: nowrap;
}

.categories {
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 16px;
  padding: 20px;
}

/* ➡️ 슬라이더 레이아웃 스타일 */
.category-slider-wrapper {
  position: relative;
  display: flex;
  align-items: center;
  margin-top: 12px;
  gap: 8px;
}

.category-scroll-container {
  display: flex;
  gap: 12px;
  overflow-x: auto;
  scroll-behavior: smooth;
  /* 가로 스크롤바 숨기기 (선택사항, 깔끔한 룩 제공) */
  -ms-overflow-style: none;  /* IE and Edge */
  scrollbar-width: none;  /* Firefox */
  padding: 4px;
  width: 100%;
}

.category-scroll-container::-webkit-scrollbar {
  display: none; /* Chrome, Safari, Opera */
}

.category-card {
  flex: 0 0 auto; /* 자식 요소 크기 고정 */
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
}

.category-icon {
  font-size: 1.4rem;
}

.category-text {
  font-size: 0.9rem;
  white-space: nowrap;
}

.category-card:hover,
.category-card.active {
  border-color: #4f46e5;
  background: #eef2ff;
  color: #4f46e5;
}

/* 스크롤 제어 버튼 */
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

.recent-posts {
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 16px;
  padding: 20px;
}

/* 📸 3개 이미지 갤러리 및 헤더 스타일 */
.category-gallery {
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 16px;
  padding: 20px;
}

.gallery-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
}

.gallery-header h3 {
  margin: 0;
}

/* 전체보기 우측 상단 버튼 */
.view-all-btn {
  background: #f1f5f9;
  border: 1px solid #cbd5e1;
  color: #4f46e5;
  padding: 6px 12px;
  border-radius: 8px;
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.view-all-btn:hover {
  background: #eef2ff;
  border-color: #4f46e5;
}

.gallery-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
  margin-bottom: 20px;
}

.gallery-item-box {
  position: relative;
  height: 160px;
  border-radius: 12px;
  overflow: hidden;
  border: 2px solid transparent;
  background: #f8fafc;
  cursor: pointer;
  transition: all 0.2s ease;
}

.gallery-item-box:hover {
  transform: translateY(-3px);
}

.gallery-item-box.active {
  border-color: #4f46e5;
  box-shadow: 0 4px 12px rgba(79, 70, 229, 0.2);
}

.gallery-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.gallery-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  background: #e2e8f0;
  font-size: 2.5rem;
}

.gallery-state {
  margin: 12px 0;
  color: #64748b;
  text-align: center;
}

.error-state {
  color: #b91c1c;
}

.gallery-img-overlay {
  position: absolute;
  bottom: 0; left: 0; right: 0;
  background: linear-gradient(transparent, rgba(0, 0, 0, 0.7));
  color: white;
  padding: 10px;
  font-size: 0.9rem;
  font-weight: bold;
  text-align: center;
}

.gallery-info-panel {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 20px;
}

.gallery-info-panel h3 {
  margin: 0 0 8px 0;
  font-size: 1.3rem;
  color: #0f172a;
}

.gallery-desc {
  margin: 0;
  color: #475569;
  line-height: 1.6;
  font-size: 0.95rem;
}

.map-preview {
  position: relative;
  overflow: hidden;
  padding: 24px;
  border: 1px solid #e2e8f0;
  border-radius: 16px;
  background: white;
  box-shadow: 0 8px 24px rgba(15, 23, 42, 0.06);
}

.map-preview-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  gap: 20px;
  margin-bottom: 20px;
}

.map-heading h3 {
  margin: 8px 0 5px;
  color: #0f172a;
  font-size: 1.45rem;
}

.map-kicker {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  margin: 0;
  color: #4f46e5;
  font-size: 0.75rem;
  font-weight: 800;
  letter-spacing: 0.11em;
}

.live-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #4f46e5;
  box-shadow: 0 0 0 5px rgba(79, 70, 229, 0.12);
}

.map-subtitle {
  margin: 0;
  color: #64748b;
  font-size: 0.92rem;
}

.map-count-badge {
  flex: 0 0 auto;
  padding: 7px 12px;
  border: 1px solid #c7d2fe;
  border-radius: 999px;
  background: rgba(238, 242, 255, 0.9);
  color: #4f46e5;
  font-size: 0.82rem;
  font-weight: 700;
}

.map-card {
  display: grid;
  grid-template-columns: minmax(0, 1.55fr) minmax(260px, 0.75fr);
  gap: 0;
  align-items: stretch;
  overflow: hidden;
  border: 1px solid #e2e8f0;
  border-radius: 16px;
  background: white;
  box-shadow: 0 4px 12px rgba(15, 23, 42, 0.05);
}

.map-panel {
  min-width: 0;
  padding: 12px;
  background: #fff;
}

.map-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  min-height: 34px;
  padding: 0 4px 9px;
  color: #334155;
  font-size: 0.8rem;
  font-weight: 700;
}

.map-toolbar-guide {
  color: #94a3b8;
  font-weight: 500;
}

.map-surface {
  position: relative;
  min-height: 390px;
  border-radius: 14px;
  overflow: hidden;
  border: 1px solid #e2e8f0;
  background: #f8fafc;
}

.map-surface :deep(.leaflet-container) {
  width: 100%;
  height: 100%;
  min-height: 390px;
  background: #f8fafc;
}

.map-surface :deep(.leaflet-control-attribution) {
  font-size: 10px;
}

.spot-list {
  display: flex;
  flex-direction: column;
  min-width: 0;
  padding: 22px;
  border-left: 1px solid #e2e8f0;
  background: linear-gradient(155deg, #f8fafc 0%, #f5f3ff 100%);
  color: #0f172a;
}

.spot-list-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 18px;
}

.spot-list-header p {
  margin: 0;
  color: #4f46e5;
  font-size: 0.68rem;
  font-weight: 800;
  letter-spacing: 0.1em;
}

.spot-list h4 {
  margin: 4px 0 0;
  font-size: 1.05rem;
}

.spot-list-header > span {
  display: grid;
  width: 34px;
  height: 34px;
  place-items: center;
  border: 1px solid #c7d2fe;
  border-radius: 50%;
  background: #eef2ff;
  color: #4f46e5;
  font-size: 0.82rem;
  font-weight: 800;
}

.spot-items {
  display: flex;
  flex-direction: column;
  gap: 9px;
}

.spot-item {
  display: grid;
  grid-template-columns: 34px minmax(0, 1fr) 20px;
  align-items: center;
  gap: 10px;
  width: 100%;
  padding: 11px;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.9);
  color: #334155;
  cursor: pointer;
  text-align: left;
  transition: border-color 0.2s ease, background 0.2s ease, transform 0.2s ease;
}

.spot-item:hover:not(:disabled),
.spot-item.active {
  border-color: #818cf8;
  background: #eef2ff;
  color: #4f46e5;
  transform: translateX(3px);
}

.spot-item:disabled {
  cursor: not-allowed;
  opacity: 0.45;
}

.spot-number {
  display: grid;
  width: 32px;
  height: 32px;
  place-items: center;
  border-radius: 9px;
  background: #eef2ff;
  color: #4f46e5;
  font-size: 0.72rem;
  font-weight: 800;
}

.spot-name {
  overflow: hidden;
  font-size: 0.86rem;
  font-weight: 650;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.spot-arrow {
  color: #6366f1;
  font-size: 1rem;
}

.spot-guide {
  margin: auto 0 0;
  padding-top: 18px;
  color: #64748b;
  font-size: 0.72rem;
  line-height: 1.5;
}

.post-list {
  list-style: none;
  padding: 0;
  margin: 12px 0 0;
}

.post-list li {
  display: flex;
  justify-content: space-between;
  align-items: center; /* 한 행의 높이를 고르게 정렬 */
  gap: 12px;
  padding: 12px 0;
  border-bottom: 1px solid #e2e8f0;
  cursor: pointer;
}

.post-list li:last-child {
  border-bottom: none;
}

.post-list li:hover {
  background: #f8fafc;
}

/* 🏷️ 최근 게시글 카테고리 정렬 영역 */
.post-left {
  display: flex;
  align-items: center;
  gap: 10px;
}

/* 🏷️ 최근 게시글 카테고리 태그 스타일 (파란색) */
.post-category-tag {
  display: inline-block;
  background-color: #eef2ff;
  color: #4f46e5;
  font-size: 0.75rem;
  font-weight: 600;
  padding: 2px 8px;
  border-radius: 10px;
  border: 1px solid #e0e7ff;
  white-space: nowrap;
}

.post-title {
  font-weight: 600;
}

.post-date {
  color: #94a3b8;
  font-size: 14px;
  white-space: nowrap;
}

@media (max-width: 640px) {
  .hero-card {
    flex-direction: column;
    align-items: flex-start;
  }

  .gallery-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }

  .view-all-btn {
    align-self: flex-start;
  }

  .gallery-grid {
    grid-template-columns: 1fr;
  }
  
  .gallery-item-box {
    height: 140px;
  }

  .map-preview-header {
    flex-direction: column;
    align-items: flex-start;
  }

  .map-card {
    grid-template-columns: 1fr;
  }

  .spot-list {
    border-top: 1px solid #e2e8f0;
    border-left: 0;
  }

  .map-toolbar-guide {
    display: none;
  }

  .map-surface,
  .map-surface :deep(.leaflet-container) {
    min-height: 320px;
  }

  .spot-guide {
    margin-top: 4px;
  }

  .post-list li {
    flex-direction: column;
    align-items: flex-start;
    gap: 6px;
  }
}
</style>
