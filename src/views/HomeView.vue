<template>
  <div class="home-container">
    <!-- 서비스 소개 배너 -->
    <section class="hero-card">
      <div>
        <p class="eyebrow">대전/충청 지역 정보 공유</p>
        <h1>지역 정보와 함께하는 <span class="brand">LocalHub</span></h1>
        <p>관광지, 맛집, 축제 일정까지 한눈에 확인하고 동네 사람들과 소통해보세요.</p>
      </div>
      <button class="primary-btn" @click="goToBoard('all')">게시판 바로가기</button>
    </section>

    <!-- 카테고리 바로가기 -->
    <section class="categories">
      <h3>카테고리 바로가기</h3>
      <div class="category-grid">
        <button type="button" class="category-card" :class="{ active: selectedCategory === 'tour' }" @click.stop.prevent="selectCategory('tour')">🏞️ 관광지</button>
        <button type="button" class="category-card" :class="{ active: selectedCategory === 'food' }" @click.stop.prevent="selectCategory('food')">🍕 맛집</button>
        <button type="button" class="category-card" :class="{ active: selectedCategory === 'festival' }" @click.stop.prevent="selectCategory('festival')">🎉 축제·행사</button>
      </div>
    </section>

    <!-- 📸 카테고리별 3개 이미지 그리드 및 상세 정보 섹션 -->
    <section class="category-gallery">
      <div class="gallery-header">
        <h3>대표 {{ categoryData[selectedCategory].title }} 미리보기 (클릭시 정보 확인)</h3>
        <!-- 클릭 시 새로운 상세 페이지로 이동합니다 -->
        <button class="view-all-btn" @click="goToCategoryDetail">전체 정보 보기 ↗</button>
      </div>
      
      <!-- 3개 이미지 띄우는 그리드 -->
      <div class="gallery-grid">
        <div 
          v-for="(item, index) in categoryData[selectedCategory].items" 
          :key="index"
          class="gallery-item-box"
          :class="{ active: selectedItemIndex === index }"
          @click="selectItem(index)"
        >
          <img :src="item.image" :alt="item.name" class="gallery-img" />
          <div class="gallery-img-overlay">
            <span>{{ item.name }}</span>
          </div>
        </div>
      </div>

      <!-- 클릭한 장소에 대한 정보 상세 안내창 -->
      <div class="gallery-info-panel">
        <p class="eyebrow">선택된 장소 정보</p>
        <h3>{{ categoryData[selectedCategory].items[selectedItemIndex].name }}</h3>
        <p class="gallery-desc">{{ categoryData[selectedCategory].items[selectedItemIndex].description }}</p>
      </div>
    </section>

    <!-- 실제 지도 및 추천 포인트 -->
    <section class="map-preview">
      <div class="map-preview-header">
        <div>
          <p class="eyebrow">실제 지도</p>
          <h3>{{ categoryData[selectedCategory].title }} 위치 안내</h3>
        </div>
      </div>

      <div class="map-card">
        <div ref="mapContainer" class="map-surface"></div>

        <div class="spot-list">
          <h4>{{ categoryData[selectedCategory].title }} 추천 포인트</h4>
          <ul>
            <li v-for="item in categoryData[selectedCategory].spots" :key="item">{{ item }}</li>
          </ul>
        </div>
      </div>
    </section>

    <!-- 최근 게시글 목록 -->
    <section class="recent-posts">
      <h3>최근 게시글</h3>
      <ul class="post-list">
        <li v-for="post in recentPosts" :key="post.id" @click="goToDetail(post.id)">
          <span class="post-title">{{ post.title }}</span>
          <span class="post-date">{{ post.created_at }}</span>
        </li>
      </ul>
    </section>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, watch } from 'vue';
import { useRouter } from 'vue-router';
import { getPosts, seedDefaultPosts } from '@/utils/posts';

const router = useRouter();
const recentPosts = ref([]);
const selectedCategory = ref('tour');
const selectedItemIndex = ref(0);

const mapContainer = ref(null);
let mapInstance = null;
let markerLayer = null;

const categoryData = {
  tour: {
    title: '관광지',
    center: [36.35, 127.38],
    zoom: 8,
    markers: [
      { name: '한빛탑', lat: 36.351, lng: 127.384 },
      { name: '장태산휴양림', lat: 36.292, lng: 127.339 },
      { name: '대청호', lat: 36.447, lng: 127.493 }
    ],
    spots: ['한빛탑', '장태산휴양림', '대청호'],
    items: [
      {
        name: '한빛탑',
        image: 'https://images.unsplash.com/photo-1542224566-6e85f2e6772f?q=80&w=400',
        description: '1993년 대전 엑스포를 기념하기 위해 세워진 상징탑으로, 현재는 멋진 야간 경관 조명과 대전 시내를 한눈에 볼 수 있는 전망대로 인기가 높습니다.'
      },
      {
        name: '장태산휴양림',
        image: 'https://images.unsplash.com/photo-1448375240586-882707db888b?q=80&w=400',
        description: '울창하게 뻗은 메타세쿼이아 숲길이 이국적인 풍경을 자아내는 자연휴양림입니다. 스카이웨이를 걸으며 숲의 공기를 한껏 들이마실 수 있습니다.'
      },
      {
        name: '대청호',
        image: 'https://images.unsplash.com/photo-1501785888041-af3ef285b470?q=80&w=400',
        description: '대전과 청주에 걸쳐 있는 드넓은 호수로, 호반을 따라 이어지는 드라이브 코스와 낭만적인 산책로(오백리길)가 연인들과 가족들에게 최고의 힐링을 선사합니다.'
      }
    ]
  },
  food: {
    title: '맛집',
    center: [36.34, 127.39],
    zoom: 8,
    markers: [
      { name: '성심당', lat: 36.325, lng: 127.390 },
      { name: '대전역 먹거리', lat: 36.330, lng: 127.431 },
      { name: '충주 성남시티', lat: 36.642, lng: 127.489 }
    ],
    spots: ['성심당', '대전역 먹거리', '충주 성남시티'],
    items: [
      {
        name: '성심당',
        image: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?q=80&w=400',
        description: '명실상부 대전을 대표하는 전국구 베이커리로 튀김소보로와 부추빵, 명란바게트가 시그니처입니다. 사계절 내내 방문객들의 발길이 끊이지 않습니다.'
      },
      {
        name: '대전역 먹거리',
        image: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?q=80&w=400',
        description: '대전역 인근에 모여 있는 전통 칼국수 골목과 가락국수 노포들로, 칼칼하고 진한 국물 맛이 일품이라 여행의 피로를 풀기에 완벽한 장소입니다.'
      },
      {
        name: '충주 성남시티 맛집',
        image: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?q=80&w=400',
        description: '신선한 로컬 식재료를 사용한 정갈한 한식 코스 요리와 현지 주민들이 주로 찾는 숨겨진 매운탕, 고기 구이 맛집들이 분포한 핫플레이스입니다.'
      }
    ]
  },
  festival: {
    title: '축제·행사',
    center: [36.42, 127.42],
    zoom: 8,
    markers: [
      { name: '엑스포다리', lat: 36.374, lng: 127.392 },
      { name: '보문산', lat: 36.294, lng: 127.318 },
      { name: '청남대', lat: 36.530, lng: 127.509 }
    ],
    spots: ['엑스포다리', '보문산', '청남대'],
    items: [
      {
        name: '엑스포다리 음악분수',
        image: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?q=80&w=400',
        description: '매년 따뜻한 계절 주말 야간마다 한빛탑 광장 앞 엑스포다리에서 화려한 조명, 신나는 음악과 함께 시원하게 뿜어져 나오는 달빛 분수 축제입니다.'
      },
      {
        name: '보문산 숲속 음악회',
        image: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?q=80&w=400',
        description: '푸른 자연 속 야외 음악당에서 펼쳐지는 클래식 및 대중음악 행사로, 산들바람과 함께 아름다운 선율을 즐길 수 있어 남녀노소 야외 힐링 공간이 됩니다.'
      },
      {
        name: '청남대 국화축제',
        image: 'https://images.unsplash.com/photo-1465847899084-d164df4dedc6?q=80&w=400',
        description: '대청호반의 대통령 전용 휴양지였던 청남대 산책로를 가득 채우는 가을 국화 축제입니다. 수만 송이 꽃과 분재들이 전시되어 장관을 이룹니다.'
      }
    ]
  }
};

const loadLeaflet = () => new Promise((resolve, reject) => {
  if (window.L) {
    resolve(window.L);
    return;
  }

  if (document.getElementById('leaflet-script')) {
    document.getElementById('leaflet-script').addEventListener('load', () => resolve(window.L), { once: true });
    document.getElementById('leaflet-script').addEventListener('error', reject, { once: true });
    return;
  }

  const style = document.createElement('link');
  style.id = 'leaflet-style';
  style.rel = 'stylesheet';
  style.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
  document.head.appendChild(style);

  const script = document.createElement('script');
  script.id = 'leaflet-script';
  script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
  script.onload = () => resolve(window.L);
  script.onerror = reject;
  document.head.appendChild(script);
});

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

  const currentCategory = categoryData[selectedCategory.value];
  mapInstance.setView(currentCategory.center, currentCategory.zoom);
  markerLayer.clearLayers();

  currentCategory.markers.forEach((marker) => {
    L.marker([marker.lat, marker.lng])
      .bindPopup(marker.name)
      .addTo(markerLayer);
  });
};

const selectCategory = (category) => {
  selectedCategory.value = category;
  selectedItemIndex.value = 0;
};

const selectItem = (index) => {
  selectedItemIndex.value = index;
};

// ↗ 신규 상세 페이지 이동 함수
const goToCategoryDetail = () => {
  router.push(`/category/${selectedCategory.value}`);
};

const loadRecentPosts = () => {
  seedDefaultPosts();
  recentPosts.value = getPosts().slice(0, 3);
};

onMounted(() => {
  loadRecentPosts();
  renderCategoryMap();
});

watch(selectedCategory, () => {
  renderCategoryMap();
});

onBeforeUnmount(() => {
  if (mapInstance) {
    mapInstance.remove();
    mapInstance = null;
    markerLayer = null;
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

.categories,
.recent-posts {
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 16px;
  padding: 20px;
}

.category-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 16px;
  margin-top: 12px;
}

.category-card {
  border: 1px solid #e2e8f0;
  background: #f8fafc;
  border-radius: 12px;
  padding: 18px 12px;
  text-align: center;
  cursor: pointer;
  font-weight: 600;
  color: #0f172a;
}

.category-card:hover,
.category-card.active {
  border-color: #4f46e5;
  background: #eef2ff;
  color: #4f46e5;
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
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 16px;
  padding: 20px;
}

.map-preview-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
}

.secondary-btn {
  border: 1px solid #cbd5e1;
  background: #f8fafc;
  color: #334155;
  padding: 8px 12px;
  border-radius: 999px;
  cursor: pointer;
}

.map-card {
  display: grid;
  grid-template-columns: 1.4fr 0.9fr;
  gap: 16px;
  align-items: stretch;
}

.map-surface {
  position: relative;
  min-height: 320px;
  border-radius: 16px;
  overflow: hidden;
  border: 1px solid #cbd5e1;
  background: #f8fafc;
}

.map-surface :deep(.leaflet-container) {
  width: 100%;
  height: 100%;
  min-height: 320px;
  background: #f8fafc;
}

.map-surface :deep(.leaflet-control-attribution) {
  font-size: 10px;
}

.spot-list {
  padding: 16px;
  background: #f8fafc;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
}

.spot-list h4 {
  margin: 0 0 10px;
  font-size: 1rem;
}

.spot-list ul {
  margin: 0;
  padding-left: 18px;
  color: #475569;
  line-height: 1.8;
}

.post-list {
  list-style: none;
  padding: 0;
  margin: 12px 0 0;
}

.post-list li {
  display: flex;
  justify-content: space-between;
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

  .category-grid {
    grid-template-columns: 1fr;
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

  .post-list li {
    flex-direction: column;
  }
}
</style>