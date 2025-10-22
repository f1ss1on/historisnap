import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '@views/HomeView.vue'
import HistoryExplorer from '@views/HistoryExplorer.vue'
import TestingView from '@views/TestingView.vue'

const routes = [
  {
    path: '/',
    name: 'Home',
    component: HomeView
  },
  {
    path: '/explorer',
    name: 'HistoryExplorer',
    component: HistoryExplorer
  },
  {
    path: '/testing',
    name: 'Testing',
    component: TestingView,
    // Only available in development
    beforeEnter: (to, from, next) => {
      if (import.meta.env.DEV) {
        next()
      } else {
        next('/')
      }
    }
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router