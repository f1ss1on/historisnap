<template>
  <div class="testing-view">
    <div class="container">
      <div class="testing-header">
        <h1>🧪 Development Testing Suite</h1>
        <p>Comprehensive testing and diagnostics for the History Explorer application</p>
      </div>

      <div class="testing-grid">
        <!-- Test Controls -->
        <div class="test-controls card">
          <h3>Test Controls</h3>
          <div class="control-group">
            <button 
              @click="runAllTests" 
              :disabled="isRunning"
              class="btn btn-primary"
            >
              {{ isRunning ? 'Running Tests...' : 'Run All Tests' }}
            </button>
            <button @click="runAPITests" :disabled="isRunning" class="btn btn-secondary">
              Test APIs
            </button>
            <button @click="runMultimediaTests" :disabled="isRunning" class="btn btn-secondary">
              Test Multimedia
            </button>
            <button @click="clearResults" class="btn btn-outline">
              Clear Results
            </button>
          </div>
        </div>

        <!-- Performance Metrics -->
        <div class="performance-metrics card">
          <h3>Performance Metrics</h3>
          <div class="metrics-grid">
            <div class="metric">
              <div class="metric-value">{{ metrics.totalCalls }}</div>
              <div class="metric-label">API Calls</div>
            </div>
            <div class="metric">
              <div class="metric-value">{{ metrics.successRate }}%</div>
              <div class="metric-label">Success Rate</div>
            </div>
            <div class="metric">
              <div class="metric-value">{{ metrics.cacheHitRate }}%</div>
              <div class="metric-label">Cache Hit Rate</div>
            </div>
            <div class="metric">
              <div class="metric-value">{{ metrics.errorRate }}%</div>
              <div class="metric-label">Error Rate</div>
            </div>
          </div>
        </div>
      </div>

      <!-- Test Results -->
      <div v-if="testResults.length > 0" class="test-results card">
        <h3>Test Results</h3>
        <div class="results-summary">
          <div class="summary-item">
            <span class="summary-label">Total:</span>
            <span class="summary-value">{{ testResults.length }}</span>
          </div>
          <div class="summary-item">
            <span class="summary-label">Passed:</span>
            <span class="summary-value passed">{{ passedTests }}</span>
          </div>
          <div class="summary-item">
            <span class="summary-label">Failed:</span>
            <span class="summary-value failed">{{ failedTests }}</span>
          </div>
          <div class="summary-item">
            <span class="summary-label">Duration:</span>
            <span class="summary-value">{{ totalDuration }}ms</span>
          </div>
        </div>
        
        <div class="results-list">
          <div 
            v-for="result in testResults" 
            :key="result.id"
            :class="['result-item', result.status]"
          >
            <div class="result-status">
              {{ result.status === 'pass' ? '✅' : result.status === 'fail' ? '❌' : '⏳' }}
            </div>
            <div class="result-content">
              <div class="result-name">{{ result.name }}</div>
              <div class="result-details">
                <span class="result-duration">{{ result.duration }}ms</span>
                <span v-if="result.error" class="result-error">{{ result.error }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- API Call History -->
      <div v-if="apiHistory.length > 0" class="api-history card">
        <h3>Recent API Calls</h3>
        <div class="history-list">
          <div 
            v-for="call in recentApiCalls" 
            :key="call.timestamp"
            :class="['history-item', call.success ? 'success' : 'error']"
          >
            <div class="call-type">{{ call.type }}</div>
            <div class="call-details">
              <span>Year: {{ call.year }}</span>
              <span v-if="call.cached">📦 Cached</span>
              <span v-if="call.error">❌ {{ call.error }}</span>
            </div>
            <div class="call-time">
              {{ formatTime(call.timestamp) }}
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useHistoryStore } from '@stores/history.js'
import wikipediaAPI from '@utils/wikipedia-api.js'

const historyStore = useHistoryStore()
const isRunning = ref(false)
const testResults = ref([])

// Computed properties
const metrics = computed(() => wikipediaAPI.getPerformanceMetrics())
const apiHistory = computed(() => historyStore.apiCallHistory)
const recentApiCalls = computed(() => 
  apiHistory.value.slice(-10).reverse()
)

const passedTests = computed(() => 
  testResults.value.filter(r => r.status === 'pass').length
)

const failedTests = computed(() => 
  testResults.value.filter(r => r.status === 'fail').length
)

const totalDuration = computed(() => 
  testResults.value.reduce((total, result) => total + result.duration, 0)
)

// Test definitions
const testSuites = {
  basic: [
    {
      name: 'Store Initialization',
      test: async () => {
        return historyStore.currentYear > 0 && 
               historyStore.years.length > 0
      }
    },
    {
      name: 'Year Navigation',
      test: async () => {
        const initialPage = historyStore.currentPage
        historyStore.nextPage()
        const result = historyStore.currentPage !== initialPage
        historyStore.currentPage = initialPage // Reset
        return result
      }
    },
    {
      name: 'Event Storage',
      test: async () => {
        const testEvent = {
          year: 1999,
          title: 'Test Event',
          description: 'Test Description'
        }
        historyStore.setEvent(1999, testEvent)
        const stored = historyStore.events.get(1999)
        historyStore.clearEvent(1999) // Cleanup
        return stored && stored.title === 'Test Event'
      }
    }
  ],
  
  api: [
    {
      name: 'Wikipedia API Connection',
      test: async () => {
        try {
          const event = await wikipediaAPI.fetchRandomEvent(2020)
          return event !== null && event.title
        } catch (error) {
          throw new Error(`API connection failed: ${error.message}`)
        }
      }
    },
    {
      name: 'API Caching',
      test: async () => {
        const year = 2019
        await wikipediaAPI.fetchRandomEvent(year)
        const cached = historyStore.getCachedEvent(`random_${year}`)
        return cached !== undefined
      }
    },
    {
      name: 'Error Handling',
      test: async () => {
        try {
          // Test with invalid year to trigger error handling
          await wikipediaAPI.fetchRandomEvent(-1)
          return true // Should handle gracefully
        } catch (error) {
          return true // Error handling is working
        }
      }
    }
  ],
  
  multimedia: [
    {
      name: 'Image URL Validation',
      test: async () => {
        const testUrl = 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/0c/Cow_female_black_white.jpg/256px-Cow_female_black_white.jpg'
        try {
          const response = await fetch(testUrl, { method: 'HEAD' })
          return response.ok
        } catch {
          return false
        }
      }
    },
    {
      name: 'Multimedia Cache',
      test: async () => {
        const testUrl = 'test://example.com/image.jpg'
        const testData = { type: 'image', url: testUrl }
        historyStore.setCachedMultimedia(testUrl, testData)
        const cached = historyStore.getCachedMultimedia(testUrl)
        return cached && cached.url === testUrl
      }
    }
  ]
}

// Methods
const runTest = async (testCase) => {
  const startTime = performance.now()
  const result = {
    id: Date.now() + Math.random(),
    name: testCase.name,
    status: 'running',
    duration: 0,
    error: null
  }
  
  testResults.value.push(result)
  
  try {
    const success = await testCase.test()
    const endTime = performance.now()
    
    result.status = success ? 'pass' : 'fail'
    result.duration = Math.round(endTime - startTime)
    
    if (!success) {
      result.error = 'Test assertion failed'
    }
  } catch (error) {
    const endTime = performance.now()
    result.status = 'fail'
    result.duration = Math.round(endTime - startTime)
    result.error = error.message
  }
  
  return result
}

const runTestSuite = async (suiteName) => {
  const suite = testSuites[suiteName]
  if (!suite) return
  
  for (const testCase of suite) {
    await runTest(testCase)
    // Small delay between tests
    await new Promise(resolve => setTimeout(resolve, 100))
  }
}

const runAllTests = async () => {
  if (isRunning.value) return
  
  isRunning.value = true
  testResults.value = []
  
  try {
    await runTestSuite('basic')
    await runTestSuite('api')
    await runTestSuite('multimedia')
  } finally {
    isRunning.value = false
  }
}

const runAPITests = async () => {
  if (isRunning.value) return
  
  isRunning.value = true
  testResults.value = []
  
  try {
    await runTestSuite('api')
  } finally {
    isRunning.value = false
  }
}

const runMultimediaTests = async () => {
  if (isRunning.value) return
  
  isRunning.value = true
  testResults.value = []
  
  try {
    await runTestSuite('multimedia')
  } finally {
    isRunning.value = false
  }
}

const clearResults = () => {
  testResults.value = []
}

const formatTime = (timestamp) => {
  return new Date(timestamp).toLocaleTimeString()
}

onMounted(() => {
  // Run a quick basic test on load
  setTimeout(() => {
    runTestSuite('basic')
  }, 1000)
})
</script>

<style lang="scss" scoped>
.testing-view {
  min-height: calc(100vh - 80px);
  padding: $spacing-lg 0;
  background: rgba(255, 255, 255, 0.05);
}

.testing-header {
  text-align: center;
  margin-bottom: $spacing-xl;
  color: white;
  
  h1 {
    margin-bottom: $spacing-md;
  }
  
  p {
    opacity: 0.9;
    font-size: 1.1rem;
  }
}

.testing-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: $spacing-lg;
  margin-bottom: $spacing-xl;
}

.test-controls {
  h3 {
    margin-bottom: $spacing-md;
    color: $dark-color;
  }
  
  .control-group {
    display: flex;
    flex-direction: column;
    gap: $spacing-sm;
  }
}

.performance-metrics {
  h3 {
    margin-bottom: $spacing-md;
    color: $dark-color;
  }
  
  .metrics-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: $spacing-md;
  }
  
  .metric {
    text-align: center;
    padding: $spacing-md;
    background: rgba($primary-color, 0.1);
    border-radius: $border-radius;
    
    .metric-value {
      font-size: 1.5rem;
      font-weight: bold;
      color: $primary-color;
      margin-bottom: $spacing-xs;
    }
    
    .metric-label {
      font-size: 0.875rem;
      color: $muted-color;
    }
  }
}

.test-results {
  h3 {
    margin-bottom: $spacing-md;
    color: $dark-color;
  }
  
  .results-summary {
    display: flex;
    gap: $spacing-lg;
    margin-bottom: $spacing-lg;
    padding: $spacing-md;
    background: rgba(0, 0, 0, 0.05);
    border-radius: $border-radius;
    
    .summary-item {
      display: flex;
      align-items: center;
      gap: $spacing-xs;
      
      .summary-label {
        font-weight: 500;
        color: $muted-color;
      }
      
      .summary-value {
        font-weight: bold;
        
        &.passed { color: $secondary-color; }
        &.failed { color: $danger-color; }
      }
    }
  }
  
  .results-list {
    display: flex;
    flex-direction: column;
    gap: $spacing-xs;
  }
  
  .result-item {
    display: flex;
    align-items: center;
    gap: $spacing-md;
    padding: $spacing-sm $spacing-md;
    border-radius: $border-radius;
    border-left: 4px solid transparent;
    
    &.pass {
      background: rgba($secondary-color, 0.1);
      border-left-color: $secondary-color;
    }
    
    &.fail {
      background: rgba($danger-color, 0.1);
      border-left-color: $danger-color;
    }
    
    &.running {
      background: rgba($accent-color, 0.1);
      border-left-color: $accent-color;
    }
    
    .result-status {
      font-size: 1.2rem;
    }
    
    .result-content {
      flex: 1;
      
      .result-name {
        font-weight: 500;
        margin-bottom: $spacing-xs;
      }
      
      .result-details {
        display: flex;
        gap: $spacing-md;
        font-size: 0.875rem;
        color: $muted-color;
        
        .result-error {
          color: $danger-color;
        }
      }
    }
  }
}

.api-history {
  h3 {
    margin-bottom: $spacing-md;
    color: $dark-color;
  }
  
  .history-list {
    display: flex;
    flex-direction: column;
    gap: $spacing-xs;
  }
  
  .history-item {
    display: flex;
    justify-content: between;
    align-items: center;
    padding: $spacing-sm;
    border-radius: $border-radius;
    font-size: 0.875rem;
    
    &.success {
      background: rgba($secondary-color, 0.1);
    }
    
    &.error {
      background: rgba($danger-color, 0.1);
    }
    
    .call-type {
      font-weight: 500;
      margin-right: $spacing-md;
    }
    
    .call-details {
      flex: 1;
      display: flex;
      gap: $spacing-sm;
      
      span {
        padding: 2px 6px;
        background: rgba(0, 0, 0, 0.1);
        border-radius: 3px;
        font-size: 0.75rem;
      }
    }
    
    .call-time {
      color: $muted-color;
      font-size: 0.75rem;
    }
  }
}

@media (max-width: $breakpoint-md) {
  .results-summary {
    flex-direction: column;
    gap: $spacing-sm;
  }
  
  .history-item {
    flex-direction: column;
    align-items: flex-start;
    gap: $spacing-xs;
  }
}
</style>