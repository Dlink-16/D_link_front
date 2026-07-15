<template>
  <div class="community-view">
    <h2>지역 익명 커뮤니티</h2>
    <p>회원가입 없이 자유롭게 지역 정보를 나누는 공간입니다.</p>
    
    <div class="actions">
      <button class="btn" @click="showWriteForm = true">글 작성하기</button>
    </div>

    <div v-if="showWriteForm" class="write-form">
      <h3>새 게시글 작성</h3>
      <input type="text" v-model="newPost.title" placeholder="제목" />
      <textarea v-model="newPost.content" placeholder="내용" rows="4"></textarea>
      <input type="password" v-model="newPost.password" placeholder="비밀번호 (수정/삭제용)" />
      <div class="form-actions">
        <button class="btn" @click="submitPost">등록</button>
        <button class="btn cancel" @click="showWriteForm = false">취소</button>
      </div>
    </div>

    <div class="post-list">
      <div v-for="post in posts" :key="post.id" class="post-item">
        <h4>{{ post.title }}</h4>
        <p>{{ post.content }}</p>
      </div>
      <div v-if="posts.length === 0" class="empty-state">
        게시글이 없습니다. 첫 번째 글을 작성해보세요!
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import apiClient from '@/utils/api'

const showWriteForm = ref(false)
const posts = ref([])
const newPost = ref({ title: '', content: '', password: '' })

const loadPosts = async () => {
  try {
    const { data } = await apiClient.get('/posts/')
    posts.value = data
  } catch (error) {
    console.error('게시글 조회 실패:', error)
    posts.value = []
  }
}

const submitPost = async () => {
  if (!newPost.value.title || !newPost.value.content || !newPost.value.password) {
    alert('모든 항목을 입력해주세요.')
    return
  }

  try {
    await apiClient.post('/posts/', {
      title: newPost.value.title,
      content: newPost.value.content,
      password: newPost.value.password,
      category: '관광지'
    })

    newPost.value = { title: '', content: '', password: '' }
    showWriteForm.value = false
    await loadPosts()
  } catch (error) {
    console.error('게시글 등록 실패:', error)
    alert('게시글 등록에 실패했습니다.')
  }
}

onMounted(loadPosts)
</script>

<style scoped>
.community-view {
  max-width: 800px;
  margin: 0 auto;
  padding: 2rem;
}
.actions {
  margin: 1.5rem 0;
  display: flex;
  justify-content: flex-end;
}
.btn {
  padding: 0.5rem 1rem;
  background-color: #42b883;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}
.btn.cancel {
  background-color: #f44336;
}
.write-form {
  background: #f9f9f9;
  padding: 1.5rem;
  border-radius: 8px;
  margin-bottom: 2rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}
.write-form input, .write-form textarea {
  padding: 0.8rem;
  border: 1px solid #ddd;
  border-radius: 4px;
}
.form-actions {
  display: flex;
  gap: 1rem;
}
.post-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}
.post-item {
  padding: 1.5rem;
  border: 1px solid #eee;
  border-radius: 8px;
  background: white;
  box-shadow: 0 2px 4px rgba(0,0,0,0.02);
}
.empty-state {
  text-align: center;
  padding: 3rem;
  color: #777;
  background: #fdfdfd;
  border-radius: 8px;
  border: 1px dashed #ccc;
}
</style>
