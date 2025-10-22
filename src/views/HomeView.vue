<template>
  <div class="home-view">
    <div class="container">
      <div class="hero">
        <h1 class="hero-title">📷 Historisnap</h1>
        <p class="hero-subtitle">
          Snap into history! Explore random historical events with multimedia content and intelligent diagnostics
        </p>
        <div class="hero-actions">
          <router-link to="/explorer" class="btn btn-primary btn-lg">
            Start Exploring History
          </router-link>
          <router-link 
            v-if="isDevelopment" 
            to="/testing" 
            class="btn btn-outline btn-lg"
          >
            Testing Suite
          </router-link>
        </div>
      </div>

      <div class="features-grid">
        <div class="feature-card card">
          <div class="feature-icon">📸</div>
          <h3>Snap Through Time</h3>
          <p>Browse events from 1900 to {{ currentYear }} with instant access to historical moments</p>
        </div>
        <div class="feature-card card">
          <div class="feature-icon">🎭</div>
          <h3>Rich Multimedia</h3>
          <p>Images, audio, and video content with intelligent type detection</p>
        </div>
        <div class="feature-card card">
          <div class="feature-icon">🌐</div>
          <h3>Wikipedia Integration</h3>
          <p>Real-time data from Wikipedia with advanced error handling</p>
        </div>
        <div class="feature-card card">
          <div class="feature-icon">⚡</div>
          <h3>High Performance</h3>
          <p>Optimized caching and intelligent API usage patterns</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const isDevelopment = computed(() => import.meta.env.DEV)
const currentYear = new Date().getFullYear()
</script>

<style lang="scss" scoped>
.home-view {
  min-height: 100vh;
  display: flex;
  align-items: center;
  padding: $spacing-xl 0;
}

.hero {
  text-align: center;
  margin-bottom: $spacing-xl;
  color: white;

  &-title {
    font-size: 3.5rem;
    margin-bottom: $spacing-lg;
    text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3);

    @media (max-width: $breakpoint-md) {
      font-size: 2.5rem;
    }
  }

  &-subtitle {
    font-size: 1.25rem;
    margin-bottom: $spacing-xl;
    opacity: 0.9;
    max-width: 600px;
    margin-left: auto;
    margin-right: auto;
  }

  &-actions {
    display: flex;
    gap: $spacing-md;
    justify-content: center;
    flex-wrap: wrap;

    .btn-lg {
      padding: $spacing-md $spacing-xl;
      font-size: 1.125rem;
    }
  }
}

.features-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: $spacing-lg;
  margin-top: $spacing-xl;
}

.feature-card {
  text-align: center;
  padding: $spacing-xl;

  .feature-icon {
    font-size: 3rem;
    margin-bottom: $spacing-lg;
    display: block;
  }

  h3 {
    color: $dark-color;
    margin-bottom: $spacing-md;
  }

  p {
    color: $muted-color;
    margin-bottom: 0;
  }
}
</style>