<template>
  <div class="home-view">
    <header class="hero">
      <h1>지역 특화 웹 서비스에 오신 것을 환영합니다!</h1>
      <p>지역 관광지, 맛집, 그리고 커뮤니티를 한 곳에서 즐겨보세요.</p>
    </header>
    <section class="features">
      <div class="feature-card">
        <h2>커뮤니티</h2>
        <p>익명으로 자유롭게 지역 정보를 나누세요.</p>
        <router-link to="/community" class="btn">커뮤니티 바로가기</router-link>
      </div>
      <div class="feature-card">
        <h2>AI 챗봇</h2>
        <p>지역 관광지, 축제, 맛집 정보 등 무엇이든 물어보세요!</p>
        <button class="btn" @click="$emit('open-chat')">챗봇 열기</button>
      </div>
    </section>
  </div>
</template>

<script setup>
</script>

<style scoped>
.home-view {
  padding: 2rem;
  text-align: center;
}
.hero {
  margin-bottom: 3rem;
  padding: 3rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-radius: 12px;
}
.features {
  display: flex;
  gap: 2rem;
  justify-content: center;
}
.feature-card {
  padding: 2rem;
  border: 1px solid #ddd;
  border-radius: 12px;
  width: 300px;
  background: white;
  box-shadow: 0 4px 6px rgba(0,0,0,0.05);
}
.btn {
  display: inline-block;
  margin-top: 1rem;
  padding: 0.5rem 1rem;
  background-color: #42b883;
  color: white;
  text-decoration: none;
  border-radius: 6px;
  border: none;
  cursor: pointer;
  font-weight: bold;
}
.btn:hover {
  background-color: #33a06f;
}
</style>
