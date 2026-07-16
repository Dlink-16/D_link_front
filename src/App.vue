<template>
  <div id="app">
    <header class="main-nav">
      <router-link to="/" class="brand">🌟 D.link</router-link>
      <nav class="nav-links">
        <router-link to="/" class="nav-link">홈</router-link>
        <!-- 💡 '정보' 메뉴 링크를 새롭게 추가했습니다 -->
        <router-link to="/category" class="nav-link">정보</router-link>
        <router-link to="/board" class="nav-link">게시판</router-link>
      </nav>
    </header>

    <main class="page-shell">
      <router-view />
    </main>

    <ChatBotWidget />
  </div>
</template>

<script setup>
import ChatBotWidget from '@/components/ChatBotWidget.vue';
</script>

<style scoped>
#app {
  min-height: 100vh;
  background: #f8fafc;
  color: #0f172a;
  font-family: 'Pretendard', 'Noto Sans KR', 'Segoe UI', sans-serif;
}

.main-nav {
  position: sticky;
  top: 0;
  z-index: 20;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 24px;
  background: #ffffff;
  border-bottom: 1px solid #e2e8f0;
  box-shadow: 0 1px 3px rgba(15, 23, 42, 0.06);
}

.brand {
  font-size: 1.3rem;
  font-weight: 800;
  color: #16a34a;
  text-decoration: none;
  letter-spacing: -0.02em;
  display: flex;
  align-items: center;
  gap: 4px;
  transition: color 0.2s;
}
.brand:hover {
  color: #15803d;
}

.nav-links {
  display: flex;
  gap: 8px;
}

.nav-link {
  padding: 8px 12px;
  border-radius: 999px;
  color: #334155;
  text-decoration: none;
  transition: background 0.2s ease, color 0.2s ease;
}

.nav-link:hover,
.nav-link.router-link-active {
  background: #dcfce7;
  color: #16a34a;
  font-weight: 600;
}

.page-shell {
  max-width: 1100px;
  margin: 0 auto;
  padding: 24px 20px 60px;
}

@media (max-width: 640px) {
  .main-nav {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
    padding: 14px 16px;
  }

  .nav-links {
    flex-wrap: wrap;
  }
}
</style>