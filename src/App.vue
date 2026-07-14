<template>
  <div id="app-container">
    <nav class="navbar">
      <div class="logo">
        <router-link to="/">🌐 지역 사랑방</router-link>
      </div>
      <div class="nav-links">
        <router-link to="/">홈</router-link>
        <router-link to="/community">커뮤니티</router-link>
      </div>
    </nav>

    <main class="main-content">
      <router-view @open-chat="isChatOpen = true" />
    </main>

    <Chatbot v-model:isOpen="isChatOpen" />
  </div>
</template>

<script setup>
import { ref } from 'vue'
import Chatbot from './components/Chatbot.vue'

const isChatOpen = ref(false)
</script>

<style>
/* Global Styles */
* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
  font-family: 'Inter', 'Roboto', sans-serif;
}
body {
  background-color: #f5f7fa;
  color: #333;
}
#app-container {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}
.navbar {
  background-color: white;
  padding: 1rem 2rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: 0 2px 4px rgba(0,0,0,0.05);
}
.logo a {
  font-size: 1.5rem;
  font-weight: bold;
  text-decoration: none;
  color: #764ba2;
}
.nav-links {
  display: flex;
  gap: 1.5rem;
}
.nav-links a {
  text-decoration: none;
  color: #555;
  font-weight: 500;
  transition: color 0.3s;
}
.nav-links a:hover, .nav-links a.router-link-active {
  color: #764ba2;
}
.main-content {
  flex: 1;
  padding: 2rem;
}
</style>
