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
        <button class="category-card" @click="goToBoard('tour')">🏞️ 관광지</button>
        <button class="category-card" @click="goToBoard('food')">🍕 맛집</button>
        <button class="category-card" @click="goToBoard('festival')">🎉 축제·행사</button>
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
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { getPosts, seedDefaultPosts } from '@/utils/posts';

const router = useRouter();
const recentPosts = ref([]);

const loadRecentPosts = () => {
  seedDefaultPosts();
  recentPosts.value = getPosts().slice(0, 3);
};

onMounted(loadRecentPosts);

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

.category-card:hover {
  border-color: #4f46e5;
  background: #eef2ff;
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

  .post-list li {
    flex-direction: column;
  }
}
</style>