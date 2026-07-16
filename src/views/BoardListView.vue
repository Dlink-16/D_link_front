<template>
  <div class="board-container">
    <h2>게시판 목록</h2>

    <!-- 검색 및 글쓰기 영역 -->
    <div class="board-actions">
      <div class="search-box">
        <!-- 📂 대전/충청 지역 정보 8개 카테고리 필터 드롭다운 -->
        <select v-model="selectedCategory" class="category-select" @change="handleCategoryChange">
          <option value="all">전체 카테고리</option>
          <option value="관광지">관광지</option>
          <option value="문화시설">문화시설</option>
          <option value="축제공연행사">축제공연행사</option>
          <option value="여행코스">여행코스</option>
          <option value="레포츠">레포츠</option>
          <option value="숙박">숙박</option>
          <option value="쇼핑">쇼핑</option>
          <option value="음식점">음식점</option>
        </select>
        
        <input v-model="searchQuery" placeholder="검색어를 입력하세요..." @keydown.enter="handleSearch" />
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
            <!-- 🏷️ 카테고리 열 -->
            <th style="width: 20%">카테고리</th>
            <th style="width: 50%">제목</th>
            <th style="width: 20%">작성일</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="post in posts" :key="post.id" @click="goToDetail(post.id)">
            <td>{{ post.displayNumber }}</td>
            <!-- 🏷️ 카테고리 표시 (상세 페이지와 동일한 파란색 태그 스타일) -->
            <td>
              <span v-if="post.category" class="table-category-tag">
                {{ post.category }}
              </span>
              <span v-else class="no-category">-</span>
            </td>
            <td class="title-cell">{{ post.title }}</td>
            <td>{{ post.created_at }}</td>
          </tr>
          <tr v-if="showEmptyState">
            <td colspan="4" class="empty-state">
              {{ searchQuery.trim() || (selectedCategory && selectedCategory !== 'all') ? '검색 결과가 없습니다.' : '등록된 게시글이 없습니다.' }}
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

// 📂 카테고리 선택 상태 추가 (URL 쿼리에서 초기값을 읽어오거나 'all'로 지정)
const selectedCategory = ref(route.query.category || 'all');

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

// 드롭다운에서 선택된 카테고리 값을 기반으로 서버에 보낼 값 가공
const getCategory = () => {
  const category = String(selectedCategory.value || '').trim();
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

// 페이지네이션 번호가 바뀌거나, 라우터 주소의 쿼리가 바뀔 때 다시 로드
watch(currentPage, loadPosts);
watch(() => route.query, (newQuery) => {
  selectedCategory.value = newQuery.category || 'all';
  loadFirstPage();
}, { deep: true });

const loadFirstPage = () => {
  if (currentPage.value === 1) {
    loadPosts();
    return;
  }
  currentPage.value = 1;
};

// 📂 카테고리 선택 드롭다운이 변경되었을 때 실행되는 함수
const handleCategoryChange = () => {
  // 라우터 쿼리를 동기화시켜서 뒤로가기나 새로고침 시에도 필터가 유지되도록 유도합니다.
  router.push({
    path: route.path,
    query: {
      ...route.query,
      category: selectedCategory.value === 'all' ? undefined : selectedCategory.value
    }
  });
};

const handleSearch = () => {
  loadFirstPage();
};

const clearSearch = () => {
  searchQuery.value = '';
  selectedCategory.value = 'all';
  // 라우터 쿼리 초기화
  router.push({ path: route.path, query: {} });
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
.board-actions { display: flex; justify-content: space-between; margin-bottom: 16px; flex-wrap: wrap; gap: 10px; }
.search-box { display: flex; gap: 6px; align-items: center; flex-wrap: wrap; }

/* 📂 카테고리 드롭다운 스타일 */
.category-select {
  padding: 6px 10px;
  border: 1px solid #cbd5e1;
  border-radius: 4px;
  background-color: white;
  color: #334155;
  font-size: 0.9rem;
  outline: none;
  cursor: pointer;
}
.category-select:focus {
  border-color: #4f46e5;
}

.search-box input { padding: 6px 12px; border: 1px solid #cbd5e1; border-radius: 4px; font-size: 0.9rem; }
.search-btn, .clear-btn { border: none; padding: 6px 12px; border-radius: 4px; cursor: pointer; font-size: 0.9rem; }
.search-btn { background: #4f46e5; color: white; }
.clear-btn { background: #e2e8f0; color: #334155; }
.write-btn { background: #4f46e5; color: white; border: none; padding: 6px 16px; border-radius: 4px; cursor: pointer; font-weight: 600; }

.table-area { display: flex; flex-direction: column; gap: 16px; min-height: 420px; justify-content: space-between; }
.board-table { width: 100%; border-collapse: collapse; margin-bottom: 0; }
.board-table th, .board-table td { padding: 12px; border-bottom: 1px solid #e2e8f0; text-align: center; vertical-align: middle; }
.board-table th { background: #f1f5f9; color: #475569; font-weight: 600; }

/* 🏷️ 테이블 내부 카테고리 태그 스타일 (상세 페이지와 동일한 인디고 파란색) */
.table-category-tag {
  display: inline-block;
  background-color: #eef2ff; /* 연한 파랑(인디고) 계열 배경 */
  color: #4f46e5;            /* 인디고 메인 색상 */
  font-size: 0.78rem;
  font-weight: 600;
  padding: 2px 8px;
  border-radius: 10px;
  border: 1px solid #e0e7ff;
}
.no-category {
  color: #94a3b8;
}

.title-cell { text-align: left !important; cursor: pointer; color: #1e293b; font-weight: 500; }
.title-cell:hover { color: #4f46e5; text-decoration: underline; }

.pagination { display: flex; justify-content: center; align-items: center; gap: 10px; min-height: 32px; }
.page-num { cursor: pointer; padding: 2px 6px; }
.page-num.active { font-weight: bold; border-bottom: 2px solid #4f46e5; color: #4f46e5; }
.empty-state { padding: 24px 12px; color: #64748b; text-align: center; }
</style>