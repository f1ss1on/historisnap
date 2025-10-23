<template>
  <header class="app-header">
    <div class="container">
      <div class="header-content">
        <router-link to="/" class="header-logo">
          <span class="logo-icon">📷</span>
          <span class="logo-text">Historisnap</span>
        </router-link>
        
        <nav class="header-nav">
          <router-link 
            to="/explorer" 
            class="nav-link"
            :class="{ active: $route.name === 'HistoryExplorer' }"
          >
            Explorer
          </router-link>
          <router-link 
            v-if="isDevelopment"
            to="/testing" 
            class="nav-link"
            :class="{ active: $route.name === 'Testing' }"
          >
            Testing
          </router-link>
        </nav>
      </div>
    </div>
  </header>
</template>

<script setup>
import { computed } from 'vue'

const isDevelopment = computed(() => import.meta.env.DEV)
</script>

<style lang="scss" scoped>
@import "@/assets/styles/variables.scss";

.app-header {
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.03), transparent);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.04);
  position: sticky;
  top: 0;
  z-index: 100;
}

.container {
  max-width: 1100px;
  margin: 0 auto;
  padding: 0 24px;
}

.header-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 0;
}

.header-logo {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 1.5rem;
  font-weight: bold;
  color: #e6eef8;
  text-decoration: none;
  transition: all 0.2s ease;
  font-family: Inter, ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial;

  &:hover {
    color: #6ee7b7;
    transform: translateY(-1px);
    text-shadow: 0 0 8px rgba(110, 231, 183, 0.5);
  }

  .logo-icon {
    font-size: 2rem;
  }
}

.header-nav {
  display: flex;
  gap: 8px;
}

.nav-link {
  padding: 8px 16px;
  color: #94a3b8;
  font-weight: 600;
  text-decoration: none;
  border-radius: 10px;
  transition: all 0.2s ease;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.03), transparent);
  border: 1px solid rgba(255, 255, 255, 0.04);
  font-family: Inter, ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial;

  &:hover {
    color: #6ee7b7;
    background: rgba(110, 231, 183, 0.1);
    border-color: #6ee7b7;
    transform: translateY(-1px);
  }

  &.active {
    color: #0f1724;
    background: linear-gradient(180deg, #6ee7b7, #10b981);
    border-color: #6ee7b7;
    font-weight: bold;
    box-shadow: 0 4px 16px rgba(110, 231, 183, 0.3);
  }
}

@media (max-width: 768px) {
  .header-content {
    flex-direction: column;
    gap: 16px;
  }
  
  .header-nav {
    gap: 12px;
  }
}
</style>