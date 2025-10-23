<!--
  HistoriSnap - Snap into history
  Copyright (c) 2025 Riad Kilani (f1ss1on)
  Licensed under the MIT License
-->
<template>
  <div id="app">
    <AppHeader />
    <router-view />
    <TestingPanel v-if="isDevelopment" />
  </div>
</template>

<script setup>
import { computed } from 'vue'
import AppHeader from '@components/AppHeader.vue'
import TestingPanel from '@components/TestingPanel.vue'

const isDevelopment = computed(() => import.meta.env.DEV)
</script>

<style lang="scss">
@import "@/assets/styles/variables.scss";

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html, body {
  height: 100%;
  font-family: Inter, ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial;
}

#app {
  min-height: 100vh;
  background: radial-gradient(
      1000px 400px at 10% 10%,
      rgba(110, 231, 183, 0.06),
      transparent 10%
    ),
    linear-gradient(180deg, rgba(7, 11, 18, 1) 0%, rgba(12, 18, 28, 1) 100%);
  color: #e6eef8;
}
</style>