<template>
  <header class="app-header">
    <div class="container">
      <div class="header-content">
        <router-link to="/" class="header-logo">
          <span class="logo-icon">🏛️</span>
          <span class="logo-text">History Explorer</span>
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
.app-header {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.2);
  position: sticky;
  top: 0;
  z-index: 100;
}

.header-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: $spacing-md 0;
}

.header-logo {
  display: flex;
  align-items: center;
  gap: $spacing-sm;
  font-size: 1.25rem;
  font-weight: 600;
  color: $dark-color;
  text-decoration: none;
  transition: $transition-base;

  &:hover {
    color: $primary-color;
    transform: translateY(-1px);
  }

  .logo-icon {
    font-size: 1.5rem;
  }
}

.header-nav {
  display: flex;
  gap: $spacing-lg;
}

.nav-link {
  padding: $spacing-xs $spacing-md;
  color: $muted-color;
  font-weight: 500;
  text-decoration: none;
  border-radius: $border-radius;
  transition: $transition-base;

  &:hover,
  &.active {
    color: $primary-color;
    background: rgba($primary-color, 0.1);
  }

  &.active {
    font-weight: 600;
  }
}

@media (max-width: $breakpoint-sm) {
  .header-content {
    flex-direction: column;
    gap: $spacing-md;
  }
  
  .header-nav {
    gap: $spacing-md;
  }
}
</style>