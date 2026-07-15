import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import BoardListView from '../views/BoardListView.vue'
import PostFormView from '../views/PostFormView.vue'
import PostDetailView from '../views/PostDetailView.vue'

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
  ]
})

export default router
