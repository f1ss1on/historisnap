import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '@views/HomeView.vue'
import HistoryExplorer from '@views/HistoryExplorer.vue'

// Conditionally import TestingView only in development for build optimization

const routes = [
  {
    path: '/',
    name: 'Home',
    component: HomeView,
    // In production, redirect root to explorer
    beforeEnter: (to, from, next) => {
      if (!import.meta.env.DEV && to.path === '/') {
        next('/explorer')
      } else {
        next()
      }
    }
  },
  {
    path: '/explorer',
    name: 'HistoryExplorer',
    component: HistoryExplorer
  },
  {
    path: '/explorer/:title',
    name: 'HistoryExplorerWithTitle',
    component: HistoryExplorer,
    props: true
  }
]

// Only add testing route in development
if (import.meta.env.DEV) {
  routes.push({
    path: '/testing',
    name: 'Testing',
    component: () => import('@views/TestingView.vue'),
    // Only available in development
    beforeEnter: (to, from, next) => {
      if (import.meta.env.DEV) {
        next()
      } else {
        next('/')
      }
    }
  })
}

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router