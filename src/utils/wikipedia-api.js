import { useHistoryStore } from '@stores/history.js'

class WikipediaAPI {
  constructor() {
    this.baseURL = 'https://en.wikipedia.org/api/rest_v1'
    this.apiURL = 'https://en.wikipedia.org/w/api.php'
    this.rateLimitDelay = 100 // ms between requests
    this.lastRequestTime = 0
    this.maxRetries = 3
    this.timeoutDuration = 10000 // 10 seconds
  }

  async delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  async rateLimit() {
    const now = Date.now()
    const timeSinceLastRequest = now - this.lastRequestTime
    if (timeSinceLastRequest < this.rateLimitDelay) {
      await this.delay(this.rateLimitDelay - timeSinceLastRequest)
    }
    this.lastRequestTime = Date.now()
  }

  cleanWikipediaPageTitle(title) {
    if (!title) return title
    
    // Remove common problematic patterns
    const cleanTitle = title
      .replace(/\s*\([^)]*\)$/g, '') // Remove trailing parentheses
      .replace(/^\d{4}\s*[-–—]\s*/, '') // Remove year prefixes
      .replace(/^(January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2}\s*[-–—]\s*/i, '') // Remove date prefixes
      .trim()
    
    // Ensure it's not empty after cleaning
    return cleanTitle || title
  }

  async fetchWithTimeout(url, options = {}) {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), this.timeoutDuration)
    
    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
        headers: {
          'User-Agent': 'HistoryExplorer/3.0 (Vue.js)',
          ...options.headers
        }
      })
      clearTimeout(timeoutId)
      return response
    } catch (error) {
      clearTimeout(timeoutId)
      throw error
    }
  }

  async fetchRandomEvent(year) {
    const historyStore = useHistoryStore()
    
    try {
      await this.rateLimit()
      
      const cacheKey = `random_${year}`
      const cached = historyStore.getCachedEvent(cacheKey)
      if (cached) {
        historyStore.recordApiCall({
          type: 'cache_hit',
          year,
          success: true,
          cached: true
        })
        return cached
      }

      historyStore.setLoading(true)
      historyStore.clearError()

      // Try multiple approaches to get events for the year
      const strategies = [
        () => this.fetchEventsFromOnThisDay(year),
        () => this.fetchEventsFromSearch(year),
        () => this.fetchEventsFromCategory(year)
      ]

      let lastError = null
      for (const strategy of strategies) {
        try {
          const result = await strategy()
          if (result) {
            historyStore.setCachedEvent(cacheKey, result)
            historyStore.recordApiCall({
              type: 'api_success',
              year,
              success: true,
              cached: false,
              strategy: strategy.name
            })
            return result
          }
        } catch (error) {
          lastError = error
          console.warn(`Strategy failed for year ${year}:`, error.message)
        }
      }

      // If all strategies fail, create a fallback event
      const fallbackEvent = {
        year,
        title: `Historical Events of ${year}`,
        description: `This year marked various significant historical developments and events that shaped the world. While specific details may require further research, ${year} was part of the ongoing flow of human history with its own unique contributions to our collective story.`,
        source: 'Generated',
        multimedia: null,
        timestamp: Date.now()
      }

      historyStore.recordApiCall({
        type: 'fallback_used',
        year,
        success: true,
        cached: false,
        error: lastError?.message
      })

      return fallbackEvent

    } catch (error) {
      console.error(`Error fetching event for year ${year}:`, error)
      historyStore.setError(`Failed to fetch event for ${year}: ${error.message}`)
      historyStore.recordApiCall({
        type: 'api_error',
        year,
        success: false,
        error: error.message
      })
      
      return null
    } finally {
      historyStore.setLoading(false)
    }
  }

  async fetchEventsFromOnThisDay(year) {
    const randomMonth = Math.floor(Math.random() * 12) + 1
    const randomDay = Math.floor(Math.random() * 28) + 1
    
    const url = `${this.baseURL}/feed/onthisday/events/${randomMonth}/${randomDay}`
    const response = await this.fetchWithTimeout(url)
    
    if (!response.ok) {
      throw new Error(`On This Day API error: ${response.status}`)
    }
    
    const data = await response.json()
    const yearEvents = data.events?.filter(event => 
      event.year >= year - 5 && event.year <= year + 5
    ) || []
    
    if (yearEvents.length === 0) {
      throw new Error('No events found for this time period')
    }
    
    const event = yearEvents[Math.floor(Math.random() * yearEvents.length)]
    return await this.enrichEventData(event, year)
  }

  async fetchEventsFromSearch(year) {
    const searchTerms = [
      `events ${year}`,
      `history ${year}`,
      `${year} timeline`,
      `what happened ${year}`
    ]
    
    const searchTerm = searchTerms[Math.floor(Math.random() * searchTerms.length)]
    
    const params = new URLSearchParams({
      action: 'query',
      list: 'search',
      srsearch: searchTerm,
      format: 'json',
      origin: '*',
      srlimit: 10
    })
    
    const url = `${this.apiURL}?${params}`
    const response = await this.fetchWithTimeout(url)
    
    if (!response.ok) {
      throw new Error(`Search API error: ${response.status}`)
    }
    
    const data = await response.json()
    const results = data.query?.search || []
    
    if (results.length === 0) {
      throw new Error('No search results found')
    }
    
    const randomResult = results[Math.floor(Math.random() * results.length)]
    return await this.fetchPageSummary(randomResult.title, year)
  }

  async fetchEventsFromCategory(year) {
    const categories = [
      `${year}`,
      `${year}_events`,
      `${year}_in_history`,
      `Years_of_the_${Math.floor(year/10)*10}s`
    ]
    
    const category = categories[Math.floor(Math.random() * categories.length)]
    
    const params = new URLSearchParams({
      action: 'query',
      list: 'categorymembers',
      cmtitle: `Category:${category}`,
      format: 'json',
      origin: '*',
      cmlimit: 20
    })
    
    const url = `${this.apiURL}?${params}`
    const response = await this.fetchWithTimeout(url)
    
    if (!response.ok) {
      throw new Error(`Category API error: ${response.status}`)
    }
    
    const data = await response.json()
    const members = data.query?.categorymembers || []
    
    if (members.length === 0) {
      throw new Error('No category members found')
    }
    
    const randomMember = members[Math.floor(Math.random() * members.length)]
    return await this.fetchPageSummary(randomMember.title, year)
  }

  async fetchPageSummary(title, year) {
    const cleanTitle = this.cleanWikipediaPageTitle(title)
    const encodedTitle = encodeURIComponent(cleanTitle)
    
    const url = `${this.baseURL}/page/summary/${encodedTitle}`
    const response = await this.fetchWithTimeout(url)
    
    if (!response.ok) {
      throw new Error(`Page summary error: ${response.status}`)
    }
    
    const data = await response.json()
    
    return {
      year,
      title: data.title || cleanTitle,
      description: data.extract || `Information about ${cleanTitle} from ${year}.`,
      source: data.content_urls?.desktop?.page || `https://en.wikipedia.org/wiki/${encodedTitle}`,
      multimedia: await this.extractMultimedia(data),
      timestamp: Date.now()
    }
  }

  async enrichEventData(event, targetYear) {
    return {
      year: targetYear,
      title: event.text || `Event from ${targetYear}`,
      description: event.text || `A historical event that occurred in ${targetYear}.`,
      source: event.pages?.[0]?.content_urls?.desktop?.page || 'Wikipedia',
      multimedia: event.pages?.[0] ? await this.extractMultimedia(event.pages[0]) : null,
      timestamp: Date.now()
    }
  }

  async extractMultimedia(pageData) {
    const historyStore = useHistoryStore()
    
    if (!pageData.thumbnail && !pageData.originalimage) {
      return null
    }
    
    const imageUrl = pageData.originalimage?.source || pageData.thumbnail?.source
    if (!imageUrl) {
      return null
    }
    
    // Check cache first
    const cached = historyStore.getCachedMultimedia(imageUrl)
    if (cached) {
      return cached
    }
    
    try {
      // Validate that the URL is accessible and is actually an image
      const response = await this.fetchWithTimeout(imageUrl, { method: 'HEAD' })
      if (!response.ok) {
        return null
      }
      
      const contentType = response.headers.get('content-type')
      if (!contentType?.startsWith('image/')) {
        return null
      }
      
      const multimediaData = {
        type: 'image',
        url: imageUrl,
        width: pageData.originalimage?.width || pageData.thumbnail?.width,
        height: pageData.originalimage?.height || pageData.thumbnail?.height,
        description: pageData.description || 'Historical image',
        validated: true,
        timestamp: Date.now()
      }
      
      historyStore.setCachedMultimedia(imageUrl, multimediaData)
      return multimediaData
      
    } catch (error) {
      console.warn('Failed to validate multimedia:', error)
      return null
    }
  }

  // Get API performance metrics
  getPerformanceMetrics() {
    const historyStore = useHistoryStore()
    const calls = historyStore.apiCallHistory
    
    if (calls.length === 0) {
      return {
        totalCalls: 0,
        successRate: 0,
        averageResponseTime: 0,
        cacheHitRate: 0,
        errorRate: 0
      }
    }
    
    const successful = calls.filter(call => call.success).length
    const cached = calls.filter(call => call.cached).length
    const errors = calls.filter(call => !call.success).length
    
    return {
      totalCalls: calls.length,
      successRate: ((successful / calls.length) * 100).toFixed(1),
      cacheHitRate: ((cached / calls.length) * 100).toFixed(1),
      errorRate: ((errors / calls.length) * 100).toFixed(1),
      lastHour: calls.filter(call => 
        Date.now() - call.timestamp < 3600000
      ).length
    }
  }
}

export default new WikipediaAPI()