<!-- src/views/CategoryDetailView.vue -->
<template>
  <div class="category-detail-container">
    <!-- 상단 헤더 및 뒤로가기 -->
    <header class="detail-header">
      <button class="back-btn" @click="goBack">← 홈으로 돌아가기</button>
      <h1 class="title">대전/충청 대표 {{ currentCategoryData.title }} 전체 정보</h1>
      <p class="subtitle">LocalHub가 추천하는 지역 핫플레이스 상세 안내입니다.</p>
    </header>

    <!-- 3개 장소 정보 카드형 리스트 -->
    <div class="items-list">
      <div v-for="(item, index) in currentCategoryData.items" :key="index" class="detail-card">
        <div class="card-img-box">
          <img :src="item.image" :alt="item.name" class="card-img" />
        </div>
        <div class="card-info">
          <h2>{{ item.name }}</h2>
          <p class="description">{{ item.description }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';

const route = useRoute();
const router = useRouter();

// URL 파라미터에서 카테고리 명(tour, food, festival)을 가져옵니다.
const categoryParam = computed(() => route.params.name || 'tour');

// 홈 화면과 공유할 수 있는 데이터셋 구조
const categoryData = {
  tour: {
    title: '관광지',
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

const currentCategoryData = computed(() => {
  return categoryData[categoryParam.value] || categoryData.tour;
});

const goBack = () => {
  router.push('/');
};
</script>

<style scoped>
.category-detail-container {
  max-width: 800px;
  margin: 0 auto;
  padding: 24px 16px;
  display: flex;
  flex-direction: column;
  gap: 32px;
}

.detail-header {
  display: flex;
  flex-direction: column;
  gap: 12px;
  border-bottom: 1px solid #e2e8f0;
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
  font-size: 1.8rem;
  color: #0f172a;
}

.subtitle {
  margin: 0;
  color: #64748b;
  font-size: 1rem;
}

.items-list {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.detail-card {
  display: flex;
  gap: 24px;
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 16px;
  padding: 20px;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
}

.card-img-box {
  width: 240px;
  height: 160px;
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

.card-info {
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.card-info h2 {
  margin: 0 0 12px 0;
  font-size: 1.4rem;
  color: #0f172a;
}

.description {
  margin: 0;
  color: #475569;
  line-height: 1.7;
  font-size: 1rem;
}

@media (max-width: 640px) {
  .detail-card {
    flex-direction: column;
  }
  .card-img-box {
    width: 100%;
    height: 180px;
  }
}
</style>