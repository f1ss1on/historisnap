<template>
  <div class="testing-panel" v-if="visible">
    <div class="testing-header">
      <h3>🧪 Development Testing Suite</h3>
      <button @click="toggleVisibility" class="btn btn-sm">
        {{ visible ? 'Hide' : 'Show' }}
      </button>
    </div>
    
    <div class="testing-content">
      <div class="testing-actions">
        <button @click="runBasicTest" class="btn btn-primary btn-sm" :disabled="isRunning">
          {{ isRunning ? 'Testing...' : 'Run Basic Test' }}
        </button>
        <button @click="clearResults" class="btn btn-outline btn-sm">
          Clear Results
        </button>
      </div>
      
      <div v-if="results.length > 0" class="testing-results">
        <h4>Test Results:</h4>
        <div v-for="result in results" :key="result.id" class="test-result">
          <span :class="['status', result.status]">
            {{ result.status === 'pass' ? '✅' : '❌' }}
          </span>
          <span class="test-name">{{ result.name }}</span>
          <span class="test-time">{{ result.duration }}ms</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useHistoryStore } from '@stores/history.js'
import wikipediaAPI from '@utils/wikipedia-api.js'

const visible = ref(import.meta.env.DEV)
const isRunning = ref(false)
const results = ref([])

const historyStore = useHistoryStore()

const toggleVisibility = () => {
  visible.value = !visible.value
}

const runBasicTest = async () => {
  isRunning.value = true
  results.value = []
  
  const tests = [
    {
      name: 'Store initialization',
      test: () => {
        return historyStore.currentYear > 0
      }
    },
    {
      name: 'Wikipedia API connection',
      test: async () => {
        try {
          const event = await wikipediaAPI.fetchRandomEvent(2020)
          return event !== null
        } catch (error) {
          return false
        }
      }
    },
    {
      name: 'Year navigation',
      test: () => {
        const initialPage = historyStore.currentPage
        historyStore.nextPage()
        const changed = historyStore.currentPage !== initialPage
        historyStore.currentPage = initialPage // Reset
        return changed
      }
    }
  ]
  
  for (const testCase of tests) {
    const startTime = performance.now()
    try {
      const result = await testCase.test()
      const endTime = performance.now()
      
      results.value.push({
        id: Date.now() + Math.random(),
        name: testCase.name,
        status: result ? 'pass' : 'fail',
        duration: Math.round(endTime - startTime)
      })
    } catch (error) {
      const endTime = performance.now()
      results.value.push({
        id: Date.now() + Math.random(),
        name: testCase.name,
        status: 'fail',
        duration: Math.round(endTime - startTime),
        error: error.message
      })
    }
  }
  
  isRunning.value = false
}

const clearResults = () => {
  results.value = []
}
</script>

<style lang="scss" scoped>
.testing-panel {
  position: fixed;
  bottom: $spacing-lg;
  right: $spacing-lg;
  width: 350px;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-radius: $border-radius-lg;
  box-shadow: $shadow-xl;
  z-index: 1000;
  border: 2px solid $primary-color;
}

.testing-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: $spacing-md;
  border-bottom: 1px solid rgba(0, 0, 0, 0.1);
  
  h3 {
    margin: 0;
    color: $primary-color;
    font-size: 1rem;
  }
}

.testing-content {
  padding: $spacing-md;
}

.testing-actions {
  display: flex;
  gap: $spacing-sm;
  margin-bottom: $spacing-md;
  
  .btn-sm {
    padding: $spacing-xs $spacing-sm;
    font-size: 0.875rem;
  }
}

.testing-results {
  h4 {
    margin: 0 0 $spacing-sm 0;
    font-size: 0.875rem;
    color: $dark-color;
  }
}

.test-result {
  display: flex;
  align-items: center;
  gap: $spacing-sm;
  padding: $spacing-xs 0;
  font-size: 0.75rem;
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
  
  &:last-child {
    border-bottom: none;
  }
  
  .status {
    width: 20px;
  }
  
  .test-name {
    flex: 1;
  }
  
  .test-time {
    color: $muted-color;
    font-size: 0.7rem;
  }
}

@media (max-width: $breakpoint-md) {
  .testing-panel {
    width: calc(100vw - #{$spacing-lg * 2});
    bottom: $spacing-md;
    right: $spacing-md;
  }
}
</style>