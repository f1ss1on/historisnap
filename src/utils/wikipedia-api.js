import { useHistoryStore } from '@stores/history.js'

class WikipediaAPI {
  constructor() {
    this.baseURL = 'https://en.wikipedia.org/api/rest_v1'
    this.apiURL = 'https://en.wikipedia.org/w/api.php'
    this.rateLimitDelay = 50 // Reduced delay for better performance
    this.lastRequestTime = 0
    this.maxRetries = 2 // Reduced retries
    this.timeoutDuration = 5000 // Reduced timeout to 5 seconds
    this.memoryCache = new Map() // In-memory cache for ultra-fast access
    this.cacheTimeout = 1800000 // 30 minutes cache timeout
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
          'Accept-Encoding': 'gzip, deflate, br', // Request compression
          'Accept': 'application/json',
          'Cache-Control': 'public, max-age=3600', // Enable caching
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
      
      // Check memory cache first (fastest)
      const memoryCached = this.memoryCache.get(cacheKey)
      if (memoryCached && Date.now() - memoryCached.timestamp < this.cacheTimeout) {
        historyStore.recordApiCall({
          type: 'memory_cache_hit',
          year,
          success: true,
          cached: true
        })
        return memoryCached.data
      }
      
      // Check store cache second
      const cached = historyStore.getCachedEvent(cacheKey)
      if (cached) {
        // Also store in memory cache for next time
        this.memoryCache.set(cacheKey, { data: cached, timestamp: Date.now() })
        historyStore.recordApiCall({
          type: 'store_cache_hit',
          year,
          success: true,
          cached: true
        })
        return cached
      }

      historyStore.setLoading(true)
      historyStore.clearError()

      // Try multiple approaches to get real historical events
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
            // Cache in both store and memory
            historyStore.setCachedEvent(cacheKey, result)
            this.memoryCache.set(cacheKey, { data: result, timestamp: Date.now() })
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

      // Create optimized fallback event with historical context
      const fallbackEvent = this.createHistoricalFallback(year)

      // Cache the fallback too
      historyStore.setCachedEvent(cacheKey, fallbackEvent)
      this.memoryCache.set(cacheKey, { data: fallbackEvent, timestamp: Date.now() })

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
    // Pass the actual month and day from the API call
    return await this.enrichEventData(event, year, randomMonth, randomDay)
  }

  async fetchEventsFromSpecificDate(targetYear, month, day) {
    const url = `${this.baseURL}/feed/onthisday/events/${month}/${day}`
    const response = await this.fetchWithTimeout(url)
    
    if (!response.ok) {
      throw new Error(`On This Day API error: ${response.status}`)
    }
    
    const data = await response.json()
    const allEvents = data.events || []
    
    if (allEvents.length === 0) {
      throw new Error('No events found for this date')
    }
    
    // Pick a random event from this date (any year) and use its actual year
    const randomEvent = allEvents[Math.floor(Math.random() * allEvents.length)]
    const actualYear = randomEvent.year || targetYear
    
    // Enrich the event data with the actual year from the event, not the target year
    return await this.enrichEventData(randomEvent, actualYear, month, day)
  }

  async fetchEventsFromSearch(year) {
    // Optimized search with minimal data transfer
    const searchTerm = `${year} events`
    
    const params = new URLSearchParams({
      action: 'query',
      list: 'search',
      srsearch: searchTerm,
      format: 'json',
      origin: '*',
      srlimit: 10 // Back to 10 for better variety of results
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
    
    // Use more efficient API endpoint with minimal data
    const url = `${this.baseURL}/page/summary/${encodedTitle}`
    const response = await this.fetchWithTimeout(url, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'HistoryExplorer/3.0 (Vue.js)'
      }
    })
    
    if (!response.ok) {
      throw new Error(`Page summary error: ${response.status}`)
    }
    
    const data = await response.json()
    
    // Generate a random date for display (Month Day format)
    const months = ['January', 'February', 'March', 'April', 'May', 'June',
                   'July', 'August', 'September', 'October', 'November', 'December']
    const randomMonth = Math.floor(Math.random() * 12) + 1
    const randomDay = Math.floor(Math.random() * 28) + 1
    const formattedDate = `${months[randomMonth - 1]} ${randomDay}`

    // Return data in the original format
    return {
      year,
      date: formattedDate,
      name: this.stripHtmlTags(data.title || cleanTitle),
      text: this.truncateDescription(this.stripHtmlTags(data.extract || `Information about ${cleanTitle} from ${year}.`)),
      description: this.truncateDescription(this.stripHtmlTags(data.extract || `Information about ${cleanTitle} from ${year}.`)),
      source: data.content_urls?.desktop?.page || `https://en.wikipedia.org/wiki/${encodedTitle}`,
      media: data.thumbnail ? await this.extractMultimedia(data) : null,
      multimedia: data.thumbnail ? await this.extractMultimedia(data) : null,
      timestamp: Date.now()
    }
  }

  truncateDescription(text) {
    // Limit description length to improve performance
    const maxLength = 300
    if (text.length <= maxLength) return text
    return text.substring(0, maxLength).trim() + '...'
  }

  stripHtmlTags(text) {
    if (!text) return text
    
    // Remove HTML tags using regex
    return text
      .replace(/<[^>]*>/g, '') // Remove all HTML tags
      .replace(/&nbsp;/g, ' ') // Replace non-breaking spaces
      .replace(/&amp;/g, '&')  // Replace HTML entities
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .trim()
  }

  createHistoricalFallback(year) {
    // Create contextual fallback based on historical periods
    const getHistoricalContext = (year) => {
      if (year >= 1990) return "the modern digital age, marked by technological revolution and globalization"
      if (year >= 1970) return "an era of social change, environmental awareness, and technological advancement"
      if (year >= 1950) return "the post-war boom period with rapid economic growth and cultural transformation"
      if (year >= 1920) return "a time of significant social, political, and technological change between two world wars"
      if (year >= 1900) return "the early 20th century, an era of innovation, industrialization, and global transformation"
      return "a significant period in human history with important developments and events"
    }

    // Generate a random date for display (Month Day format)
    const months = ['January', 'February', 'March', 'April', 'May', 'June',
                   'July', 'August', 'September', 'October', 'November', 'December']
    const randomMonth = Math.floor(Math.random() * 12) + 1
    const randomDay = Math.floor(Math.random() * 28) + 1
    const formattedDate = `${months[randomMonth - 1]} ${randomDay}`

    return {
      year,
      date: formattedDate,
      name: `${year}: A Year in History`,
      text: `The year ${year} was part of ${getHistoricalContext(year)}. This period witnessed important political, social, and cultural developments that contributed to shaping our modern world.`,
      description: `The year ${year} was part of ${getHistoricalContext(year)}. This period witnessed important political, social, and cultural developments that contributed to shaping our modern world.`,
      source: `https://en.wikipedia.org/wiki/${year}`,
      media: null,
      multimedia: null,
      timestamp: Date.now()
    }
  }

  async enrichEventData(event, targetYear, month = null, day = null) {
    // Format the date properly - prioritize passed month/day, then event data
    let formattedDate = ''
    const months = ['January', 'February', 'March', 'April', 'May', 'June',
                   'July', 'August', 'September', 'October', 'November', 'December']
    
    if (month && day) {
      // Use the month and day from the API call (OnThisDay)
      formattedDate = `${months[month - 1]} ${day}`
    } else if (event.year && event.month && event.day) {
      // Use event's own date if available
      formattedDate = `${months[event.month - 1]} ${event.day}`
    } else if (event.month && event.day) {
      // Use month and day without year
      formattedDate = `${months[event.month - 1]} ${event.day}`
    } else {
      // Fallback - generate a random date for the year
      const randomMonth = Math.floor(Math.random() * 12) + 1
      const randomDay = Math.floor(Math.random() * 28) + 1
      formattedDate = `${months[randomMonth - 1]} ${randomDay}`
    }

    // Properly separate title and description
    let eventName = 'Historical Event'
    let eventDescription = `A significant historical event that occurred in ${targetYear}.`
    
    if (event.text) {
      // For OnThisDay events, event.text is the full description
      // Try to extract a title from the first sentence or use page title
      const firstSentence = event.text.split('.')[0] + '.'
      let rawTitle = event.pages?.[0]?.displaytitle || event.pages?.[0]?.title || firstSentence
      
      // Remove HTML tags from title
      eventName = this.stripHtmlTags(rawTitle)
      eventDescription = this.stripHtmlTags(event.text)
    } else if (event.title) {
      eventName = this.stripHtmlTags(event.title)
      eventDescription = this.stripHtmlTags(event.description || event.extract || `Information about ${event.title} from ${targetYear}.`)
    }

    return {
      year: targetYear,
      date: formattedDate,
      name: eventName,
      text: eventDescription,
      description: eventDescription,
      source: event.pages?.[0]?.content_urls?.desktop?.page || `https://en.wikipedia.org/wiki/${targetYear}`,
      media: event.pages?.[0] ? await this.extractMultimedia(event.pages[0]) : null,
      multimedia: event.pages?.[0] ? await this.extractMultimedia(event.pages[0]) : null,
      timestamp: Date.now()
    }
  }

  async extractMultimedia(pageData) {
    const historyStore = useHistoryStore()
    
    if (!pageData.thumbnail && !pageData.originalimage) {
      return null
    }
    
    // Prefer thumbnail over original image for better performance
    const imageUrl = pageData.thumbnail?.source || pageData.originalimage?.source
    if (!imageUrl) {
      return null
    }
    
    // Check cache first
    const cached = historyStore.getCachedMultimedia(imageUrl)
    if (cached) {
      return cached
    }
    
    // Skip validation for better performance - trust Wikipedia URLs
    // This eliminates the HEAD request that was causing delays
    const multimediaData = {
      type: 'image',
      url: imageUrl,
      width: pageData.thumbnail?.width || 300, // Use thumbnail dimensions for better performance
      height: pageData.thumbnail?.height || 200,
      description: pageData.description || 'Historical image',
      validated: false, // Mark as unvalidated but trusted
      timestamp: Date.now()
    }
    
    historyStore.setCachedMultimedia(imageUrl, multimediaData)
    return multimediaData
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