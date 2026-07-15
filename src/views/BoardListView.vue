<template>
  <div class="board-container">
    <h2>게시판 목록</h2>

    <!-- 검색 및 글쓰기 영역 -->
    <div class="board-actions">
      <div class="search-box">
        <input v-model="searchQuery" placeholder="검색어를 입력하세요..." />
        <button class="search-btn" @click="handleSearch">검색</button>
        <button class="clear-btn" @click="clearSearch">초기화</button>
      </div>
      <button class="write-btn" @click="goToWrite">글쓰기</button>
    </div>

    <!-- 게시글 테이블 -->
    <div class="table-area">
      <table class="board-table">
        <thead>
          <tr>
            <th style="width: 10%">번호</th>
            <th style="width: 70%">제목</th>
            <th style="width: 20%">작성일</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="post in posts" :key="post.id" @click="goToDetail(post.id)">
            <td>{{ post.displayNumber }}</td>
            <td class="title-cell">{{ post.title }}</td>
            <td>{{ post.created_at }}</td>
          </tr>
          <tr v-if="showEmptyState">
            <td colspan="3" class="empty-state">
              {{ searchQuery.trim() ? '검색 결과가 없습니다.' : '등록된 게시글이 없습니다.' }}
            </td>
          </tr>
        </tbody>
      </table>

      <!-- 페이지네이션 -->
      <div v-if="totalPages > 0" class="pagination">
        <button v-if="totalPages > 1" :disabled="currentPage === 1" @click="currentPage = Math.max(1, currentPage - 1)">◀</button>
        <span class="page-num" v-for="p in totalPages" :key="p" :class="{ active: p === currentPage }" @click="currentPage = p">{{ p }}</span>
        <button v-if="totalPages > 1" :disabled="currentPage === totalPages" @click="currentPage = Math.min(totalPages, currentPage + 1)">▶</button>
      </div>
    </div>

  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import apiClient from '@/utils/api';

const route = useRoute();
const router = useRouter();
const searchQuery = ref('');
const currentPage = ref(1);
const totalPages = ref(0);
const totalPosts = ref(0);
const posts = ref([]);
const showEmptyState = ref(false);
const pageSize = 5;
let latestRequestId = 0;

const getSearchKeyword = () => {
  const keyword = searchQuery.value.trim();
  return keyword || undefined;
};

const getCategory = () => {
  const category = String(route.query.category || '').trim();
  return category && category !== 'all' ? category : undefined;
};

const loadPosts = async () => {
  const requestId = ++latestRequestId;
  const search = getSearchKeyword();
  const category = getCategory();

  try {
    const [listResponse, countResponse] = await Promise.all([
      apiClient.get('/posts/', {
        params: { page: currentPage.value, limit: pageSize, search, category }
      }),
      apiClient.get('/posts/count', { params: { search, category } })
    ]);

    if (requestId !== latestRequestId) {
      return;
    }

    totalPosts.value = countResponse.data.total;
    totalPages.value = Math.ceil(totalPosts.value / pageSize);

    if (totalPages.value > 0 && currentPage.value > totalPages.value) {
      currentPage.value = totalPages.value;
      return;
    }

    const start = (currentPage.value - 1) * pageSize;
    posts.value = listResponse.data.map((post, index) => ({
      ...post,
      displayNumber: totalPosts.value - start - index
    }));
    showEmptyState.value = totalPosts.value === 0;
  } catch (error) {
    console.error('게시글 목록 로드 실패:', error);
    posts.value = [];
    totalPosts.value = 0;
    totalPages.value = 0;
    showEmptyState.value = true;
  }
};

onMounted(loadPosts);
watch(() => route.query.category, () => loadFirstPage());
watch(currentPage, loadPosts);

const loadFirstPage = () => {
  if (currentPage.value === 1) {
    loadPosts();
    return;
  }

  currentPage.value = 1;
};

const handleSearch = () => {
  loadFirstPage();
};

const clearSearch = () => {
  searchQuery.value = '';
  loadFirstPage();
};

const goToWrite = () => {
  router.push('/board/write');
};

const goToDetail = (id) => {
  router.push(`/board/${id}`);
};
</script>

<style scoped>
.board-container { max-width: 800px; margin: 0 auto; padding: 20px; }
.board-actions { display: flex; justify-content: space-between; margin-bottom: 16px; }
.search-box { display: flex; gap: 6px; align-items: center; }
.search-box input { padding: 6px 12px; border: 1px solid #cbd5e1; border-radius: 4px; }
.search-btn, .clear-btn { border: none; padding: 6px 12px; border-radius: 4px; cursor: pointer; }
.search-btn { background: #4f46e5; color: white; }
.clear-btn { background: #e2e8f0; color: #334155; }
.write-btn { background: #4f46e5; color: white; border: none; padding: 6px 16px; border-radius: 4px; cursor: pointer; }
.table-area { display: flex; flex-direction: column; gap: 16px; min-height: 420px; justify-content: space-between; }
.board-table { width: 100%; border-collapse: collapse; margin-bottom: 0; }
.board-table th, .board-table td { padding: 12px; border-bottom: 1px solid #e2e8f0; text-align: center; }
.board-table th { background: #f1f5f9; }
.title-cell { text-align: left !important; cursor: pointer; }
.pagination { display: flex; justify-content: center; align-items: center; gap: 10px; min-height: 32px; }
.page-num { cursor: pointer; padding: 2px 6px; }
.page-num.active { font-weight: bold; border-bottom: 2px solid #4f46e5; }
.empty-state { padding: 24px 12px; color: #64748b; text-align: center; }
</style>
