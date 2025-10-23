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
      // Enhanced CORS handling
      const response = await fetch(url, {
        ...options,
        method: 'GET',
        mode: 'cors',
        credentials: 'omit',
        signal: controller.signal,
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'HistoryExplorer/3.0 (Vue.js; +https://github.com/f1ss1on/historisnap)',
          ...options.headers
        }
      })
      clearTimeout(timeoutId)
      
      if (!response.ok) {
        console.log(`❌ API Response not OK: ${response.status} ${response.statusText}`)
      }
      
      return response
    } catch (error) {
      clearTimeout(timeoutId)
      console.log(`❌ Fetch error for ${url}:`, error.message)
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
            // Validate the event year matches the requested year
            try {
              await this.validateEventYear(result, year)
              
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
            } catch (validationError) {
              console.warn(`Year validation failed for ${year}:`, validationError.message)
              lastError = validationError
              continue // Try next strategy
            }
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
    
    // First try to find events for the exact year
    let yearEvents = data.events?.filter(event => event.year === year) || []
    
    // If no exact matches, try a narrower range (±2 years)
    if (yearEvents.length === 0) {
      yearEvents = data.events?.filter(event => 
        event.year >= year - 2 && event.year <= year + 2
      ) || []
    }
    
    // If still no matches, try a wider range (±5 years) but prefer closer years
    if (yearEvents.length === 0) {
      yearEvents = data.events?.filter(event => 
        event.year >= year - 5 && event.year <= year + 5
      ) || []
      
      // Sort by closeness to target year
      yearEvents.sort((a, b) => Math.abs(a.year - year) - Math.abs(b.year - year))
    }
    
    if (yearEvents.length === 0) {
      throw new Error('No events found for this time period')
    }
    
    const event = yearEvents[0] // Use the closest year match
    // Use the event's actual year instead of the requested year
    return await this.enrichEventData(event, event.year, randomMonth, randomDay)
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
    // Try multiple search strategies to find year-specific content
    const searchTerms = [
      `${year} events`,
      `${year} history`,
      `"${year}"`,
      `${year} timeline`
    ]
    
    for (const searchTerm of searchTerms) {
      try {
        const params = new URLSearchParams({
          action: 'query',
          list: 'search',
          srsearch: searchTerm,
          format: 'json',
          origin: '*',
          srlimit: 20
        })
        
        const url = `${this.apiURL}?${params}`
        const response = await this.fetchWithTimeout(url)
        
        if (!response.ok) continue
        
        const data = await response.json()
        const results = data.query?.search || []
        
        if (results.length === 0) continue
        
        // Filter results to find ones that likely contain the target year
        const yearSpecificResults = results.filter(result => {
          const title = result.title.toLowerCase()
          const snippet = result.snippet.toLowerCase()
          
          // Check if the title or snippet contains the target year
          return title.includes(year.toString()) || 
                 snippet.includes(year.toString()) ||
                 // Check for nearby years (±1)
                 title.includes((year-1).toString()) || 
                 title.includes((year+1).toString()) ||
                 snippet.includes((year-1).toString()) || 
                 snippet.includes((year+1).toString())
        })
        
        const finalResults = yearSpecificResults.length > 0 ? yearSpecificResults : results
        const randomResult = finalResults[Math.floor(Math.random() * finalResults.length)]
        
        return await this.fetchPageSummary(randomResult.title, year)
        
      } catch (error) {
        console.log(`Search term "${searchTerm}" failed:`, error.message)
        continue
      }
    }
    
    throw new Error('No search results found for any search strategy')
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
    
    // Validate that this is appropriate historical content
    if (!this.isHistoricalContent(cleanTitle, year)) {
      console.log(`❌ Rejecting non-historical content: ${cleanTitle} for year ${year}`)
      throw new Error(`Non-historical content: ${cleanTitle}`)
    }
    
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
    
    // Validate year consistency
    const validatedYear = this.validateAndCorrectYear(data, year)
    
    // Generate a random date for display (Month Day format)
    const months = ['January', 'February', 'March', 'April', 'May', 'June',
                   'July', 'August', 'September', 'October', 'November', 'December']
    const randomMonth = Math.floor(Math.random() * 12) + 1
    const randomDay = Math.floor(Math.random() * 28) + 1
    const formattedDate = `${months[randomMonth - 1]} ${randomDay}`

    // Return data in the original format with validated year
    return {
      year: validatedYear,
      date: formattedDate,
      name: this.stripHtmlTags(data.title || cleanTitle),
      text: this.truncateDescription(this.stripHtmlTags(data.extract || `Information about ${cleanTitle} from ${validatedYear}.`)),
      description: this.truncateDescription(this.stripHtmlTags(data.extract || `Information about ${cleanTitle} from ${validatedYear}.`)),
      source: data.content_urls?.desktop?.page || `https://en.wikipedia.org/wiki/${encodedTitle}`,
      media: data.thumbnail ? await this.extractMultimedia(data) : null,
      multimedia: data.thumbnail ? await this.extractMultimedia(data) : null,
      timestamp: Date.now()
    }
  }

  isHistoricalContent(title, year) {
    const titleLower = title.toLowerCase()
    
    // Reject modern content that shouldn't appear in historical years
    const modernKeywords = [
      'wwe', 'wwf', 'wrestling', 'pay-per-view', 'ppv', 'livestream', 'netflix', 'peacock',
      'youtube', 'espn', 'supercard', 'professional wrestling', 'monday night raw',
      'smackdown', 'nxt', 'royal rumble', 'wrestlemania', 'summerslam'
    ]
    
    // Check for obviously modern content
    for (const keyword of modernKeywords) {
      if (titleLower.includes(keyword)) {
        return false
      }
    }
    
    // Reject if year is negative and content seems modern
    if (year < 0 && (
      titleLower.includes('list of') ||
      titleLower.includes('television') ||
      titleLower.includes('internet') ||
      titleLower.includes('computer') ||
      titleLower.includes('digital')
    )) {
      return false
    }
    
    // Reject content that seems too modern for the given year
    if (year < 1800 && (
      titleLower.includes('film') ||
      titleLower.includes('movie') ||
      titleLower.includes('television') ||
      titleLower.includes('radio') ||
      titleLower.includes('album') ||
      titleLower.includes('song')
    )) {
      return false
    }
    
    if (year < 1900 && (
      titleLower.includes('automobile') ||
      titleLower.includes('airplane') ||
      titleLower.includes('computer') ||
      titleLower.includes('internet')
    )) {
      return false
    }
    
    return true
  }

  validateAndCorrectYear(data, requestedYear) {
    // Ensure year is within reasonable bounds
    const currentYear = new Date().getFullYear()
    
    // If requested year is negative or unreasonable, try to extract from content
    if (requestedYear < -3000 || requestedYear > currentYear) {
      // Try to find a year in the title or extract
      const yearMatch = (data.title + ' ' + (data.extract || '')).match(/\b(\d{4})\b/)
      if (yearMatch) {
        const extractedYear = parseInt(yearMatch[1])
        if (extractedYear >= -3000 && extractedYear <= currentYear) {
          return extractedYear
        }
      }
      // Default to a reasonable historical year
      return 1800 + Math.floor(Math.random() * 200)
    }
    
    return requestedYear
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
    // Validate that the event year matches the target year
    const eventYear = event.year || this.extractYearFromText(event.text || event.title || '')
    
    // If the event has a different year than requested, reject it
    if (eventYear && Math.abs(eventYear - targetYear) > 1) {
      console.log(`❌ Year mismatch: Event from ${eventYear}, requested ${targetYear}`)
      throw new Error(`Year mismatch: Event from ${eventYear}, requested ${targetYear}`)
    }

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

    // Use the validated target year (not the event year which might be different)
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

  extractYearFromText(text) {
    if (!text) return null
    
    // Look for 4-digit years in the text, including historical years
    const yearPatterns = [
      /\b(1\d{3}|20\d{2}|2[1-9]\d{2})\b/g, // Years 1000-2999
      /\b(\d{1,2})\s*(AD|CE)\b/gi, // Early AD/CE years
      /\b(\d{1,4})\s*(BC|BCE)\b/gi // BC/BCE years
    ]
    
    for (const pattern of yearPatterns) {
      const matches = text.match(pattern)
      if (matches && matches.length > 0) {
        // Return the first year found
        const yearMatch = matches[0].match(/\d+/)
        if (yearMatch) {
          let year = parseInt(yearMatch[0])
          
          // Handle BC/BCE years
          if (pattern.source.includes('BC')) {
            year = -year
          }
          
          return year
        }
      }
    }
    
    return null
  }

  async validateEventYear(event, requestedYear) {
    // Extract year from the event content
    const eventYear = this.extractYearFromText(event.title + ' ' + event.extract)
    
    // Allow some flexibility for events that span years or have uncertain dates
    if (eventYear && Math.abs(eventYear - requestedYear) > 2) {
      throw new Error(`Event year mismatch: expected ~${requestedYear}, got ${eventYear}`)
    }
    
    return true
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

  // Generic search method for events, keywords, or dates
  async searchEvents(query) {
    // Clean and prepare the search query
    const cleanQuery = query.trim()
    if (!cleanQuery || cleanQuery.length < 2) {
      throw new Error('Search query too short')
    }

    // Check if query looks like a date (various formats)
    const datePatterns = [
      /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/, // MM/DD/YYYY or M/D/YYYY
      /^(\d{4})-(\d{1,2})-(\d{1,2})$/, // YYYY-MM-DD
      /^(\d{1,2})-(\d{1,2})-(\d{4})$/, // DD-MM-YYYY or D-M-YYYY
      /^(\d{4})$/, // Just a year
      /^(\d{1,2})\/(\d{1,2})$/ // MM/DD or M/D (current year assumed)
    ]

    // Try to parse as date
    for (const pattern of datePatterns) {
      const match = cleanQuery.match(pattern)
      if (match) {
        return await this.searchByDate(match, pattern)
      }
    }

    // If not a date, search by keyword/event name
    return await this.searchByKeyword(cleanQuery)
  }

  async searchByDate(match, pattern) {
    let year, month, day

    if (pattern.source === '^(\\d{4})$') {
      // Just a year
      year = parseInt(match[1])
      return await this.fetchRandomEvent(year)
    } else if (pattern.source === '^(\\d{1,2})\\/(\\d{1,2})$') {
      // MM/DD current year
      month = parseInt(match[1])
      day = parseInt(match[2])
      year = new Date().getFullYear()
    } else if (pattern.source === '^(\\d{1,2})\\/(\\d{1,2})\\/(\\d{4})$') {
      // MM/DD/YYYY
      month = parseInt(match[1])
      day = parseInt(match[2])
      year = parseInt(match[3])
    } else if (pattern.source === '^(\\d{4})-(\\d{1,2})-(\\d{1,2})$') {
      // YYYY-MM-DD
      year = parseInt(match[1])
      month = parseInt(match[2])
      day = parseInt(match[3])
    } else if (pattern.source === '^(\\d{1,2})-(\\d{1,2})-(\\d{4})$') {
      // DD-MM-YYYY
      day = parseInt(match[1])
      month = parseInt(match[2])
      year = parseInt(match[3])
    }

    // Validate date
    if (month < 1 || month > 12 || day < 1 || day > 31) {
      throw new Error('Invalid date format')
    }

    // Try to get events for specific date
    try {
      return await this.fetchEventsFromSpecificDate(year, month, day)
    } catch (error) {
      // Fallback to year-based search
      return await this.fetchRandomEvent(year)
    }
  }

  async searchByKeyword(keyword) {
    // Use Wikipedia's REST API search endpoint which is CORS-friendly
    try {
      const encodedKeyword = encodeURIComponent(keyword)
      const searchUrl = `${this.baseURL}/page/search/${encodedKeyword}?limit=20`
      
      console.log('🔍 Searching with REST API:', searchUrl)
      
      const response = await this.fetchWithTimeout(searchUrl)

      if (!response.ok) {
        console.log('❌ REST API failed, trying OpenSearch...')
        return await this.fallbackOpenSearch(keyword)
      }

      const data = await response.json()
      const pages = data.pages || []

      if (pages.length === 0) {
        console.log('❌ No REST API results, trying OpenSearch...')
        return await this.fallbackOpenSearch(keyword)
      }

      // Filter for historical content only
      const historicalPages = pages.filter(page => {
        const title = page.title.toLowerCase()
        const excerpt = (page.excerpt || '').toLowerCase()
        
        // Try to extract year from title or excerpt
        const yearMatch = page.title.match(/\b(\d{4})\b/) || 
                         (page.excerpt || '').match(/\b(\d{4})\b/)
        const contextYear = yearMatch ? parseInt(yearMatch[1]) : new Date().getFullYear()
        
        return this.isHistoricalContent(page.title, contextYear)
      })

      // Use filtered results or fall back to all results
      const finalPages = historicalPages.length > 0 ? historicalPages : pages
      const randomPage = finalPages[Math.floor(Math.random() * finalPages.length)]
      
      // Try to extract year from title
      const yearMatch = randomPage.title.match(/\b(\d{4})\b/) || 
                       randomPage.excerpt.match(/\b(\d{4})\b/)
      const contextYear = yearMatch ? parseInt(yearMatch[1]) : new Date().getFullYear()

      return await this.fetchPageSummary(randomPage.title, contextYear)
      
    } catch (error) {
      console.log('❌ REST API error, trying OpenSearch fallback:', error.message)
      return await this.fallbackOpenSearch(keyword)
    }
  }

  async fallbackOpenSearch(keyword) {
    // Fallback to OpenSearch API
    const params = new URLSearchParams({
      action: 'opensearch',
      search: keyword,
      limit: 20,
      namespace: 0,
      format: 'json',
      origin: '*'
    })

    const url = `${this.apiURL}?${params}`
    console.log('🔍 Fallback OpenSearch URL:', url)
    
    const response = await this.fetchWithTimeout(url)

    if (!response.ok) {
      throw new Error(`OpenSearch API error: ${response.status}`)
    }

    const data = await response.json()
    
    // OpenSearch returns [query, [titles], [descriptions], [urls]]
    const titles = data[1] || []
    const descriptions = data[2] || []

    if (titles.length === 0) {
      throw new Error(`No results found for "${keyword}"`)
    }

    // Filter titles for historical content
    const historicalTitles = []
    for (let i = 0; i < titles.length; i++) {
      const title = titles[i]
      const yearMatch = title.match(/\b(\d{4})\b/) || 
                       (descriptions[i] || '').match(/\b(\d{4})\b/)
      const contextYear = yearMatch ? parseInt(yearMatch[1]) : new Date().getFullYear()
      
      if (this.isHistoricalContent(title, contextYear)) {
        historicalTitles.push({ title, year: contextYear })
      }
    }

    // Use filtered results or fall back to all results
    const finalTitles = historicalTitles.length > 0 ? historicalTitles : 
                       titles.map(title => ({ title, year: new Date().getFullYear() }))
    
    const randomSelection = finalTitles[Math.floor(Math.random() * finalTitles.length)]

    return await this.fetchPageSummary(randomSelection.title, randomSelection.year)
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