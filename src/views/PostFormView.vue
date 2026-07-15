<template>
  <div class="form-container">
    <SuccessPopup
      :open="showPopup"
      title="등록 완료"
      :message="'게시글이 성공적으로 등록되었습니다.'"
      confirmText="확인"
      @confirm="handlePopupConfirm"
      @close="showPopup = false"
    />

    <h2>{{ isEdit ? '게시글 수정' : '게시글 작성' }}</h2>
    
    <div class="form-group">
      <label for="title">제목</label>
      <input id="title" v-model="formData.title" placeholder="제목을 입력하세요" />
    </div>

    <div class="form-group">
      <label for="content">내용</label>
      <textarea id="content" v-model="formData.content" rows="10" placeholder="내용을 입력하세요"></textarea>
    </div>

    <div class="form-group password-group">
      <label for="password">수정용 비밀번호</label>
      <input id="password" type="password" v-model="formData.password" placeholder="비밀번호 입력(평문 저장)" />
      <small class="notice">※ 본 커뮤니티는 익명 서비스로, 수정/삭제 시 이 비밀번호를 사용합니다.</small>
    </div>

    <div class="form-actions">
      <button class="submit-btn" @click="handleSubmit">{{ isEdit ? '수정완료' : '등록' }}</button>
      <button class="cancel-btn" @click="handleCancel">취소</button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { addPost, getPostById, updatePostById } from '@/utils/posts';
import SuccessPopup from '@/components/SuccessPopup.vue';

const route = useRoute();
const router = useRouter();
const postId = ref(route.params.id || null);
const isEdit = ref(Boolean(postId.value));
const showPopup = ref(false);

const formData = ref({
  title: '',
  content: '',
  password: ''
});

onMounted(() => {
  if (!isEdit.value) return;

  const targetPost = getPostById(postId.value);

  if (targetPost) {
    formData.value = {
      title: targetPost.title,
      content: targetPost.content,
      password: targetPost.password || ''
    };
  }
});

const handleSubmit = () => {
  if (!formData.value.title || !formData.value.content || !formData.value.password) {
    alert('모든 항목을 입력해주세요.');
    return;
  }

  if (isEdit.value && postId.value) {
    updatePostById(postId.value, {
      title: formData.value.title,
      content: formData.value.content,
      password: formData.value.password
    });
  } else {
    addPost({
      title: formData.value.title,
      content: formData.value.content,
      password: formData.value.password
    });
  }

  showPopup.value = true;
};

const handlePopupConfirm = () => {
  router.push('/board');
};

const handleCancel = () => {
  router.push('/board');
};
</script>

<style scoped>
.form-container { max-width: 800px; margin: 0 auto; padding: 20px; }
.form-group { display: flex; flex-direction: column; margin-bottom: 16px; }
.form-group label { font-weight: bold; margin-bottom: 6px; }
.form-group input, .form-group textarea { padding: 10px; border: 1px solid #cbd5e1; border-radius: 4px; font-size: 14px; }
.password-group input { width: 250px; }
.notice { color: #64748b; margin-top: 4px; }
.form-actions { display: flex; gap: 8px; margin-top: 24px; }
.submit-btn { background: #4f46e5; color: white; border: none; padding: 10px 24px; border-radius: 4px; cursor: pointer; }
.cancel-btn { background: #64748b; color: white; border: none; padding: 10px 24px; border-radius: 4px; cursor: pointer; }
</style>