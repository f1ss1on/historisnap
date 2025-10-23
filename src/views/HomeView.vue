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
@import "@/assets/styles/variables.scss";

.home-view {
  min-height: 100vh;
  display: flex;
  align-items: center;
  padding: 48px 0;
  background: radial-gradient(
      1000px 400px at 10% 10%,
      rgba(110, 231, 183, 0.06),
      transparent 10%
    ),
    linear-gradient(180deg, rgba(7, 11, 18, 1) 0%, rgba(12, 18, 28, 1) 100%);
}

.container {
  max-width: 1100px;
  margin: 0 auto;
  padding: 0 24px;
}

.hero {
  text-align: center;
  margin-bottom: 48px;
  color: #e6eef8;

  &-title {
    font-size: 4rem;
    margin-bottom: 24px;
    font-weight: bold;
    text-shadow: 0 0 32px rgba(110, 231, 183, 0.3);
    color: #6ee7b7;
    letter-spacing: -2px;
    font-family: Inter, ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial;

    @media (max-width: 768px) {
      font-size: 2.5rem;
    }
  }

  &-subtitle {
    font-size: 1.25rem;
    margin-bottom: 48px;
    color: #94a3b8;
    max-width: 600px;
    margin-left: auto;
    margin-right: auto;
    line-height: 1.6;
  }

  &-actions {
    display: flex;
    gap: 16px;
    justify-content: center;
    flex-wrap: wrap;

    .btn {
      background: linear-gradient(180deg, rgba(255, 255, 255, 0.03), transparent);
      border: 1px solid rgba(255, 255, 255, 0.04);
      color: #6ee7b7;
      padding: 16px 32px;
      border-radius: 12px;
      cursor: pointer;
      font-weight: 600;
      font-size: 1.125rem;
      text-decoration: none;
      display: inline-block;
      transition: all 0.3s ease;
      font-family: Inter, ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial;

      &:hover {
        background: rgba(110, 231, 183, 0.1);
        border-color: #6ee7b7;
        transform: translateY(-2px);
        box-shadow: 0 8px 32px rgba(110, 231, 183, 0.2);
      }
      
      &.btn-primary {
        background: linear-gradient(180deg, #6ee7b7, #10b981);
        color: #0f1724;
        border-color: #6ee7b7;
        font-weight: bold;
        
        &:hover {
          background: linear-gradient(180deg, #ffffff, #6ee7b7);
          box-shadow: 0 8px 32px rgba(110, 231, 183, 0.4);
        }
      }
      
      &.btn-outline {
        background: transparent;
        border: 2px solid #6ee7b7;
        
        &:hover {
          background: #6ee7b7;
          color: #0f1724;
        }
      }
    }
  }
}

.features-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 24px;
  margin-top: 48px;
}

.feature-card {
  text-align: center;
  padding: 32px;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.03), transparent);
  border: 1px solid rgba(255, 255, 255, 0.04);
  border-radius: 12px;
  backdrop-filter: blur(10px);
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-4px);
    border-color: #6ee7b7;
    box-shadow: 0 12px 48px rgba(110, 231, 183, 0.1);
  }

  .feature-icon {
    font-size: 3rem;
    margin-bottom: 24px;
    display: block;
    opacity: 0.8;
  }

  h3 {
    color: #e6eef8;
    margin-bottom: 16px;
    font-size: 1.25rem;
    font-weight: 600;
  }

  p {
    color: #94a3b8;
    margin-bottom: 0;
    line-height: 1.6;
  }
}
</style>