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
#app {
  min-height: 100vh;
}
</style>