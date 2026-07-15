<template>
  <div class="home-container">
    <section class="hero-card">
      <div>
        <p class="eyebrow">대전/충청 지역 정보 공유</p>
        <h1>지역 정보와 함께하는 <span class="brand">LocalHub</span></h1>
        <p>관광지, 맛집, 축제 일정까지 한눈에 확인하고 동네 사람들과 소통해보세요.</p>
      </div>
      <button class="primary-btn" @click="goToBoard('all')">게시판 바로가기</button>
    </section>

    <section class="categories">
      <h3>카테고리 바로가기</h3>
      <div class="category-grid">
        <button type="button" class="category-card" :class="{ active: selectedCategory === 'tour' }" @click.stop.prevent="selectCategory('tour')">🏞️ 관광지</button>
        <button type="button" class="category-card" :class="{ active: selectedCategory === 'food' }" @click.stop.prevent="selectCategory('food')">🍕 맛집</button>
        <button type="button" class="category-card" :class="{ active: selectedCategory === 'festival' }" @click.stop.prevent="selectCategory('festival')">🎉 축제·행사</button>
      </div>
    </section>

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
    spots: ['한빛탑', '장태산휴양림', '대청호']
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
    spots: ['성심당', '대전역 먹거리', '충주 성남시티']
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
    spots: ['엑스포다리', '보문산', '청남대']
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