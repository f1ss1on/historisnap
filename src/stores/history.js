import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useHistoryStore = defineStore('history', () => {
  // State
  const events = ref(new Map())
  const currentYear = ref(new Date().getFullYear())
  const selectedYear = ref(null)
  const currentEvent = ref(null)
  const searchQuery = ref('')
  const isLoading = ref(false)
  const error = ref(null)
  
  // Cache and performance
  const eventCache = ref(new Map())
  const multimediaCache = ref(new Map())
  const apiCallHistory = ref([])
  
  // Pagination
  const currentPage = ref(1)
  const yearsPerPage = ref(10)
  const startYear = ref(1900)
  
  // Computed with performance optimizations
  const years = computed(() => {
    const start = startYear.value + (currentPage.value - 1) * yearsPerPage.value
    const end = Math.min(start + yearsPerPage.value - 1, currentYear.value)
    const length = end - start + 1
    
    // More efficient array creation
    if (length <= 0) return []
    
    const result = new Array(length)
    for (let i = 0; i < length; i++) {
      result[i] = start + i
    }
    return result
  })
  
  const totalPages = computed(() => {
    return Math.ceil((currentYear.value - startYear.value + 1) / yearsPerPage.value)
  })
  
  const filteredEvents = computed(() => {
    const query = searchQuery.value
    if (!query || query.length < 2) return events.value
    
    const queryLower = query.toLowerCase()
    const filtered = new Map()
    
    // More efficient iteration
    for (const [year, event] of events.value) {
      if (
        year.toString().includes(query) ||
        (event.text && event.text.toLowerCase().includes(queryLower)) ||
        (event.title && event.title.toLowerCase().includes(queryLower))
      ) {
        filtered.set(year, event)
      }
    }
    return filtered
  })
  
  // Actions
  const setSelectedYear = (year) => {
    selectedYear.value = year
    currentEvent.value = events.value.get(year) || null
  }
  
  const setEvent = (year, event) => {
    events.value.set(year, event)
    if (selectedYear.value === year) {
      currentEvent.value = event
    }
  }
  
  const clearEvent = (year) => {
    events.value.delete(year)
    if (selectedYear.value === year) {
      currentEvent.value = null
    }
  }
  
  const nextPage = () => {
    if (currentPage.value < totalPages.value) {
      currentPage.value++
    }
  }
  
  const prevPage = () => {
    if (currentPage.value > 1) {
      currentPage.value--
    }
  }
  
  const goToCurrentYear = () => {
    const targetPage = Math.ceil((currentYear.value - startYear.value + 1) / yearsPerPage.value)
    currentPage.value = targetPage
    selectedYear.value = currentYear.value
  }
  
  const getRandomYear = () => {
    const randomYear = Math.floor(Math.random() * (currentYear.value - startYear.value + 1)) + startYear.value
    const targetPage = Math.ceil((randomYear - startYear.value + 1) / yearsPerPage.value)
    currentPage.value = targetPage
    setSelectedYear(randomYear)
    return randomYear
  }
  
  const setLoading = (loading) => {
    isLoading.value = loading
  }
  
  const setError = (errorMessage) => {
    error.value = errorMessage
  }
  
  const clearError = () => {
    error.value = null
  }
  
  // Cache management
  const getCachedEvent = (cacheKey) => {
    return eventCache.value.get(cacheKey)
  }
  
  const setCachedEvent = (cacheKey, event) => {
    eventCache.value.set(cacheKey, event)
  }
  
  const getCachedMultimedia = (url) => {
    return multimediaCache.value.get(url)
  }
  
  const setCachedMultimedia = (url, data) => {
    multimediaCache.value.set(url, data)
  }
  
  const recordApiCall = (call) => {
    apiCallHistory.value.push({
      ...call,
      timestamp: Date.now()
    })
    
    // Keep only last 100 API calls
    if (apiCallHistory.value.length > 100) {
      apiCallHistory.value = apiCallHistory.value.slice(-100)
    }
  }
  
  // Export all events as JSON
  const exportEvents = () => {
    const eventsObject = Object.fromEntries(events.value)
    const blob = new Blob([JSON.stringify(eventsObject, null, 2)], {
      type: 'application/json'
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `history-events-${Date.now()}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }
  
  return {
    // State
    events,
    currentYear,
    selectedYear,
    currentEvent,
    searchQuery,
    isLoading,
    error,
    eventCache,
    multimediaCache,
    apiCallHistory,
    currentPage,
    yearsPerPage,
    startYear,
    
    // Computed
    years,
    totalPages,
    filteredEvents,
    
    // Actions
    setSelectedYear,
    setEvent,
    clearEvent,
    nextPage,
    prevPage,
    goToCurrentYear,
    getRandomYear,
    setLoading,
    setError,
    clearError,
    getCachedEvent,
    setCachedEvent,
    getCachedMultimedia,
    setCachedMultimedia,
    recordApiCall,
    exportEvents
  }
})