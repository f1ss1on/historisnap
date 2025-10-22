<template>
  <div class="history-explorer">
    <div class="container">
      <!-- Search and Controls -->
      <div class="controls-section">
        <div class="search-controls">
          <input 
            v-model="searchQuery"
            type="text" 
            class="search-input"
            placeholder="Search events or years..."
            @keyup.enter="handleSearch"
          />
          <button @click="getRandomEvent" class="btn btn-secondary">
            🎲 Random Event
          </button>
          <button @click="goToCurrentYear" class="btn btn-outline">
            📅 Current Year
          </button>
        </div>
      </div>

      <div class="explorer-layout">
        <!-- Event Display -->
        <div class="event-display">
          <div v-if="currentEvent" class="event-content">
            <div class="event-year">{{ selectedYear }}</div>
            <h2 class="event-title">{{ currentEvent.title }}</h2>
            <p class="event-description">{{ currentEvent.description }}</p>
            
            <div v-if="currentEvent.multimedia" class="multimedia-section">
              <img 
                :src="currentEvent.multimedia.url" 
                :alt="currentEvent.multimedia.description"
                class="event-image"
                @click="openMediaModal"
              />
            </div>
            
            <div class="event-meta">
              <a :href="currentEvent.source" target="_blank" class="source-link">
                📖 View Source
              </a>
              <span class="event-timestamp">
                Loaded {{ formatTimestamp(currentEvent.timestamp) }}
              </span>
            </div>
          </div>
          
          <div v-else class="empty-state">
            <div class="empty-icon">🏛️</div>
            <h3>Select a year to explore</h3>
            <p>Choose a year from the timeline below to discover historical events</p>
          </div>
        </div>

        <!-- Year Navigation -->
        <div class="year-navigation card">
          <div class="nav-header">
            <div class="nav-controls">
              <button @click="prevPage" :disabled="currentPage <= 1" class="btn btn-sm">
                ← Previous
              </button>
              <span class="page-info">
                Page {{ currentPage }} of {{ totalPages }}
              </span>
              <button @click="nextPage" :disabled="currentPage >= totalPages" class="btn btn-sm">
                Next →
              </button>
            </div>
          </div>
          
          <div class="years-grid">
            <button 
              v-for="year in years" 
              :key="year"
              @click="selectYear(year)"
              :class="['year-button', { active: year === selectedYear }]"
            >
              {{ year }}
            </button>
          </div>
          
          <div class="nav-footer">
            <span class="year-range">{{ years[0] }} — {{ years[years.length - 1] }}</span>
            <span class="total-years">{{ years.length }} years</span>
          </div>
        </div>
      </div>

      <!-- Loading State -->
      <div v-if="isLoading" class="loading-overlay">
        <div class="loading-spinner"></div>
        <p>Loading historical event...</p>
      </div>
    </div>

    <!-- Media Modal -->
    <MediaModal 
      v-if="showMediaModal"
      :media="currentEvent?.multimedia"
      @close="closeMediaModal"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useHistoryStore } from '@stores/history.js'
import wikipediaAPI from '@utils/wikipedia-api.js'
import MediaModal from '@components/MediaModal.vue'

const historyStore = useHistoryStore()
const showMediaModal = ref(false)

// Computed properties from store
const searchQuery = computed({
  get: () => historyStore.searchQuery,
  set: (value) => historyStore.searchQuery = value
})

const currentEvent = computed(() => historyStore.currentEvent)
const selectedYear = computed(() => historyStore.selectedYear)
const isLoading = computed(() => historyStore.isLoading)
const years = computed(() => historyStore.years)
const currentPage = computed(() => historyStore.currentPage)
const totalPages = computed(() => historyStore.totalPages)

// Methods
const selectYear = async (year) => {
  historyStore.setSelectedYear(year)
  
  // Check if we already have an event for this year
  if (!historyStore.events.has(year)) {
    await fetchEventForYear(year)
  }
}

const fetchEventForYear = async (year) => {
  try {
    const event = await wikipediaAPI.fetchRandomEvent(year)
    if (event) {
      historyStore.setEvent(year, event)
    }
  } catch (error) {
    console.error('Failed to fetch event:', error)
    historyStore.setError(`Failed to load event for ${year}`)
  }
}

const getRandomEvent = async () => {
  const randomYear = historyStore.getRandomYear()
  await fetchEventForYear(randomYear)
}

const goToCurrentYear = () => {
  historyStore.goToCurrentYear()
}

const prevPage = () => {
  historyStore.prevPage()
}

const nextPage = () => {
  historyStore.nextPage()
}

const handleSearch = () => {
  // Implementation for search functionality
  console.log('Searching for:', searchQuery.value)
}

const openMediaModal = () => {
  showMediaModal.value = true
}

const closeMediaModal = () => {
  showMediaModal.value = false
}

const formatTimestamp = (timestamp) => {
  return new Date(timestamp).toLocaleString()
}

onMounted(() => {
  // Load a random event on first visit
  if (!historyStore.selectedYear) {
    getRandomEvent()
  }
})
</script>

<style lang="scss" scoped>
.history-explorer {
  min-height: calc(100vh - 80px);
  padding: $spacing-lg 0;
}

.controls-section {
  margin-bottom: $spacing-xl;
}

.search-controls {
  display: flex;
  gap: $spacing-md;
  align-items: center;
  flex-wrap: wrap;
  
  .search-input {
    flex: 1;
    min-width: 300px;
    padding: $spacing-sm $spacing-md;
    border: 2px solid rgba(255, 255, 255, 0.3);
    border-radius: $border-radius;
    background: rgba(255, 255, 255, 0.9);
    font-size: 1rem;
    
    &:focus {
      outline: none;
      border-color: $primary-color;
      background: white;
    }
  }
}

.explorer-layout {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: $spacing-xl;
  
  @media (max-width: $breakpoint-md) {
    grid-template-columns: 1fr;
  }
}

.event-display {
  background: rgba(255, 255, 255, 0.95);
  border-radius: $border-radius-lg;
  padding: $spacing-xl;
  backdrop-filter: blur(10px);
  box-shadow: $shadow-lg;
}

.event-content {
  .event-year {
    font-size: 3rem;
    font-weight: bold;
    color: $primary-color;
    margin-bottom: $spacing-md;
  }
  
  .event-title {
    color: $dark-color;
    margin-bottom: $spacing-md;
  }
  
  .event-description {
    line-height: 1.8;
    margin-bottom: $spacing-lg;
    color: #555;
  }
  
  .multimedia-section {
    margin-bottom: $spacing-lg;
    
    .event-image {
      max-width: 100%;
      height: auto;
      border-radius: $border-radius;
      cursor: pointer;
      transition: $transition-base;
      
      &:hover {
        transform: scale(1.02);
        box-shadow: $shadow-lg;
      }
    }
  }
  
  .event-meta {
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-wrap: wrap;
    gap: $spacing-md;
    padding-top: $spacing-md;
    border-top: 1px solid rgba(0, 0, 0, 0.1);
    
    .source-link {
      color: $primary-color;
      font-weight: 500;
    }
    
    .event-timestamp {
      font-size: 0.875rem;
      color: $muted-color;
    }
  }
}

.empty-state {
  text-align: center;
  padding: $spacing-xl;
  color: $muted-color;
  
  .empty-icon {
    font-size: 4rem;
    margin-bottom: $spacing-lg;
  }
  
  h3 {
    color: $dark-color;
    margin-bottom: $spacing-md;
  }
}

.year-navigation {
  .nav-header {
    padding: $spacing-md;
    border-bottom: 1px solid rgba(0, 0, 0, 0.1);
  }
  
  .nav-controls {
    display: flex;
    justify-content: space-between;
    align-items: center;
    
    .page-info {
      font-size: 0.875rem;
      color: $muted-color;
    }
  }
  
  .years-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: $spacing-xs;
    padding: $spacing-md;
    
    .year-button {
      padding: $spacing-sm;
      border: 1px solid rgba(0, 0, 0, 0.1);
      background: white;
      border-radius: $border-radius;
      cursor: pointer;
      transition: $transition-base;
      font-weight: 500;
      
      &:hover {
        background: rgba($primary-color, 0.1);
        border-color: $primary-color;
      }
      
      &.active {
        background: $primary-color;
        color: white;
        border-color: $primary-color;
      }
    }
  }
  
  .nav-footer {
    display: flex;
    justify-content: space-between;
    padding: $spacing-md;
    font-size: 0.875rem;
    color: $muted-color;
    border-top: 1px solid rgba(0, 0, 0, 0.1);
  }
}

.loading-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  color: white;
  
  .loading-spinner {
    width: 40px;
    height: 40px;
    border: 4px solid rgba(255, 255, 255, 0.3);
    border-top: 4px solid white;
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin-bottom: $spacing-md;
  }
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
</style>