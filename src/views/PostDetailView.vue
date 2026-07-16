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
      <!-- 게시글 상세 정보 -->
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

      <!-- 💬 댓글 영역 -->
      <hr class="comment-divider" />
      <div class="comment-section">
        <h3>댓글 ({{ comments.length }})</h3>

        <!-- 댓글 입력창 및 비밀번호 입력 -->
        <div class="comment-form">
          <textarea 
            v-model="newComment" 
            placeholder="따뜻한 댓글을 남겨주세요..." 
            rows="3"
          ></textarea>
          <div class="comment-form-footer">
            <input 
              v-model="newCommentPassword" 
              type="password" 
              placeholder="댓글 비밀번호" 
              class="comment-pwd-input"
            />
            <button class="submit-comment-btn" @click="addComment">댓글 등록</button>
          </div>
        </div>

        <!-- 댓글 리스트 -->
        <ul v-if="comments.length > 0" class="comment-list">
          <li v-for="comment in comments" :key="comment.id" class="comment-item">
            <!-- 일반 모드 또는 수정 모드 분기 -->
            <div v-if="editingCommentId === comment.id" class="comment-edit-box">
              <textarea v-model="editingCommentContent" rows="2"></textarea>
              <div class="comment-edit-actions">
                <button @click="submitCommentEdit">완료</button>
                <button class="cancel-btn" @click="cancelCommentEdit">취소</button>
              </div>
            </div>
            <div v-else>
              <div class="comment-header">
                <span class="comment-author">익명 사용자</span>
                <span class="comment-date">{{ comment.created_at }}</span>
              </div>
              <p class="comment-body">{{ comment.content }}</p>
              <div class="comment-action-btns">
                <button @click="openCommentPasswordModal('edit', comment)">수정</button>
                <button class="delete-btn" @click="openCommentPasswordModal('delete', comment)">삭제</button>
              </div>
            </div>
          </li>
        </ul>
        <p v-else class="empty-comment">첫 번째 댓글을 남겨보세요!</p>
      </div>
    </template>

    <div v-else class="empty-state">게시글을 찾을 수 없습니다.</div>

    <!-- 🔐 [모달 1] 게시글 비밀번호 확인 모달 -->
    <div v-if="showModal" class="modal-overlay" @click.self="showModal = false">
      <div class="modal-content" role="dialog" aria-modal="true" @click.stop>
        <h3>비밀번호 확인</h3>
        <p>게시글 등록 시 설정한 비밀번호를 입력하세요.</p>
        <input
          v-model="passwordInput"
          ref="passwordInputRef"
          type="password"
          placeholder="비밀번호 입력"
          @keydown.enter.prevent="submitPassword"
        />
        <div class="modal-actions">
          <button type="button" @click="submitPassword">확인</button>
          <button type="button" class="cancel-btn" @click="showModal = false">취소</button>
        </div>
      </div>
    </div>

    <!-- 🔐 [모달 2] 댓글 비밀번호 확인 모달 -->
    <div v-if="showCommentModal" class="modal-overlay" @click.self="showCommentModal = false">
      <div class="modal-content" role="dialog" aria-modal="true" @click.stop>
        <h3>댓글 비밀번호 확인</h3>
        <p>댓글 등록 시 설정한 비밀번호를 입력하세요.</p>
        <input
          v-model="commentPasswordInput"
          ref="commentPasswordInputRef"
          type="password"
          placeholder="비밀번호 입력"
          @keydown.enter.prevent="submitCommentPassword"
        />
        <div class="modal-actions">
          <button type="button" @click="submitCommentPassword">확인</button>
          <button type="button" class="cancel-btn" @click="showCommentModal = false">취소</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import apiClient from '@/utils/api';
import SuccessPopup from '@/components/SuccessPopup.vue';

const route = useRoute();
const router = useRouter();

// 게시글 관련 상태
const showModal = ref(false);
const passwordInput = ref('');
const passwordInputRef = ref(null);
const currentAction = ref('');
const isLoading = ref(true);
const showDeletePopup = ref(false);
const showPasswordErrorPopup = ref(false);
const post = ref(null);

// 댓글 관련 기본 상태
const comments = ref([]);
const newComment = ref('');
const newCommentPassword = ref(''); // 댓글 등록용 비번

// 댓글 수정/삭제 모달 관련 상태
const showCommentModal = ref(false);
const commentPasswordInput = ref('');
const commentPasswordInputRef = ref(null);
const currentCommentAction = ref(''); // 'edit' 또는 'delete'
const targetComment = ref(null);      // 대상 댓글 객체

// 현재 수정 중인 댓글 상태
const editingCommentId = ref(null);
const editingCommentContent = ref('');
const editingCommentPassword = ref('');

const formatCreatedAtDisplay = (targetPost) => {
  if (!targetPost) return '';
  const baseDate = targetPost.created_at || '';
  const fullDate = targetPost.updated_at || targetPost.created_at || '';

  if (!fullDate) {
    return baseDate;
  }

  const [datePart, timePart] = String(fullDate).split(' ');

  if (!datePart || !timePart) {
    return baseDate;
  }

  const [year, month, day] = datePart.split('-');
  return `${year}.${month}.${day}. ${timePart}`;
};

const loadComments = async (postId) => {
  const { data } = await apiClient.get(`/posts/${postId}/comments`);
  comments.value = data;
};

const loadPost = async () => {
  isLoading.value = true;

  try {
    const { data } = await apiClient.get(`/posts/${route.params.id}`);
    post.value = data;
    await loadComments(route.params.id);
  } catch (error) {
    console.error('게시글 상세 조회 실패:', error);
    post.value = null;
  } finally {
    isLoading.value = false;
  }
};

onMounted(loadPost);
watch(() => route.params.id, loadPost);

// ➕ 댓글 추가 로직 (비밀번호 검증 추가)
const addComment = async () => {
  if (!newComment.value.trim()) {
    alert('댓글 내용을 입력해주세요.');
    return;
  }
  if (!newCommentPassword.value.trim()) {
    alert('댓글 비밀번호를 입력해주세요.');
    return;
  }

  try {
    const { data } = await apiClient.post(`/posts/${route.params.id}/comments`, {
      content: newComment.value.trim(),
      password: newCommentPassword.value.trim()
    });
    comments.value.unshift(data);
    newComment.value = '';
    newCommentPassword.value = '';
  } catch (error) {
    console.error('댓글 등록 실패:', error);
    alert('댓글 등록에 실패했습니다. 잠시 후 다시 시도해주세요.');
  }
};

// 🔒 댓글용 비밀번호 모달 오픈
const openCommentPasswordModal = (action, comment) => {
  currentCommentAction.value = action;
  targetComment.value = comment;
  commentPasswordInput.value = '';
  showCommentModal.value = true;

  requestAnimationFrame(() => {
    commentPasswordInputRef.value?.focus();
  });
};

// 🔑 댓글 비밀번호 검증 처리
const submitCommentPassword = async () => {
  const entered = String(commentPasswordInput.value ?? '').trim();
  if (!entered || !targetComment.value) {
    commentPasswordInput.value = '';
    showPasswordErrorPopup.value = true;
    return;
  }

  try {
    const postId = route.params.id;
    const commentId = targetComment.value.id;

    if (currentCommentAction.value === 'edit') {
      await apiClient.post(`/posts/${postId}/comments/${commentId}/verify-password`, {
        password: entered
      });
      editingCommentId.value = commentId;
      editingCommentContent.value = targetComment.value.content;
      editingCommentPassword.value = entered;
    } else if (currentCommentAction.value === 'delete') {
      await apiClient.delete(`/posts/${postId}/comments/${commentId}`, {
        params: { password: entered }
      });
      comments.value = comments.value.filter((comment) => comment.id !== commentId);
    }

    showCommentModal.value = false;
    commentPasswordInput.value = '';
  } catch (error) {
    console.error('댓글 비밀번호 확인 실패:', error);
    commentPasswordInput.value = '';
    showPasswordErrorPopup.value = true;
  }
};

// 📝 댓글 수정 완료 실행
const submitCommentEdit = async () => {
  if (!editingCommentContent.value.trim()) {
    alert('내용을 입력해주세요.');
    return;
  }
  try {
    const commentId = editingCommentId.value;
    const { data } = await apiClient.put(`/posts/${route.params.id}/comments/${commentId}`, {
      content: editingCommentContent.value.trim(),
      password: editingCommentPassword.value
    });
    const index = comments.value.findIndex((comment) => comment.id === commentId);
    if (index !== -1) {
      comments.value[index] = data;
    }
    cancelCommentEdit();
  } catch (error) {
    console.error('댓글 수정 실패:', error);
    showPasswordErrorPopup.value = true;
  }
};

const cancelCommentEdit = () => {
  editingCommentId.value = null;
  editingCommentContent.value = '';
  editingCommentPassword.value = '';
};

const goBackToList = () => {
  router.push('/board');
};

// 게시글 패스워드 로직
const openPasswordModal = (action) => {
  currentAction.value = action;
  passwordInput.value = '';
  showModal.value = true;
  requestAnimationFrame(() => {
    passwordInputRef.value?.focus();
  });
};

const handleDeleteConfirm = () => {
  router.push('/board');
};

const submitPassword = async () => {
  const enteredPassword = String(passwordInput.value ?? '').trim();

  if (!enteredPassword) {
    passwordInput.value = '';
    showPasswordErrorPopup.value = true;
    return;
  }

  try {
    if (currentAction.value === 'edit') {
      await apiClient.post(`/posts/${post.value.id}/verify-password`, {
        password: enteredPassword
      });
      showModal.value = false;
      router.push({
        name: 'board-edit',
        params: { id: post.value.id },
        state: { editPostId: post.value.id, password: enteredPassword }
      });
      return;
    }

    await apiClient.delete(`/posts/${post.value.id}`, { params: { password: enteredPassword } });
    showModal.value = false;
    showDeletePopup.value = true;
  } catch (error) {
    console.error('게시글 삭제 실패:', error);
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
.action-buttons { display: flex; gap: 8px; justify-content: flex-end; flex-wrap: wrap; margin-bottom: 20px; }
.action-buttons button { padding: 8px 16px; border: 1px solid #cbd5e1; background: white; border-radius: 4px; cursor: pointer; }
.back-btn { color: #4f46e5; }
.delete-btn { color: #ef4444; }

/* 댓글 스타일 개선 */
.comment-divider { border: 0; height: 1px; background: #e2e8f0; margin: 30px 0 20px 0; }
.comment-section h3 { font-size: 1.15rem; margin-bottom: 12px; }
.comment-form { display: flex; flex-direction: column; gap: 8px; margin-bottom: 20px; background: #fff; border: 1px solid #cbd5e1; border-radius: 6px; padding: 10px; }
.comment-form textarea { width: 100%; padding: 6px; border: none; resize: none; font-family: inherit; box-sizing: border-box; outline: none; }
.comment-form-footer { display: flex; justify-content: space-between; align-items: center; border-top: 1px solid #f1f5f9; padding-top: 8px; }
.comment-pwd-input { padding: 6px 10px; border: 1px solid #cbd5e1; border-radius: 4px; font-size: 0.85rem; width: 140px; }
.submit-comment-btn { background: #4f46e5; color: white; border: none; padding: 6px 14px; border-radius: 4px; cursor: pointer; font-weight: 600; }
.submit-comment-btn:hover { background: #4338ca; }

.comment-list { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 10px; }
.comment-item { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 12px; position: relative; }
.comment-header { display: flex; gap: 10px; margin-bottom: 4px; align-items: center; }
.comment-author { font-weight: 600; font-size: 0.88rem; color: #334155; }
.comment-date { color: #94a3b8; font-size: 0.78rem; }
.comment-body { margin: 0; color: #475569; font-size: 0.92rem; line-height: 1.4; padding-bottom: 8px; }

/* 댓글 수정 폼 */
.comment-edit-box textarea { width: 100%; padding: 8px; border: 1px solid #cbd5e1; border-radius: 4px; resize: none; font-family: inherit; box-sizing: border-box; }
.comment-edit-actions { display: flex; gap: 6px; justify-content: flex-end; margin-top: 6px; }
.comment-edit-actions button { padding: 4px 10px; font-size: 0.8rem; background: #4f46e5; color: white; border: none; border-radius: 4px; cursor: pointer; }
.comment-edit-actions .cancel-btn { background: #64748b; }

.comment-action-btns { display: flex; gap: 8px; justify-content: flex-end; }
.comment-action-btns button { background: none; border: none; color: #64748b; font-size: 0.78rem; cursor: pointer; padding: 0; }
.comment-action-btns button:hover { text-decoration: underline; }
.comment-action-btns .delete-btn { color: #ef4444; }
.empty-comment { text-align: center; color: #94a3b8; padding: 16px 0; font-size: 0.9rem; }

/* 모달 스타일 */
.modal-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); display: flex; justify-content: center; align-items: center; z-index: 1000; }
.modal-content { background: white; padding: 24px; border-radius: 8px; width: 320px; text-align: center; }
.modal-content input { width: 90%; padding: 8px; margin: 12px 0; border: 1px solid #cbd5e1; border-radius: 4px; }
.modal-actions { display: flex; gap: 8px; justify-content: center; margin-top: 12px; }
.modal-actions button { padding: 6px 16px; background: #4f46e5; color: white; border: none; border-radius: 4px; cursor: pointer; }
.modal-actions .cancel-btn { background: #64748b; }
</style>
