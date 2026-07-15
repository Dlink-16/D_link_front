<template>
  <div class="detail-container">
    <SuccessPopup
      :open="showDeletePopup"
      title="삭제 완료"
      message="게시글이 성공적으로 삭제되었습니다."
      confirmText="확인"
      @confirm="handleDeleteConfirm"
      @close="showDeletePopup = false"
    />
    <SuccessPopup
      :open="showPasswordErrorPopup"
      title="비밀번호 오류"
      message="비밀번호가 일치하지 않습니다. 다시 입력해주세요."
      confirmText="확인"
      type="error"
      @confirm="showPasswordErrorPopup = false"
      @close="showPasswordErrorPopup = false"
    />
    <div v-if="isLoading" class="loading-state">게시글을 불러오는 중입니다...</div>

    <template v-else-if="post?.title">
      <div class="post-header">
        <h2>{{ post.title }}</h2>
        <p class="post-meta">작성일: {{ formatCreatedAtDisplay(post) }} | 익명 사용자</p>
      </div>
      <hr />
      <div class="post-content">
        <p>{{ post.content }}</p>
      </div>

      <div class="action-buttons">
        <button class="back-btn" @click="goBackToList">◀ 목록으로</button>
        <button @click="openPasswordModal('edit')">수정</button>
        <button class="delete-btn" @click="openPasswordModal('delete')">삭제</button>
      </div>
    </template>

    <div v-else class="empty-state">게시글을 찾을 수 없습니다.</div>

    <div v-if="showModal" class="modal-overlay" @click.self="showModal = false">
      <div class="modal-content" role="dialog" aria-modal="true" @click.stop>
        <h3>비밀번호 확인</h3>
        <p>게시글 등록 시 설정한 비밀번호를 입력하세요.</p>
        <input
          v-model="passwordInput"
          ref="passwordInputRef"
          type="password"
          placeholder="비밀번호 입력"
          autocomplete="off"
          spellcheck="false"
          inputmode="text"
          @keydown.enter.prevent="submitPassword"
        />
        <div class="modal-actions">
          <button type="button" @click="submitPassword">확인</button>
          <button type="button" class="cancel-btn" @click="showModal = false">취소</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { deletePostById, getPostById, seedDefaultPosts } from '@/utils/posts';
import SuccessPopup from '@/components/SuccessPopup.vue';

const route = useRoute();
const router = useRouter();
const showModal = ref(false);
const passwordInput = ref('');
const passwordInputRef = ref(null);
const currentAction = ref('');
const isLoading = ref(true);
const showDeletePopup = ref(false);
const showPasswordErrorPopup = ref(false);

const post = ref(null);

const formatCreatedAtDisplay = (targetPost) => {
  if (!targetPost) {
    return '';
  }

  const baseDate = targetPost.created_at || '';
  const fullDate = targetPost.created_at_full || '';

  if (!fullDate) {
    return baseDate;
  }

  const [datePart, timePart] = fullDate.split(' ');

  if (!datePart || !timePart) {
    return baseDate;
  }

  const [year, month, day] = datePart.split('-');
  return `${year}.${month}.${day}. ${timePart}`;
};

const loadPost = () => {
  isLoading.value = true;
  seedDefaultPosts();
  const targetPost = getPostById(route.params.id);

  if (targetPost) {
    post.value = targetPost;
  } else {
    post.value = null;
  }

  isLoading.value = false;
};

onMounted(loadPost);
watch(() => route.params.id, loadPost);

const goBackToList = () => {
  router.push('/board');
};

const openPasswordModal = (action) => {
  currentAction.value = action;
  passwordInput.value = '';
  showModal.value = true;

  requestAnimationFrame(() => {
    passwordInputRef.value?.focus();
    passwordInputRef.value?.select();
  });
};

const handleDeleteConfirm = () => {
  router.push('/board');
};

const submitPassword = () => {
  const enteredPassword = String(passwordInput.value ?? '').trim();
  const storedPassword = String(post.value?.password ?? '').trim();

  if (enteredPassword && enteredPassword === storedPassword) {
    showModal.value = false;
    if (currentAction.value === 'edit') {
      router.push(`/board/write/${post.value.id}`);
    } else {
      deletePostById(post.value.id);
      showDeletePopup.value = true;
    }
  } else {
    passwordInput.value = '';
    showPasswordErrorPopup.value = true;
    requestAnimationFrame(() => {
      passwordInputRef.value?.focus();
    });
  }
};
</script>

<style scoped>
.detail-container { max-width: 800px; margin: 0 auto; padding: 20px; position: relative; }
.loading-state, .empty-state { padding: 24px; text-align: center; color: #64748b; background: #f8fafc; border-radius: 8px; }
.post-meta { color: #64748b; font-size: 14px; }
.post-content { min-height: 200px; padding: 20px 0; line-height: 1.6; }
.action-buttons { display: flex; gap: 8px; justify-content: flex-end; flex-wrap: wrap; }
.action-buttons button { padding: 8px 16px; border: 1px solid #cbd5e1; background: white; border-radius: 4px; cursor: pointer; }
.back-btn { color: #4f46e5; }
.delete-btn { color: #ef4444; }

/* 모달 레이아웃 스타일 */
.modal-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); display: flex; justify-content: center; align-items: center; }
.modal-content { background: white; padding: 24px; border-radius: 8px; width: 320px; text-align: center; z-index: 1000; }
.modal-content input { width: 90%; padding: 8px; margin: 12px 0; border: 1px solid #cbd5e1; border-radius: 4px; position: relative; z-index: 1001; }
.modal-actions { display: flex; gap: 8px; justify-content: center; margin-top: 12px; }
.modal-actions button { padding: 6px 16px; background: #4f46e5; color: white; border: none; border-radius: 4px; cursor: pointer; }
.modal-actions .cancel-btn { background: #64748b; }
</style>