import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import BoardListView from '../views/BoardListView.vue'
import PostFormView from '../views/PostFormView.vue'
import PostDetailView from '../views/PostDetailView.vue'
import CategoryDetailView from '@/views/CategoryDetailView.vue';

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView
    },
    {
      path: '/board',
      name: 'board',
      component: BoardListView
    },
    {
      path: '/board/write',
      name: 'board-write',
      component: PostFormView
    },
    {
      path: '/board/write/:id',
      name: 'board-edit',
      component: PostFormView
    },
    {
      path: '/board/:id',
      name: 'board-detail',
      component: PostDetailView
    },
    {
      path: '/category/:name?',
      name: 'category-detail',
      component: () => import('@/views/CategoryDetailView.vue')
    }
  ], 
  scrollBehavior(to, from, savedPosition) {
    // 뒤로가기/앞으로가기 시에는 사용자가 있던 스크롤 위치를 유지하고,
    // 일반적인 페이지 이동(링크 클릭 등) 시에는 항상 맨 위(y: 0)로 올립니다.
    if (savedPosition) {
      return savedPosition;
    } else {
      return { top: 0, behavior: 'smooth' }; // 부드럽게 올리고 싶다면 'smooth' 추가
    }
  }
})

export default router
