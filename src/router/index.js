import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '@views/HomeView.vue'
import HistoryExplorer from '@views/HistoryExplorer.vue'

// Conditionally import TestingView only in development for build optimization

// Create routes based on environment
const routes = []

// In production, redirect root directly to explorer
if (!import.meta.env.DEV) {
  routes.push({
    path: '/',
    redirect: '/explorer'
  })
} else {
  // In development, show home page
  routes.push({
    path: '/',
    name: 'Home',
    component: HomeView
  })
}

// Add explorer routes
routes.push(
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
)

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
  history: createWebHistory(import.meta.env.PROD ? '/historisnap/' : '/'),
  routes
})

// Handle GitHub Pages redirect parameter
router.beforeEach((to, from, next) => {
  // Check if this is the initial navigation with a redirect parameter
  if (to.path === '/' || to.path === '/explorer') {
    const urlParams = new URLSearchParams(window.location.search)
    const redirect = urlParams.get('redirect')
    
    if (redirect) {
      // Clean up the URL and navigate to the intended route
      window.history.replaceState({}, '', window.location.pathname)
      next(redirect)
      return
    }
  }
  
  next()
})

export default router