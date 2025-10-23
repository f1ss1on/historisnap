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
            :disabled="isLoading"
            @keyup.enter="handleSearch"
          />
          <button @click="getRandomEvent" class="btn btn-secondary">
            🎲 Random Event
          </button>
          
          <!-- Calendar Picker -->
          <div class="calendar-picker-container header-calendar">
            <button @click="toggleCalendarPicker" class="btn btn-outline calendar-trigger">
              📅 Select Date
              <span class="picker-arrow" :class="{ 'open': showCalendarPicker }">▼</span>
            </button>
            
            <div v-if="showCalendarPicker" class="calendar-picker full-calendar">
              <div class="calendar-header">
                <h5>Select Historical Date</h5>
                <div class="selected-date">
                  {{ formatSelectedDate() }}
                </div>
              </div>
              
              <div class="calendar-content">
                <!-- Inline Date Selectors -->
                <div class="date-selectors">
                  <div class="selector-group">
                    <label>Century</label>
                    <select v-model="selectedCentury" @change="selectCentury(selectedCentury)" class="date-select">
                      <option 
                        v-for="century in availableCenturies" 
                        :key="century" 
                        :value="century"
                      >
                        {{ formatCenturyLabel(century) }}
                      </option>
                    </select>
                  </div>
                  
                  <div class="selector-group">
                    <label>Decade</label>
                    <select v-model="calendarDecade" @change="selectCalendarDecade(calendarDecade)" class="date-select">
                      <option 
                        v-for="decade in availableDecades" 
                        :key="decade" 
                        :value="decade"
                      >
                        {{ formatDecadeLabel(decade) }}
                      </option>
                    </select>
                  </div>
                  
                  <div class="selector-group">
                    <label>Year</label>
                    <select v-model="calendarYear" @change="selectCalendarYear(calendarYear)" class="date-select">
                      <option 
                        v-for="year in availableYears" 
                        :key="year" 
                        :value="year"
                      >
                        {{ year }}
                      </option>
                    </select>
                  </div>
                  
                  <div class="selector-group">
                    <label>Month</label>
                    <select v-model="selectedMonth" @change="selectCalendarMonth(selectedMonth)" class="date-select">
                      <option 
                        v-for="month in availableMonths" 
                        :key="month" 
                        :value="month"
                      >
                        {{ getMonthName(month) }}
                      </option>
                    </select>
                  </div>
                </div>
                
                <!-- Day Selection Grid -->
                <div class="calendar-section">
                  <h6>Day</h6>
                  <div class="calendar-grid dates">
                    <button 
                      v-for="day in availableDays" 
                      :key="day"
                      @click="selectCalendarDate(day)"
                      class="calendar-item"
                      :class="{ 'active': day === selectedDay }"
                    >
                      {{ day }}
                    </button>
                  </div>
                </div>
                
                <!-- Action Buttons -->
                <div class="calendar-actions">
                  <button @click="goToToday" class="calendar-action-btn today-btn">
                    📅 Today
                  </button>
                  <button @click="applySelectedDate" class="calendar-action-btn apply-btn">
                    ✓ Go to Date
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="explorer-layout">
        <!-- Main Event Display -->
        <div class="main-display">
          <div class="event-display">
            <div v-if="currentEvent" class="event-content">
              <div class="event-header">
                <div class="this-day-label">This day in</div>
                <div class="event-year">{{ selectedYear }}</div>
                <div class="event-date" v-if="currentEvent.date">{{ currentEvent.date }}</div>
              </div>
              
              <div class="event-body">
                <h2 class="event-title" v-if="currentEvent.name">{{ currentEvent.name }}</h2>
                <p class="event-description">{{ currentEvent.text || currentEvent.description }}</p>
                
                <div v-if="currentEvent.media || currentEvent.multimedia" class="multimedia-section">
                  <div class="media-thumbnail" @click="openMediaModal">
                    <img 
                      v-if="(currentEvent.media?.type || currentEvent.multimedia?.type) === 'image'"
                      :src="currentEvent.media?.url || currentEvent.multimedia?.url" 
                      :alt="currentEvent.media?.description || currentEvent.multimedia?.description || 'Historical image'"
                      class="event-image"
                    />
                    <div v-else-if="(currentEvent.media?.type || currentEvent.multimedia?.type) === 'audio'" class="audio-indicator">
                      🎵 {{ currentEvent.media?.title || currentEvent.multimedia?.title || 'Historical Audio' }}
                    </div>
                    <div v-else-if="(currentEvent.media?.type || currentEvent.multimedia?.type) === 'video'" class="video-indicator">
                      🎬 {{ currentEvent.media?.title || currentEvent.multimedia?.title || 'Historical Video' }}
                    </div>
                    <div class="media-overlay">
                      <span>Click to {{ (currentEvent.media?.type || currentEvent.multimedia?.type) === 'image' ? 'view' : 'play' }}</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div class="event-footer">
                <div class="event-meta">
                  <span class="event-source">{{ currentEvent.source || 'Historical Record' }}</span>
                  <button class="btn btn-sm" @click="fetchEventForCurrentYear">
                    🔄 New Event
                  </button>
                </div>
              </div>
            </div>
            
            <div v-else class="empty-state">
              <div class="empty-icon">📷</div>
              <h3>Ready to snap into history?</h3>
              <p>Select a year from the timeline to discover fascinating historical events</p>
              <button @click="getRandomEvent" class="btn btn-primary">
                🎲 Random Historical Moment
              </button>
            </div>
          </div>
        </div>

        <!-- Year Navigation Sidebar -->
        <div class="sidebar">
          <div class="year-navigation">
            <div class="nav-header">
              <h3>Timeline Navigator</h3>
              <div class="decade-controls">
                <button @click="prevDecadePage" :disabled="currentDecadePage <= 0" class="btn btn-sm">
                  ←
                </button>
                <div class="decade-buttons">
                  <button 
                    v-for="decade in visibleDecades" 
                    :key="`decade-${decade}`"
                    @click="selectDecade(decade)"
                    :class="decade === selectedDecade ? 'decade-button active' : 'decade-button'"
                    :disabled="isLoading"
                  >
                    {{ formatDecadeLabel(decade) }}
                  </button>
                </div>
                <button @click="nextDecadePage" :disabled="currentDecadePage >= maxDecadePage" class="btn btn-sm">
                  →
                </button>
              </div>
            </div>
            
            <div class="years-grid">
              <button 
                v-for="year in decadeYears" 
                :key="`year-${year}`"
                @click="selectYear(year)"
                :class="year === selectedYear ? 'year-button active' : 'year-button'"
                :disabled="isLoading"
                :title="`Explore events from ${year}`"
              >
                {{ year }}
              </button>
            </div>
            
            <div class="nav-footer">
              <div class="range-info">
                <span class="year-range" v-if="decadeYears && decadeYears.length > 0">
                  {{ selectedDecade }}s — {{ decadeYears[0] }} to {{ decadeYears[decadeYears.length - 1] }}
                </span>
                <span class="total-count">{{ decadeYears?.length || 0 }} years in decade</span>
              </div>
            </div>
          </div>
          
          <!-- Quick Actions -->
          <div class="quick-actions">
            <h4>Quick Actions</h4>
            


            
            <button @click="goToCurrentYear" class="action-btn">
              � Current Year ({{ new Date().getFullYear() }})
            </button>
            <button @click="goToRandomDecade" class="action-btn">
              🎯 Random Decade
            </button>
            <button @click="goToHistoricalPeriod" class="action-btn">
              🏛️ Major Events
            </button>
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
      :media="currentEvent?.multimedia || currentEvent?.media"
      @close="closeMediaModal"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick, shallowRef, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useHistoryStore } from '@stores/history.js'
import wikipediaAPI from '@utils/wikipedia-api.js'
import MediaModal from '@components/MediaModal.vue'

const historyStore = useHistoryStore()
const router = useRouter()
const showMediaModal = ref(false)

// Performance optimization: Use shallowRef for frequently changing data
const searchTimeout = shallowRef(null)

// Decade navigation state
const currentDecadePage = ref(0)
const selectedDecade = ref(Math.floor(new Date().getFullYear() / 10) * 10) // Default to current decade

// Calendar picker state
const showCalendarPicker = ref(false)
const calendarLevel = ref('year') // 'century', 'decade', 'year', 'month', 'date'
const selectedCentury = ref(20) // 20th century (1900-1999)
const selectedMonth = ref(new Date().getMonth() + 1)
const selectedDay = ref(new Date().getDate())
const calendarYear = ref(new Date().getFullYear())
const calendarDecade = ref(Math.floor(new Date().getFullYear() / 10) * 10)

// Computed properties from store with performance optimizations
const searchQuery = computed({
  get: () => historyStore.searchQuery,
  set: (value) => {
    // Debounce search to prevent excessive API calls
    if (searchTimeout.value) {
      clearTimeout(searchTimeout.value)
    }
    searchTimeout.value = setTimeout(() => {
      historyStore.searchQuery = value
    }, 300)
  }
})

// Use shallow computed for better performance on frequently accessed properties
const currentEvent = computed(() => historyStore.currentEvent)
const selectedYear = computed(() => historyStore.selectedYear)
const isLoading = computed(() => historyStore.isLoading)
const currentPage = computed(() => historyStore.currentPage)
const totalPages = computed(() => historyStore.totalPages)

// Cached values for better performance
const currentYear = new Date().getFullYear()

// Optimized computed properties with memoization
const paginatedYears = computed(() => {
  const page = currentPage.value
  if (!page || page < 1) {
    return []
  }
  
  const start = 1900 + (page - 1) * 10
  const end = Math.min(start + 9, currentYear)
  const yearCount = end - start + 1
  
  if (yearCount <= 0) {
    return []
  }
  
  // Create array more efficiently
  const years = []
  for (let i = 0; i < yearCount; i++) {
    years.push(start + i)
  }
  return years
})

const totalYears = currentYear - 1900 + 1 // Static calculation

// Decade-based navigation computed properties
const allDecades = computed(() => {
  const decades = []
  
  // Add BC decades (going backwards from 1 BC to 3000 BC)
  // Note: BC years are represented as negative numbers
  for (let decade = -1; decade >= -3000; decade -= 10) {
    decades.push(decade)
  }
  
  // Add AD decades starting from 1 AD
  decades.push(1)
  
  // Then add proper decade boundaries: 10, 20, 30, ..., 1900, 1910, 1920, etc.
  for (let decade = 10; decade <= currentYear; decade += 10) {
    decades.push(decade)
  }
  
  return decades
})

const visibleDecades = computed(() => {
  const decadesPerPage = 3
  const start = currentDecadePage.value * decadesPerPage
  return allDecades.value.slice(start, start + decadesPerPage)
})

const maxDecadePage = computed(() => {
  const decadesPerPage = 3
  return Math.max(0, Math.ceil(allDecades.value.length / decadesPerPage) - 1)
})

const decadeYears = computed(() => {
  const startYear = selectedDecade.value
  const endYear = Math.min(startYear + 9, currentYear)
  
  const years = []
  for (let year = startYear; year <= endYear; year++) {
    years.push(year)
  }
  return years
})

// Calendar picker computed properties
const availableCenturies = computed(() => {
  const centuries = []
  // Add BC centuries (30th century BC to 1st century BC)
  for (let century = -30; century <= -1; century++) {
    centuries.push(century)
  }
  // Add AD centuries (1st century AD to 21st century AD)
  for (let century = 1; century <= 21; century++) {
    centuries.push(century)
  }
  return centuries
})

const availableDecades = computed(() => {
  const decades = []
  
  if (selectedCentury.value < 0) {
    // BC century
    const absCentury = Math.abs(selectedCentury.value)
    const startYear = -(absCentury * 100)
    const endYear = -((absCentury - 1) * 100 + 1)
    
    for (let year = startYear; year <= endYear; year += 10) {
      if (year <= 0) {
        decades.push(year)
      }
    }
  } else {
    // AD century
    const startYear = (selectedCentury.value - 1) * 100 + 1
    const endYear = Math.min(selectedCentury.value * 100, currentYear)
    
    for (let year = startYear; year <= endYear; year += 10) {
      const decade = Math.floor(year / 10) * 10
      if (!decades.includes(decade)) {
        decades.push(decade)
      }
    }
  }
  
  return decades.sort((a, b) => a - b)
})

const availableYears = computed(() => {
  const years = []
  const startYear = calendarDecade.value
  
  if (startYear < 0) {
    // BC years: count backwards (e.g., -100 to -91)
    const endYear = Math.max(startYear + 9, -3000) // Don't go beyond 3000 BC
    for (let year = startYear; year <= endYear; year++) {
      years.push(year)
    }
  } else {
    // AD years: count forwards
    const endYear = Math.min(startYear + 9, currentYear)
    for (let year = startYear; year <= endYear; year++) {
      years.push(year)
    }
  }
  
  return years
})

const availableMonths = computed(() => {
  return Array.from({ length: 12 }, (_, i) => i + 1)
})

const availableDays = computed(() => {
  const daysInMonth = getDaysInMonth(calendarYear.value, selectedMonth.value)
  return Array.from({ length: daysInMonth }, (_, i) => i + 1)
})

// Optimized methods with performance improvements
const selectYear = async (year) => {
  // Prevent double-clicking issues
  if (isLoading.value) return
  
  historyStore.setSelectedYear(year)
  
  // Update decade navigation to match selected year
  const yearDecade = Math.floor(year / 10) * 10
  if (selectedDecade.value !== yearDecade) {
    selectedDecade.value = yearDecade
    syncDecadePage()
  }
  
  // Check if we already have an event for this year (optimized check)
  const events = historyStore.events
  if (events && events.has && events.has(year)) {
    return // Event already exists, no need to fetch
  }
  
  // Use nextTick to ensure DOM updates before API call
  await nextTick()
  await fetchEventForYear(year)
}

const fetchEventForYear = async (year) => {
  // Prevent concurrent API calls for the same year
  if (historyStore.isLoading) return
  
  try {
    historyStore.setLoading(true)
    const event = await wikipediaAPI.fetchRandomEvent(year)
    if (event) {
      historyStore.setEvent(year, event)
    }
  } catch (error) {
    console.error('Failed to fetch event:', error)
    historyStore.setError(`Failed to load event for ${year}`)
  } finally {
    historyStore.setLoading(false)
  }
}

const getRandomEvent = async () => {
  if (isLoading.value) return
  
  const randomYear = historyStore.getRandomYear()
  await fetchEventForYear(randomYear)
}

const goToCurrentYear = async () => {
  // Update decade navigation to current decade
  const currentDecade = Math.floor(currentYear / 10) * 10
  selectedDecade.value = currentDecade
  
  // Set decade page to show current decade
  const decadeIndex = allDecades.value.indexOf(currentDecade)
  if (decadeIndex >= 0) {
    currentDecadePage.value = Math.floor(decadeIndex / 3)
  }
  
  // Update store to current year and fetch event
  historyStore.setSelectedYear(currentYear)
  await fetchEventForYear(currentYear)
}

const prevPage = () => {
  historyStore.prevPage()
}

const nextPage = () => {
  historyStore.nextPage()
}

// Decade navigation methods
const selectDecade = (decade) => {
  selectedDecade.value = decade
}

const prevDecadePage = () => {
  if (currentDecadePage.value > 0) {
    currentDecadePage.value--
  }
}

const nextDecadePage = () => {
  if (currentDecadePage.value < maxDecadePage.value) {
    currentDecadePage.value++
  }
}

const fetchEventForCurrentYear = async () => {
  if (selectedYear.value) {
    await fetchEventForYear(selectedYear.value)
  }
}

const fetchEventForTodaysDate = async (requestedYear, month, day) => {
  if (historyStore.isLoading) return
  
  try {
    historyStore.setLoading(true)
    // Use the Wikipedia OnThisDay API for the specific date
    const event = await wikipediaAPI.fetchEventsFromSpecificDate(requestedYear, month, day)
    if (event) {
      // Use the actual year from the event, not the requested year
      const actualYear = event.year
      historyStore.setSelectedYear(actualYear)
      historyStore.setEvent(actualYear, event)
      
      // Update navigation to reflect the actual year
      const actualDecade = Math.floor(actualYear / 10) * 10
      selectedDecade.value = actualDecade
      
      const decadeIndex = allDecades.value.indexOf(actualDecade)
      if (decadeIndex >= 0) {
        currentDecadePage.value = Math.floor(decadeIndex / 3)
      }
    }
  } catch (error) {
    console.error('Failed to fetch event for today:', error)
    // Fallback to regular random event if today's date fails
    await fetchEventForYear(requestedYear)
  } finally {
    historyStore.setLoading(false)
  }
}

const goToRandomDecade = async () => {
  // Pick a random decade from available decades
  const randomDecadeIndex = Math.floor(Math.random() * allDecades.value.length)
  const randomDecade = allDecades.value[randomDecadeIndex]
  
  // Update navigation to show the selected decade
  selectedDecade.value = randomDecade
  const decadeIndex = allDecades.value.indexOf(randomDecade)
  if (decadeIndex >= 0) {
    currentDecadePage.value = Math.floor(decadeIndex / 3)
  }
  
  // Pick a random year from that decade
  const yearInDecade = randomDecade + Math.floor(Math.random() * 10)
  const clampedYear = Math.min(yearInDecade, currentYear)
  
  historyStore.setSelectedYear(clampedYear)
  await fetchEventForYear(clampedYear)
}

const goToHistoricalPeriod = async () => {
  console.log('🔥 Major Events button clicked!')
  
  // Curated list of major historical events with specific dates
  const majorEvents = [
    { year: 2001, month: 9, day: 11, title: "September 11 Attacks" },
    { year: 1989, month: 11, day: 9, title: "Fall of the Berlin Wall" },
    { year: 1969, month: 7, day: 20, title: "Moon Landing" },
    { year: 1963, month: 11, day: 22, title: "JFK Assassination" },
    { year: 1945, month: 8, day: 6, title: "Hiroshima Atomic Bomb" },
    { year: 1945, month: 5, day: 8, title: "VE Day - End of WWII in Europe" },
    { year: 1941, month: 12, day: 7, title: "Pearl Harbor Attack" },
    { year: 1937, month: 5, day: 6, title: "Hindenburg Disaster" },
    { year: 1929, month: 10, day: 29, title: "Black Tuesday - Stock Market Crash" },
    { year: 1918, month: 11, day: 11, title: "WWI Armistice" },
    { year: 1914, month: 6, day: 28, title: "Assassination of Archduke Franz Ferdinand" },
    { year: 1912, month: 4, day: 15, title: "Titanic Sinking" },
    { year: 1906, month: 4, day: 18, title: "San Francisco Earthquake" },
    { year: 1865, month: 4, day: 14, title: "Lincoln Assassination" },
    { year: 1863, month: 11, day: 19, title: "Gettysburg Address" },
    { year: 1776, month: 7, day: 4, title: "Declaration of Independence" },
    { year: 1666, month: 9, day: 2, title: "Great Fire of London" },
    { year: 1492, month: 10, day: 12, title: "Columbus Reaches the Americas" },
    { year: 1347, month: 10, day: 1, title: "Black Death Arrives in Europe" },
    { year: 79, month: 8, day: 24, title: "Mount Vesuvius Destroys Pompeii" }
  ]
  
  const randomEvent = majorEvents[Math.floor(Math.random() * majorEvents.length)]
  console.log('🎯 Selected major event:', randomEvent)
  
  try {
    historyStore.setLoading(true)
    
    console.log('📡 Fetching event from Wikipedia API...')
    // Try to get the specific historical event for this date
    const event = await wikipediaAPI.fetchEventsFromSpecificDate(randomEvent.year, randomEvent.month, randomEvent.day)
    console.log('📖 Wikipedia API response:', event)
    
    if (event) {
      // Use the actual year from the event
      const actualYear = event.year || randomEvent.year
      console.log('✅ Got event data, setting year to:', actualYear)
      
      historyStore.setSelectedYear(actualYear)
      historyStore.setEvent(actualYear, event)
      
      // Show the event to the user
      currentEvent.value = event
      updateUrlWithEventTitle(event)
      console.log('🎉 Displaying event:', event.name || event.title)
      
      // Update decade navigation to show the decade containing this year
      const yearDecade = Math.floor(actualYear / 10) * 10
      selectedDecade.value = yearDecade
      syncDecadePage()
      
      // Show media modal if available
      if (event.media?.length > 0) {
        await handleViewMedia(event)
      }
    } else {
      console.log('❌ No Wikipedia data, creating custom event')
      // Fallback: create a custom event entry for this major historical event
      const customEvent = {
        year: randomEvent.year,
        name: randomEvent.title,
        text: `On ${randomEvent.month}/${randomEvent.day}/${randomEvent.year} - ${randomEvent.title}. This is one of the most significant events in world history.`,
        date: `${randomEvent.month}/${randomEvent.day}/${randomEvent.year}`,
        source: 'Major Historical Events'
      }
      
      historyStore.setSelectedYear(randomEvent.year)
      historyStore.setEvent(randomEvent.year, customEvent)
      
      // Show the custom event to the user
      currentEvent.value = customEvent
      updateUrlWithEventTitle(customEvent)
      console.log('🎉 Displaying custom event:', customEvent.name)
      
      // Update decade navigation
      const yearDecade = Math.floor(randomEvent.year / 10) * 10
      selectedDecade.value = yearDecade
      syncDecadePage()
    }
    
  } catch (error) {
    console.error('💥 Error fetching major historical event:', error)
    
    // Fallback: create a custom event for the selected major event
    const customEvent = {
      year: randomEvent.year,
      name: randomEvent.title,
      text: `On ${randomEvent.month}/${randomEvent.day}/${randomEvent.year} - ${randomEvent.title}. This is one of the most significant events in world history.`,
      date: `${randomEvent.month}/${randomEvent.day}/${randomEvent.year}`,
      source: 'Major Historical Events'
    }
    
    historyStore.setSelectedYear(randomEvent.year)
    historyStore.setEvent(randomEvent.year, customEvent)
    
    // Show the custom event to the user
    currentEvent.value = customEvent
    updateUrlWithEventTitle(customEvent)
    console.log('🔄 Fallback: Displaying custom event:', customEvent.name)
    
    // Update decade navigation
    const yearDecade = Math.floor(randomEvent.year / 10) * 10
    selectedDecade.value = yearDecade
    syncDecadePage()
  } finally {
    historyStore.setLoading(false)
    console.log('✅ Major Events function completed')
  }
}

const handleSearch = () => {
  // Implementation for search functionality
  console.log('Searching for:', searchQuery.value)
}

// URL Management Functions
const createUrlSlug = (title) => {
  if (!title) return ''
  return title
    .toLowerCase()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/[\s_-]+/g, '-') // Replace spaces and underscores with hyphens
    .replace(/^-+|-+$/g, '') // Remove leading/trailing hyphens
    .substring(0, 100) // Limit length
}

const updateUrlWithEventTitle = (event) => {
  if (!event || (!event.name && !event.title)) return
  
  const title = event.name || event.title
  const slug = createUrlSlug(title)
  
  if (slug) {
    const newPath = `/explorer/${slug}`
    // Only update if the path is different to avoid unnecessary navigation
    if (router.currentRoute.value.path !== newPath) {
      router.replace({
        name: 'HistoryExplorerWithTitle',
        params: { title: slug }
      })
    }
  }
}

const openMediaModal = () => {
  showMediaModal.value = true
}

const closeMediaModal = () => {
  showMediaModal.value = false
}

const formatDecadeLabel = (decade) => {
  if (decade < 0) {
    // BC years (negative numbers)
    const absDecade = Math.abs(decade)
    if (absDecade >= 100) {
      // 100s BC, 200s BC, etc.
      return `${absDecade}s BC`
    } else {
      // 1-99 BC: show as ranges like "91-100 BC"
      const endYear = absDecade + 9
      return `${absDecade}-${endYear} BC`
    }
  } else if (decade >= 1000) {
    // Modern era: 1000s, 1010s, 1900s, etc.
    return `${decade}s`
  } else if (decade >= 100) {
    // Early medieval: 100s, 200s, etc.
    return `${decade}s AD`
  } else {
    // Ancient times: 1-99 AD
    return `${decade}-${decade + 9} AD`
  }
}

const formatCenturyLabel = (century) => {
  if (century < 0) {
    // BC centuries
    const absCentury = Math.abs(century)
    const ordinal = absCentury === 1 ? 'st' : absCentury === 2 ? 'nd' : absCentury === 3 ? 'rd' : 'th'
    return `${absCentury}${ordinal} Century BC`
  } else {
    // AD centuries
    const ordinal = century === 1 ? 'st' : century === 2 ? 'nd' : century === 3 ? 'rd' : 'th'
    return `${century}${ordinal} Century`
  }
}

// Helper function to sync decade page with selected decade
const syncDecadePage = () => {
  const decadeIndex = allDecades.value.indexOf(selectedDecade.value)
  if (decadeIndex >= 0) {
    currentDecadePage.value = Math.floor(decadeIndex / 3)
  } else {
    // If exact decade not found, find the closest one
    let closestIndex = 0
    let minDiff = Math.abs(allDecades.value[0] - selectedDecade.value)
    
    for (let i = 1; i < allDecades.value.length; i++) {
      const diff = Math.abs(allDecades.value[i] - selectedDecade.value)
      if (diff < minDiff) {
        minDiff = diff
        closestIndex = i
      }
    }
    currentDecadePage.value = Math.floor(closestIndex / 3)
  }
}

// Calendar picker methods
const toggleCalendarPicker = () => {
  showCalendarPicker.value = !showCalendarPicker.value
  if (showCalendarPicker.value) {
    // Initialize with current selected year if available
    if (selectedYear.value) {
      calendarYear.value = selectedYear.value
      calendarDecade.value = Math.floor(selectedYear.value / 10) * 10
      selectedCentury.value = Math.ceil(selectedYear.value / 100)
    }
  }
}

const setCalendarLevel = (level) => {
  calendarLevel.value = level
}

const selectCentury = (century) => {
  selectedCentury.value = century
  calendarDecade.value = (century - 1) * 100
}

const selectCalendarDecade = (decade) => {
  calendarDecade.value = decade
  calendarYear.value = decade
}

const selectCalendarYear = (year) => {
  calendarYear.value = year
}

const selectCalendarMonth = (month) => {
  selectedMonth.value = month
}

const selectCalendarDate = (day) => {
  selectedDay.value = day
}

const formatCalendarTitle = () => {
  switch (calendarLevel.value) {
    case 'century':
      return 'Select Century'
    case 'decade':
      return `${selectedCentury.value}${selectedCentury.value === 1 ? 'st' : selectedCentury.value === 2 ? 'nd' : selectedCentury.value === 3 ? 'rd' : 'th'} Century`
    case 'year':
      return `${formatDecadeLabel(calendarDecade.value)}`
    case 'month':
      return `${calendarYear.value}`
    case 'date':
      return `${getMonthName(selectedMonth.value)} ${calendarYear.value}`
    default:
      return 'Calendar'
  }
}

const getMonthName = (month) => {
  const months = ['January', 'February', 'March', 'April', 'May', 'June',
                  'July', 'August', 'September', 'October', 'November', 'December']
  return months[month - 1]
}

const getDaysInMonth = (year, month) => {
  return new Date(year, month, 0).getDate()
}

// New methods for full calendar picker
const formatSelectedDate = () => {
  const centuryText = `${selectedCentury.value}${selectedCentury.value === 1 ? 'st' : selectedCentury.value === 2 ? 'nd' : selectedCentury.value === 3 ? 'rd' : 'th'} Century`
  const decadeText = formatDecadeLabel(calendarDecade.value)
  const monthText = getMonthName(selectedMonth.value)
  
  return `${centuryText} • ${decadeText} • ${calendarYear.value} • ${monthText} ${selectedDay.value}`
}

const goToToday = () => {
  const today = new Date()
  const currentYear = today.getFullYear()
  const currentMonth = today.getMonth() + 1
  const currentDay = today.getDate()
  
  // Update all calendar values to today
  selectedCentury.value = Math.ceil(currentYear / 100)
  calendarDecade.value = Math.floor(currentYear / 10) * 10
  calendarYear.value = currentYear
  selectedMonth.value = currentMonth
  selectedDay.value = currentDay
}

const applySelectedDate = async () => {
  showCalendarPicker.value = false
  
  try {
    historyStore.setLoading(true)
    // Use the selected date to get a historical event
    const event = await wikipediaAPI.fetchEventsFromSpecificDate(calendarYear.value, selectedMonth.value, selectedDay.value)
    if (event) {
      historyStore.setSelectedYear(event.year || calendarYear.value)
      // Update decade navigation to match the selected year
      const eventDecade = Math.floor((event.year || calendarYear.value) / 10) * 10
      selectedDecade.value = eventDecade
      // Update decade page to show the selected decade
      const allDecades = []
      for (let year = 1; year <= new Date().getFullYear(); year += 10) {
        allDecades.push(year)
      }
      const decadeIndex = allDecades.indexOf(eventDecade)
      if (decadeIndex !== -1) {
        currentDecadePage.value = Math.floor(decadeIndex / 3)
      }
    } else {
      // If no specific event found, just navigate to the year
      historyStore.setSelectedYear(calendarYear.value)
      selectedDecade.value = calendarDecade.value
    }
  } catch (error) {
    console.error('Error fetching event for selected date:', error)
    // Fallback to just selecting the year
    historyStore.setSelectedYear(calendarYear.value)
    selectedDecade.value = calendarDecade.value
  } finally {
    historyStore.setLoading(false)
  }
}

const formatTimestamp = (timestamp) => {
  return new Date(timestamp).toLocaleString()
}

// Watch for currentEvent changes and update URL
watch(currentEvent, (newEvent) => {
  if (newEvent) {
    updateUrlWithEventTitle(newEvent)
  }
}, { immediate: false })

onMounted(async () => {
  // Check if we have a title parameter in the route
  const routeTitle = router.currentRoute.value.params.title
  
  if (routeTitle) {
    // If we have a title in the URL, we might want to search for it or just show default content
    // For now, just show the default "today in history" but keep the URL
    console.log('📍 Loaded with URL title:', routeTitle)
  }
  
  // Get today's date
  const today = new Date()
  const currentMonth = today.getMonth() + 1 // getMonth() returns 0-11
  const currentDay = today.getDate()
  
  // Fetch event for today's date - the actual year will be determined by the event found
  // The fetchEventForTodaysDate method will update navigation based on the actual event year
  await fetchEventForTodaysDate(null, currentMonth, currentDay)
  
  // Ensure decade pagination is synced with selected decade
  syncDecadePage()
  
  // Add click outside handler for calendar picker
  const handleClickOutside = (event) => {
    const calendarContainer = document.querySelector('.calendar-picker-container')
    if (calendarContainer && !calendarContainer.contains(event.target)) {
      showCalendarPicker.value = false
    }
  }
  document.addEventListener('click', handleClickOutside)
  
  // Cleanup on unmount
  onUnmounted(() => {
    document.removeEventListener('click', handleClickOutside)
  })
})
</script>

<style lang="scss" scoped>
@import "@/assets/styles/variables.scss";

.history-explorer {
  min-height: 100vh;
  background: radial-gradient(
      1000px 400px at 10% 10%,
      rgba(110, 231, 183, 0.06),
      transparent 10%
    ),
    linear-gradient(180deg, rgba(7, 11, 18, 1) 0%, rgba(12, 18, 28, 1) 100%);
  color: #e6eef8;
}

.container {
  max-width: 1100px;
  margin: 0 auto;
  padding: 32px 24px;
  display: grid;
  gap: 20px;
}

.controls-section {
  margin-bottom: 20px;
}

.search-controls {
  display: flex;
  gap: 12px;
  align-items: center;
  flex-wrap: wrap;
  
  .search-input {
    flex: 1;
    min-width: 300px;
    padding: 12px 16px;
    background: linear-gradient(180deg, rgba(255, 255, 255, 0.03), transparent);
    border: 1px solid rgba(255, 255, 255, 0.04);
    border-radius: 12px;
    color: #e6eef8;
    font-size: 1rem;
    font-family: Inter, ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial;
    
    &::placeholder {
      color: #94a3b8;
    }
    
    &:focus {
      outline: none;
      border-color: #6ee7b7;
      background: rgba(255, 255, 255, 0.05);
    }
  }
  
  .btn {
    background: linear-gradient(180deg, rgba(255, 255, 255, 0.03), transparent);
    border: 1px solid rgba(255, 255, 255, 0.04);
    color: #6ee7b7;
    padding: 12px 16px;
    border-radius: 12px;
    cursor: pointer;
    font-weight: 600;
    font-family: Inter, ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial;
    transition: all 0.2s ease;
    
    &:hover {
      background: rgba(110, 231, 183, 0.1);
      border-color: #6ee7b7;
      transform: translateY(-1px);
    }
    
    &:disabled {
      opacity: 0.35;
      cursor: not-allowed;
    }
  }
}

.explorer-layout {
  display: grid;
  grid-template-columns: 1fr 320px;
  gap: 24px;
  align-items: start;
  
  @media (max-width: 1100px) {
    grid-template-columns: 1fr 280px;
    gap: 20px;
  }
  
  @media (max-width: 900px) {
    grid-template-columns: 1fr;
    gap: 24px;
  }
}

.main-display {
  display: flex;
  flex-direction: column;
}

.event-display {
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.03), transparent);
  border: 1px solid rgba(255, 255, 255, 0.04);
  border-radius: 12px;
  padding: 0;
  backdrop-filter: blur(10px);
  min-height: 500px;
  overflow: hidden;
}

.event-content {
  display: flex;
  flex-direction: column;
  height: 100%;
  
  .event-header {
    background: linear-gradient(135deg, rgba(110, 231, 183, 0.1), rgba(16, 185, 129, 0.05));
    border-bottom: 1px solid rgba(110, 231, 183, 0.2);
    padding: 32px 32px 24px 32px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    position: relative;
    
    .this-day-label {
      position: absolute;
      top: 20px;
      left: 35px;
      font-size: 0.9rem;
      color: #94a3b8;
      font-weight: 500;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      opacity: 0.8;
    }
    
    .event-year {
      font-size: 3rem;
      font-weight: bold;
      color: #6ee7b7;
      letter-spacing: -2px;
      text-shadow: 0 0 20px rgba(110, 231, 183, 0.3);
      position: relative;
    }
    
    .event-date {
      color: #94a3b8;
      font-size: 1.1rem;
      font-weight: 500;
      background: rgba(255, 255, 255, 0.05);
      padding: 8px 16px;
      border-radius: 20px;
      border: 1px solid rgba(255, 255, 255, 0.1);
    }
  }
  
  .event-body {
    flex: 1;
    padding: 32px;
    
    .event-title {
      color: #e6eef8;
      margin-bottom: 20px;
      font-size: 1.75rem;
      font-weight: 600;
      line-height: 1.3;
    }
    
    .event-description {
      line-height: 1.7;
      margin-bottom: 24px;
      color: #94a3b8;
      font-size: 1.1rem;
    }
  }
  
  .multimedia-section {
    margin-bottom: 24px;
    
    .media-thumbnail {
      position: relative;
      border-radius: 12px;
      overflow: hidden;
      cursor: pointer;
      transition: all 0.3s ease;
      background: linear-gradient(180deg, rgba(255, 255, 255, 0.03), transparent);
      border: 1px solid rgba(255, 255, 255, 0.1);
      
      &:hover {
        transform: translateY(-2px);
        border-color: #6ee7b7;
        box-shadow: 0 12px 48px rgba(110, 231, 183, 0.2);
        
        .media-overlay {
          opacity: 1;
        }
      }
      
      .event-image {
        width: 100%;
        height: auto;
        max-height: 300px;
        object-fit: cover;
        display: block;
      }
      
      .audio-indicator,
      .video-indicator {
        padding: 60px 20px;
        text-align: center;
        font-size: 1.2rem;
        color: #6ee7b7;
        background: linear-gradient(135deg, rgba(110, 231, 183, 0.1), rgba(16, 185, 129, 0.05));
      }
      
      .media-overlay {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.7);
        backdrop-filter: blur(4px);
        display: flex;
        align-items: center;
        justify-content: center;
        opacity: 0;
        transition: all 0.3s ease;
        
        span {
          color: #6ee7b7;
          font-weight: 600;
          font-size: 1.1rem;
          text-shadow: 0 2px 8px rgba(0, 0, 0, 0.5);
        }
      }
    }
  }
  
  .event-footer {
    background: rgba(255, 255, 255, 0.02);
    border-top: 1px solid rgba(255, 255, 255, 0.05);
    padding: 20px 32px;
    
    .event-meta {
      display: flex;
      justify-content: space-between;
      align-items: center;
      
      .event-source {
        color: #94a3b8;
        font-size: 0.9rem;
        font-weight: 500;
        
        &::before {
          content: "📚 ";
          opacity: 0.7;
        }
      }
    }
  }
}

.empty-state {
  text-align: center;
  padding: 48px;
  color: #94a3b8;
  
  .empty-icon {
    font-size: 4rem;
    margin-bottom: 24px;
    opacity: 0.6;
  }
  
  h3 {
    color: #e6eef8;
    margin-bottom: 16px;
    font-size: 1.5rem;
  }
  
  p {
    font-size: 1.1rem;
    line-height: 1.6;
  }
}

.sidebar {
  display: flex;
  flex-direction: column;
  gap: 20px;
  
  @media (max-width: 900px) {
    order: -1; // Move sidebar above main content on mobile
  }
}

.year-navigation {
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.03), transparent);
  border: 1px solid rgba(255, 255, 255, 0.04);
  border-radius: 12px;
  backdrop-filter: blur(10px);
  
  .nav-header {
    padding: 20px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    
    h3 {
      color: #e6eef8;
      font-size: 1.1rem;
      font-weight: 600;
      margin-bottom: 12px;
    }
    
    .decade-controls {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 8px;
      
      .btn-sm {
        padding: 6px 12px;
        font-size: 0.875rem;
        min-width: 36px;
        flex-shrink: 0;
      }
      
      .decade-buttons {
        display: flex;
        gap: 4px;
        flex: 1;
        justify-content: center;
        
        .decade-button {
          padding: 6px 8px;
          background: linear-gradient(180deg, rgba(255, 255, 255, 0.03), transparent);
          border: 1px solid rgba(255, 255, 255, 0.04);
          color: #e6eef8;
          border-radius: 6px;
          cursor: pointer;
          transition: all 0.15s ease;
          font-weight: 600;
          font-size: 0.75rem;
          min-width: 60px;
          max-width: 80px;
          flex: 1;
          will-change: transform;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          
          &:hover:not(:disabled) {
            background: rgba(110, 231, 183, 0.1);
            border-color: #6ee7b7;
            transform: translateY(-1px);
          }
          
          &.active {
            background: linear-gradient(180deg, rgba(110, 231, 183, 0.15), rgba(110, 231, 183, 0.03));
            border-color: rgba(110, 231, 183, 0.4);
            color: #6ee7b7;
            box-shadow: 0 2px 4px rgba(110, 231, 183, 0.15);
          }
          
          &:disabled {
            opacity: 0.5;
            cursor: not-allowed;
            pointer-events: none;
          }
        }
      }
    }
  }
  
  .years-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 6px;
    padding: 16px;
    max-height: 400px;
    overflow-y: auto;
    
    @media (max-width: 1100px) {
      grid-template-columns: repeat(2, 1fr);
    }
    
    @media (max-width: 900px) {
      grid-template-columns: repeat(6, 1fr);
      max-height: none;
    }
    
    @media (max-width: 600px) {
      grid-template-columns: repeat(4, 1fr);
    }
    
    .year-button {
      padding: 10px 8px;
      background: linear-gradient(180deg, rgba(255, 255, 255, 0.03), transparent);
      border: 1px solid rgba(255, 255, 255, 0.04);
      color: #e6eef8;
      border-radius: 8px;
      cursor: pointer;
      transition: all 0.15s ease; // Faster transitions for better performance
      font-weight: 600;
      font-size: 0.9rem;
      font-family: Inter, ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial;
      will-change: transform; // GPU acceleration hint
      
      &:hover:not(:disabled) {
        background: rgba(110, 231, 183, 0.1);
        border-color: #6ee7b7;
        transform: translateY(-1px);
      }
      
      &:disabled {
        opacity: 0.5;
        cursor: not-allowed;
        pointer-events: none; // Prevent hover effects when disabled
      }
      
      &.active {
        background: linear-gradient(180deg, #6ee7b7, #10b981);
        color: #0f1724;
        border-color: #6ee7b7;
        font-weight: bold;
        box-shadow: 0 2px 8px rgba(110, 231, 183, 0.3);
      }
    }
  }
  
  .nav-footer {
    padding: 16px 20px;
    border-top: 1px solid rgba(255, 255, 255, 0.1);
    
    .range-info {
      display: flex;
      flex-direction: column;
      gap: 4px;
      text-align: center;
      
      .year-range {
        font-weight: 600;
        color: #6ee7b7;
        font-size: 0.9rem;
      }
      
      .total-count {
        font-size: 0.8rem;
        color: #94a3b8;
      }
    }
  }
}

.quick-actions {
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.03), transparent);
  border: 1px solid rgba(255, 255, 255, 0.04);
  border-radius: 12px;
  backdrop-filter: blur(10px);
  padding: 20px;
  
  h4 {
    color: #e6eef8;
    font-size: 1rem;
    font-weight: 600;
    margin-bottom: 16px;
  }
  
  .action-btn {
    width: 100%;
    padding: 12px 16px;
    background: linear-gradient(180deg, rgba(255, 255, 255, 0.03), transparent);
    border: 1px solid rgba(255, 255, 255, 0.04);
    color: #94a3b8;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.2s ease;
    font-size: 0.9rem;
    font-weight: 500;
    text-align: left;
    margin-bottom: 8px;
    font-family: Inter, ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial;
    
    &:last-child {
      margin-bottom: 0;
    }
    
    &:hover {
      background: rgba(110, 231, 183, 0.1);
      border-color: #6ee7b7;
      color: #6ee7b7;
      transform: translateX(4px);
    }
  }
}

.calendar-picker-container {
  position: relative;
  
  .calendar-trigger {
    display: flex;
    align-items: center;
    justify-content: space-between;
    
    .picker-arrow {
      transition: transform 0.2s ease;
      font-size: 0.8rem;
      margin-left: 8px;
      
      &.open {
        transform: rotate(180deg);
      }
    }
  }
  
  .calendar-picker {
    position: absolute;
    top: 100%;
    left: 0;
    right: 0;
    z-index: 1000;
    background: linear-gradient(180deg, rgba(15, 23, 42, 0.95), rgba(7, 11, 18, 0.95));
    border: 1px solid rgba(110, 231, 183, 0.3);
    border-radius: 12px;
    backdrop-filter: blur(15px);
    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
    padding: 16px;
    margin-top: 8px;
    max-height: 400px;
    overflow-y: auto;
    
    .calendar-header {
      display: flex;
      align-items: center;
      margin-bottom: 12px;
      
      .back-btn {
        background: none;
        border: none;
        color: #6ee7b7;
        cursor: pointer;
        font-size: 0.85rem;
        padding: 4px 8px;
        margin-right: 12px;
        border-radius: 4px;
        transition: all 0.2s ease;
        
        &:hover {
          background: rgba(110, 231, 183, 0.1);
        }
      }
      
      h5 {
        color: #e6eef8;
        font-size: 0.9rem;
        font-weight: 600;
        margin: 0;
        flex: 1;
      }
    }
    
    .calendar-content {
      .calendar-grid {
        display: grid;
        gap: 6px;
        
        &.centuries {
          grid-template-columns: 1fr;
        }
        
        &.decades {
          grid-template-columns: repeat(2, 1fr);
        }
        
        &.years {
          grid-template-columns: repeat(2, 1fr);
        }
        
        &.months {
          grid-template-columns: repeat(3, 1fr);
        }
        
        &.dates {
          grid-template-columns: repeat(7, 1fr);
        }
        
        .calendar-item {
          padding: 8px 12px;
          background: linear-gradient(180deg, rgba(255, 255, 255, 0.02), transparent);
          border: 1px solid rgba(255, 255, 255, 0.06);
          color: #94a3b8;
          border-radius: 6px;
          cursor: pointer;
          transition: all 0.15s ease;
          font-size: 0.8rem;
          font-weight: 500;
          text-align: center;
          
          &:hover {
            background: rgba(110, 231, 183, 0.1);
            border-color: rgba(110, 231, 183, 0.3);
            color: #6ee7b7;
            transform: scale(1.02);
          }
          
          &.active {
            background: rgba(110, 231, 183, 0.2);
            border-color: #6ee7b7;
            color: #6ee7b7;
            font-weight: 600;
          }
        }
      }
    }
  }
}

// Header-specific calendar picker styles
.header-calendar {
  .calendar-trigger {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    
    .picker-arrow {
      transition: transform 0.2s ease;
      font-size: 0.8rem;
      margin-left: 4px;
      
      &.open {
        transform: rotate(180deg);
      }
    }
  }
  
  .calendar-picker {
    position: absolute;
    top: 100%;
    left: 0;
    right: 0;
    z-index: 1000;
    background: linear-gradient(180deg, rgba(15, 23, 42, 0.95), rgba(7, 11, 18, 0.95));
    border: 1px solid rgba(110, 231, 183, 0.3);
    border-radius: 12px;
    backdrop-filter: blur(15px);
    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
    padding: 20px;
    margin-top: 8px;
    max-height: 500px;
    overflow-y: auto;
    min-width: 520px;
    
    &.full-calendar {
      .calendar-header {
        text-align: center;
        margin-bottom: 20px;
        
        h5 {
          color: #e6eef8;
          font-size: 1.1rem;
          font-weight: 600;
          margin: 0 0 8px 0;
        }
        
        .selected-date {
          color: #6ee7b7;
          font-size: 0.85rem;
          font-weight: 500;
          padding: 4px 12px;
          background: rgba(110, 231, 183, 0.1);
          border-radius: 6px;
          display: inline-block;
        }
      }
      
      .calendar-content {
        display: flex;
        flex-direction: column;
        gap: 20px;
        
        .date-selectors {
          display: flex;
          gap: 12px;
          align-items: end;
          justify-content: center;
          flex-wrap: wrap;
          
          .selector-group {
            display: flex;
            flex-direction: column;
            gap: 4px;
            
            label {
              color: #e6eef8;
              font-size: 0.8rem;
              font-weight: 500;
              text-align: center;
            }
            
            .date-select {
              padding: 6px 10px;
              background: linear-gradient(180deg, rgba(255, 255, 255, 0.03), transparent);
              border: 1px solid rgba(255, 255, 255, 0.1);
              color: #e6eef8;
              border-radius: 6px;
              font-size: 0.85rem;
              font-weight: 500;
              cursor: pointer;
              transition: all 0.2s ease;
              min-width: 100px;
              
              &:hover, &:focus {
                background: rgba(110, 231, 183, 0.1);
                border-color: rgba(110, 231, 183, 0.3);
                color: #6ee7b7;
                outline: none;
              }
            }
          }
        }
        
        .calendar-section {
          h6 {
            color: #e6eef8;
            font-size: 0.9rem;
            font-weight: 600;
            margin: 0 0 8px 0;
            text-align: center;
          }
          
          .calendar-grid {
            display: grid;
            gap: 4px;
            
            &.centuries {
              grid-template-columns: repeat(3, 1fr);
            }
            
            &.decades {
              grid-template-columns: repeat(3, 1fr);
            }
            
            &.years {
              grid-template-columns: repeat(5, 1fr);
            }
            
            &.months {
              grid-template-columns: repeat(4, 1fr);
            }
            
            &.dates {
              grid-template-columns: repeat(7, 1fr);
            }
            
            .calendar-item {
              padding: 6px 8px;
              background: linear-gradient(180deg, rgba(255, 255, 255, 0.02), transparent);
              border: 1px solid rgba(255, 255, 255, 0.06);
              color: #94a3b8;
              border-radius: 4px;
              cursor: pointer;
              transition: all 0.15s ease;
              font-size: 0.75rem;
              font-weight: 500;
              text-align: center;
              
              &:hover {
                background: rgba(110, 231, 183, 0.1);
                border-color: rgba(110, 231, 183, 0.3);
                color: #6ee7b7;
                transform: scale(1.05);
              }
              
              &.active {
                background: rgba(110, 231, 183, 0.2);
                border-color: #6ee7b7;
                color: #6ee7b7;
                font-weight: 600;
              }
            }
          }
        }
        
        .calendar-actions {
          grid-column: 1 / -1;
          display: flex;
          gap: 12px;
          justify-content: center;
          margin-top: 16px;
          
          .calendar-action-btn {
            padding: 8px 16px;
            border-radius: 6px;
            cursor: pointer;
            font-size: 0.85rem;
            font-weight: 500;
            transition: all 0.2s ease;
            border: 1px solid rgba(255, 255, 255, 0.1);
            
            &.today-btn {
              background: linear-gradient(180deg, rgba(255, 255, 255, 0.03), transparent);
              color: #94a3b8;
              
              &:hover {
                background: rgba(59, 130, 246, 0.1);
                border-color: #3b82f6;
                color: #3b82f6;
              }
            }
            
            &.apply-btn {
              background: linear-gradient(180deg, rgba(110, 231, 183, 0.2), rgba(110, 231, 183, 0.1));
              border-color: #6ee7b7;
              color: #6ee7b7;
              
              &:hover {
                background: rgba(110, 231, 183, 0.3);
                transform: scale(1.05);
              }
            }
          }
        }
      }
    }
  }
}

.loading-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(7, 11, 18, 0.9);
  backdrop-filter: blur(8px);
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  color: #e6eef8;
  
  .loading-spinner {
    width: 48px;
    height: 48px;
    border: 4px solid rgba(110, 231, 183, 0.2);
    border-top: 4px solid #6ee7b7;
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin-bottom: 16px;
    box-shadow: 0 0 16px rgba(110, 231, 183, 0.3);
  }
  
  p {
    font-size: 1.1rem;
    font-weight: 500;
    color: #94a3b8;
  }
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
</style>