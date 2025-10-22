/* ============================
   Interactive History Timeline App
   Updated & Refactored Version with Live API - October 2025
   ============================ */

'use strict';

/* ============================
   Configuration & Constants
   ============================ */
const CONFIG = {
  START_YEAR: 1900,
  CURRENT_YEAR: new Date().getFullYear(),
  YEARS_PER_PAGE: 10,
  STORAGE_KEY: "paginatedHistory_events_v2",
  MAX_TITLE_LENGTH: 120,
  SEARCH_DEBOUNCE_MS: 300,
  GRID_COLUMNS: {
    SMALL: 2,
    MEDIUM: 3,
    LARGE: 4
  }
};

/* ============================
   Curated Historical Media
   ============================ */
const curatedMedia = {
  1969: {
    type: 'audio',
    url: 'https://upload.wikimedia.org/wikipedia/commons/9/9c/Apollo_11_first_step.ogg',
    alt: 'Neil Armstrong: "That\'s one small step for man, one giant leap for mankind"',
    fallback: 'https://commons.wikimedia.org/wiki/File:Apollo_11_first_step.ogg',
    date: 'July 20',
    title: 'Apollo 11 Moon Landing',
    description: 'Historic audio recording of Neil Armstrong\'s first words on the Moon during the Apollo 11 mission.'
  },
  1963: {
    type: 'audio',
    url: 'https://upload.wikimedia.org/wikipedia/commons/8/82/I_Have_a_Dream_speech_by_Martin_Luther_King.ogg',
    alt: 'Martin Luther King Jr.: "I Have a Dream" speech excerpt',
    fallback: 'https://commons.wikimedia.org/wiki/File:I_Have_a_Dream_speech_by_Martin_Luther_King.ogg',
    date: 'August 28',
    title: 'I Have a Dream Speech',
    description: 'Excerpt from Martin Luther King Jr.\'s famous "I Have a Dream" speech delivered at the March on Washington.'
  },
  1961: {
    type: 'image',
    url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/0f/Yuri_Gagarin_%281961%29_-_Restoration.jpg/800px-Yuri_Gagarin_%281961%29_-_Restoration.jpg',
    alt: 'Yuri Gagarin, first human in space (1961)',
    date: 'April 12',
    title: 'First Human in Space'
  },
  1945: {
    type: 'image',
    url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/54/VJ_Day_in_Times_Square.jpg/800px-VJ_Day_in_Times_Square.jpg',
    alt: 'V-J Day celebration in Times Square, New York (1945)',
    date: 'August 15',
    title: 'V-J Day Celebration'
  },
  1929: {
    type: 'image',
    url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/50/Crowd_outside_nyse.jpg/800px-Crowd_outside_nyse.jpg',
    alt: 'Crowd outside NYSE during 1929 Stock Market Crash'
  },
  1912: {
    type: 'image',
    url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/fd/RMS_Titanic_3.jpg/800px-RMS_Titanic_3.jpg',
    alt: 'RMS Titanic before its maiden voyage (1912)'
  },
  1989: {
    type: 'image',
    url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/86/TheFallOfTheBerlinWall1989.JPG/800px-TheFallOfTheBerlinWall1989.JPG',
    alt: 'Fall of the Berlin Wall (1989)'
  },
  1955: {
    type: 'image',
    url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c4/Rosaparks.jpg/600px-Rosaparks.jpg',
    alt: 'Rosa Parks mugshot after her arrest (1955)'
  },
  1941: {
    type: 'image',
    url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/07/USS_Arizona_Pearl_Harbor.jpg/800px-USS_Arizona_Pearl_Harbor.jpg',
    alt: 'USS Arizona during Pearl Harbor attack (1941)'
  },
  1903: {
    type: 'image',
    url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/02/Wright_first_flight_1903Dec17.jpg/800px-Wright_first_flight_1903Dec17.jpg',
    alt: 'Wright Brothers first flight at Kitty Hawk (1903)'
  }
};

/* ============================
   Curated Historical Events
   ============================ */
const curatedEvents = {
  1903: "Wright brothers make the first powered, controlled airplane flights at Kitty Hawk, North Carolina.",
  1914: "World War I begins after the assassination of Archduke Franz Ferdinand (Austria-Hungary).",
  1918: "End of World War I; the 1918 influenza pandemic spreads worldwide.",
  1929: "Stock Market Crash triggers the Great Depression.",
  1939: "World War II begins with Germany's invasion of Poland.",
  1945: "World War II ends in Europe (May) and the Pacific (Sept); United Nations founded.",
  1955: "Rosa Parks refuses to give up her bus seat, sparking the Montgomery Bus Boycott.",
  1963: "Assassination of U.S. President John F. Kennedy in Dallas, Texas.",
  1969: "Apollo 11: Neil Armstrong and Buzz Aldrin land on the Moon (\"one small step\").",
  1971: "Introduction of the microprocessor-based technologies expands computing possibilities.",
  1989: "Fall of the Berlin Wall, a key step toward the end of the Cold War.",
  1991: "Dissolution of the Soviet Union; many independent nations emerge.",
  2001: "September 11 attacks in the United States; major global aftermath follows.",
  2008: "Global financial crisis affects economies worldwide.",
  2010: "Haiti earthquake causes widespread devastation and humanitarian crisis.",
  2016: "Historic political and cultural events globally (Brexit referendum in UK).",
  2019: "First reports of novel coronavirus in Wuhan, China (SARS-CoV-2).",
  2020: "COVID-19 pandemic reshapes global society and economy.",
  2021: "Global vaccination campaigns and pandemic recovery efforts begin.",
  2022: "Major geopolitical shifts and continued post-pandemic adaptations.",
  2023: "AI revolution accelerates with widespread adoption of large language models.",
  2024: "Significant technological, political, and cultural developments worldwide."
};

/* ============================
   Application State
   ============================ */
class HistoryApp {
  constructor() {
    this.customEvents = this.loadCustomEvents();
    this.years = this.generateYearsArray();
    this.currentSelection = { index: this.years.length - 1 };
    this.pageIndex = Math.floor((this.years.length - 1) / CONFIG.YEARS_PER_PAGE);
    this.searchTimeout = null;
    
    // Cache DOM elements
    this.elements = this.cacheDOMElements();
    
    // Initialize performance optimizations
    this.initPerformanceOptimizations();
    
    // Initialize
    this.init();
  }

  /* ============================
     DOM Element Caching
     ============================ */
  cacheDOMElements() {
    const elements = {};
    const elementIds = [
      'years-grid', 'display-year', 'display-event', 'display-sub',
      'editor-year', 'event-input', 'page-info', 'years-range',
      'total-years', 'current-year-label', 'search', 'prev-page',
      'next-page', 'goto-today', 'save-event', 'clear-event', 'export-json',
      'random-today', 'fetch-year-event', 'event-date', 'event-name',
      'event-source', 'event-description', 'media-thumbnail', 'event-image', 
      'media-modal', 'modal-close', 'modal-title', 'modal-image', 
      'modal-audio', 'modal-video', 'modal-description'
    ];

    elementIds.forEach(id => {
      const el = document.getElementById(id);
      if (!el) console.warn(`Element with id '${id}' not found`);
      elements[id.replace(/-/g, '')] = el;
    });

    return elements;
  }

  /* ============================
     Performance Optimizations
     ============================ */
  initPerformanceOptimizations() {
    // Initialize request pools and caches
    this.requestPool = new Map();
    this.requestInProgress = new Set();
    this.mediaCache = new Map();
    this.eventCache = this.eventCache || new Map();
    
    // Request throttling
    this.lastRequestTime = 0;
    this.minRequestInterval = 100; // Min 100ms between requests
    
    // Performance monitoring
    this.performanceMetrics = {
      apiCalls: 0,
      cacheHits: 0,
      averageResponseTime: 0,
      successfulRequests: 0,
      failedRequests: 0
    };
    
    // Preload critical resources
    this.preloadCriticalResources();
  }

  async preloadCriticalResources() {
    // Preload current year and nearby years
    const currentYear = new Date().getFullYear();
    const preloadYears = [currentYear, currentYear - 1, currentYear - 10, currentYear - 50];
    
    // Preload in background without blocking UI
    setTimeout(() => {
      preloadYears.forEach(year => {
        if (this.years.includes(year)) {
          this.prefetchEventData(year);
        }
      });
    }, 2000);
  }

  async prefetchEventData(year) {
    try {
      if (!this.eventCache.has(year)) {
        const eventData = await this.fetchEventsForYear(year);
        if (eventData) {
          this.eventCache.set(year, eventData);
        }
      }
    } catch (error) {
      // Silent prefetch failure
    }
  }

  /* ============================
     Data Management
     ============================ */
  loadCustomEvents() {
    try {
      const stored = localStorage.getItem(CONFIG.STORAGE_KEY);
      return stored ? JSON.parse(stored) : {};
    } catch (error) {
      console.warn('Failed to load custom events from localStorage:', error);
      return {};
    }
  }

  saveCustomEvents() {
    try {
      localStorage.setItem(CONFIG.STORAGE_KEY, JSON.stringify(this.customEvents));
      return true;
    } catch (error) {
      console.error('Failed to save custom events:', error);
      this.showNotification('Unable to save changes. Storage may be full.', 'error');
      return false;
    }
  }

  generateYearsArray() {
    const years = [];
    for (let year = CONFIG.START_YEAR; year <= CONFIG.CURRENT_YEAR; year++) {
      years.push(year);
    }
    return years;
  }

  getEventText(year) {
    if (this.customEvents[year]) return this.customEvents[year];
    if (curatedEvents[year]) return curatedEvents[year];
    return "No event recorded for this year. You can add one using the editor.";
  }

  isValidYear(year) {
    return Number.isInteger(year) && year >= CONFIG.START_YEAR && year <= CONFIG.CURRENT_YEAR;
  }

  getGridColumns() {
    const width = window.innerWidth;
    if (width < 520) return CONFIG.GRID_COLUMNS.SMALL;
    if (width < 900) return CONFIG.GRID_COLUMNS.MEDIUM;
    return CONFIG.GRID_COLUMNS.LARGE;
  }

  formatRangeForPage(pageIndex) {
    const start = pageIndex * CONFIG.YEARS_PER_PAGE;
    const end = Math.min(start + CONFIG.YEARS_PER_PAGE - 1, this.years.length - 1);
    return [start, end];
  }

  sanitizeText(text, maxLength = CONFIG.MAX_TITLE_LENGTH) {
    return text
      .slice(0, maxLength)
      .replace(/[\r\n\t]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  /* ============================
     Notification System
     ============================ */
  showNotification(message, type = 'info', duration = 3000) {
    const existing = document.querySelector('.notification');
    if (existing) existing.remove();

    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      padding: 12px 20px;
      border-radius: 6px;
      color: white;
      font-weight: 500;
      z-index: 1000;
      opacity: 0;
      transform: translateX(100%);
      transition: all 0.3s ease;
    `;
    const colors = { info: '#3498db', success: '#27ae60', warning: '#f39c12', error: '#e74c3c' };
    notification.style.backgroundColor = colors[type] || colors.info;

    document.body.appendChild(notification);

    requestAnimationFrame(() => {
      notification.style.opacity = '1';
      notification.style.transform = 'translateX(0)';
    });

    setTimeout(() => {
      notification.style.opacity = '0';
      notification.style.transform = 'translateX(100%)';
      setTimeout(() => notification.remove(), 300);
    }, duration);
  }

  /* ============================
     Rendering Functions
     ============================ */
  renderPage(pageIndex) {
    if (!this.elements.yearsgrid) return;

    const [start, end] = this.formatRangeForPage(pageIndex);
    const totalPages = Math.ceil(this.years.length / CONFIG.YEARS_PER_PAGE);

    this.elements.yearsgrid.innerHTML = '';
    if (this.elements.pageinfo) this.elements.pageinfo.textContent = `Page ${pageIndex + 1} / ${totalPages}`;
    if (this.elements.yearsrange) this.elements.yearsrange.textContent = `${this.years[start]} — ${this.years[end]}`;
    if (this.elements.totalyears) this.elements.totalyears.textContent = `${this.years.length} years`;

    const fragment = document.createDocumentFragment();
    for (let i = start; i <= end; i++) {
      const year = this.years[i];
      const button = this.createYearButton(year, i);
      fragment.appendChild(button);
    }
    this.elements.yearsgrid.appendChild(fragment);
    this.highlightSelectedInGrid();
    this.updateDisplayForSelection();
  }

  createYearButton(year, index) {
    const button = document.createElement('button');
    button.className = 'year-btn';
    button.setAttribute('data-index', index);
    button.textContent = year;
    button.title = this.sanitizeText(this.getEventText(year));
    
    if (index === this.currentSelection.index) button.classList.add('selected');
    button.addEventListener('click', () => this.selectYearByIndex(index));
    
    return button;
  }

  highlightSelectedInGrid() {
    if (!this.elements.yearsgrid) return;
    const buttons = this.elements.yearsgrid.querySelectorAll('.year-btn');
    buttons.forEach(btn => btn.classList.remove('selected'));
    const selectedBtn = this.elements.yearsgrid.querySelector(`.year-btn[data-index="${this.currentSelection.index}"]`);
    if (selectedBtn) selectedBtn.classList.add('selected');
    selectedBtn?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }

  updateDisplayForSelection() {
    const index = this.currentSelection.index;
    const year = this.years[index];
    const eventText = this.getEventText(year);
    const isCustom = !!this.customEvents[year];
    const isCurated = !!curatedEvents[year];

    if (this.elements.displayyear) this.elements.displayyear.textContent = year;
    if (this.elements.displayevent) this.elements.displayevent.textContent = eventText;
    if (this.elements.displaysub) {
      this.elements.displaysub.textContent = isCustom ? "Edited (saved locally)" : isCurated ? "Curated event" : "No curated event";
    }
    
    // Hide date and name for curated/custom events (they don't have this structure)
    if (this.elements.eventdate) this.elements.eventdate.style.display = 'none';
    if (this.elements.eventname) this.elements.eventname.style.display = 'none';
    if (this.elements.editoryear) this.elements.editoryear.textContent = year;
    if (this.elements.eventinput) this.elements.eventinput.value = isCustom ? this.customEvents[year] : curatedEvents[year] || "";

    // Display curated media and dates if available for this year
    if (curatedMedia[year] && (isCustom || isCurated)) {
      this.displayMedia(curatedMedia[year]);
      
      // Show curated event date and name if available
      if (curatedMedia[year].date && this.elements.eventdate) {
        this.elements.eventdate.textContent = curatedMedia[year].date;
        this.elements.eventdate.style.display = 'block';
      }
      if (curatedMedia[year].title && this.elements.eventname) {
        this.elements.eventname.textContent = curatedMedia[year].title;
        this.elements.eventname.style.display = 'block';
      }
    } else if (!isCustom && !isCurated) {
      // Will be handled by autoFetchEventForYear
      this.displayMedia(null);
    } else {
      this.displayMedia(null);
    }

    const pageOfSelection = Math.floor(index / CONFIG.YEARS_PER_PAGE);
    if (pageOfSelection !== this.pageIndex) {
      this.pageIndex = pageOfSelection;
      this.renderPage(this.pageIndex);
    } else {
      this.highlightSelectedInGrid();
    }

    // Auto-fetch API event if no curated or custom event exists
    if (!isCustom && !isCurated) {
      this.autoFetchEventForYear(year);
    }
  }

  selectYearByIndex(index) {
    if (index < 0 || index >= this.years.length) return;
    this.currentSelection.index = index;
    this.updateDisplayForSelection();
    
    // Preload events for nearby years in the background (don't await)
    this.preloadNearbyEvents(index);
  }
  
  async preloadNearbyEvents(currentIndex) {
    // Reduce preloading to minimize API calls and 404s
    const preloadIndices = [
      currentIndex - 1, currentIndex + 1
    ].filter(i => i >= 0 && i < this.years.length);
    
    for (const i of preloadIndices) {
      const year = this.years[i];
      // Only preload if we don't have curated events and haven't cached yet
      if (!curatedEvents[year] && !this.customEvents[year] && 
          (!this.eventCache || !this.eventCache.has(year))) {
        // Longer delay between preload requests to be gentler on the API
        setTimeout(() => {
          this.fetchEventsForYear(year).then(eventData => {
            if (!this.eventCache) this.eventCache = new Map();
            this.eventCache.set(year, eventData);
          }).catch(() => {
            // Silently fail for preload requests
          });
        }, Math.random() * 2000 + 1000); // Random delay 1-3 seconds
      }
    }
  }

  gotoPrevPage() {
    if (this.pageIndex <= 0) return;
    this.pageIndex--;
    this.selectYearByIndex(this.pageIndex * CONFIG.YEARS_PER_PAGE);
    this.renderPage(this.pageIndex);
  }

  gotoNextPage() {
    const maxPage = Math.ceil(this.years.length / CONFIG.YEARS_PER_PAGE) - 1;
    if (this.pageIndex >= maxPage) return;
    this.pageIndex++;
    this.selectYearByIndex(this.pageIndex * CONFIG.YEARS_PER_PAGE);
    this.renderPage(this.pageIndex);
  }

  gotoToday() {
    const lastIndex = this.years.length - 1;
    this.pageIndex = Math.floor(lastIndex / CONFIG.YEARS_PER_PAGE);
    this.selectYearByIndex(lastIndex);
    this.renderPage(this.pageIndex);
  }

  saveEvent() {
    const year = this.years[this.currentSelection.index];
    const value = this.elements.eventinput?.value.trim() || '';
    
    if (value) this.customEvents[year] = value;
    else delete this.customEvents[year];

    if (this.saveCustomEvents()) this.updateDisplayForSelection();
  }

  clearEvent() {
    const year = this.years[this.currentSelection.index];
    if (this.customEvents[year]) delete this.customEvents[year];
    if (this.elements.eventinput) this.elements.eventinput.value = curatedEvents[year] || "";
    this.updateDisplayForSelection();
  }

  exportData() {
    const data = {};
    const noEventText = "No event recorded for this year. You can add one using the editor.";
    this.years.forEach(year => {
      const text = this.getEventText(year);
      if (text && text !== noEventText) data[year] = text;
    });

    try {
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `history_export_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      this.showNotification('Export completed successfully!', 'success');
    } catch (error) {
      console.error('Export failed:', error);
      this.showNotification('Export failed. Please try again.', 'error');
    }
  }

  performSearch(query) {
    if (!query) return;
    const q = query.toLowerCase().trim();
    if (/^\d{4}$/.test(q)) {
      const year = parseInt(q, 10);
      if (this.isValidYear(year) && this.years.includes(year)) {
        const index = this.years.indexOf(year);
        this.selectYearByIndex(index);
        this.pageIndex = Math.floor(index / CONFIG.YEARS_PER_PAGE);
        this.renderPage(this.pageIndex);
        this.showNotification(`Found year ${year}`, 'success');
        return;
      }
    }
    let foundIndex = -1;
    for (let i = 0; i < this.years.length; i++) {
      const eventText = this.getEventText(this.years[i]).toLowerCase();
      if (eventText.includes(q)) { foundIndex = i; break; }
    }
    if (foundIndex >= 0) {
      this.selectYearByIndex(foundIndex);
      this.pageIndex = Math.floor(foundIndex / CONFIG.YEARS_PER_PAGE);
      this.renderPage(this.pageIndex);
      this.showNotification(`Found in year ${this.years[foundIndex]}`, 'success');
      if (this.elements.search) this.elements.search.value = '';
    } else {
      this.showNotification(`No events matched "${q}". Try other keywords or a year.`, 'warning');
    }
  }

  handleKeyboardNavigation(event) {
    if (['INPUT','TEXTAREA'].includes(event.target.tagName)) return;
    switch (event.key) {
      case 'ArrowLeft': event.preventDefault(); this.gotoPrevPage(); break;
      case 'ArrowRight': event.preventDefault(); this.gotoNextPage(); break;
      case 'ArrowUp': event.preventDefault(); this.selectYearByIndex(Math.max(0, this.currentSelection.index - this.getGridColumns())); break;
      case 'ArrowDown': event.preventDefault(); this.selectYearByIndex(Math.min(this.years.length -1, this.currentSelection.index + this.getGridColumns())); break;
      case 'Home': event.preventDefault(); this.selectYearByIndex(0); this.pageIndex = 0; this.renderPage(this.pageIndex); break;
      case 'End': event.preventDefault(); this.gotoToday(); break;
    }
  }

  setupEventListeners() {
    this.elements.prevpage?.addEventListener('click', () => this.gotoPrevPage());
    this.elements.nextpage?.addEventListener('click', () => this.gotoNextPage());
    this.elements.gototoday?.addEventListener('click', () => this.gotoToday());
    this.elements.saveevent?.addEventListener('click', () => this.saveEvent());
    this.elements.clearevent?.addEventListener('click', () => this.clearEvent());
    this.elements.exportjson?.addEventListener('click', () => this.exportData());
    this.elements.randomtoday?.addEventListener('click', () => this.fetchRandomTodayEventOnline());
    this.elements.fetchyearevent?.addEventListener('click', () => this.fetchEventForCurrentYear());
    
    // Test automation button
    document.getElementById('run-1000-test')?.addEventListener('click', () => {
      if (window.HistoryAppTester) {
        console.log('🔬 Starting comprehensive 1000-event test...');
        const tester = new window.HistoryAppTester();
        tester.runAutomatedTest();
      } else {
        console.error('Test automation script not loaded');
      }
    });
    
    // Modal event listeners
    this.elements.modalclose?.addEventListener('click', () => this.closeMediaModal());
    this.elements.mediamodal?.addEventListener('click', (e) => {
      if (e.target === this.elements.mediamodal) {
        this.closeMediaModal();
      }
    });
    
    // ESC key to close modal
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.elements.mediamodal && this.elements.mediamodal.style.display === 'flex') {
        this.closeMediaModal();
      }
    });
    this.elements.search?.addEventListener('keydown', (event) => {
      if (event.key === 'Enter') { event.preventDefault(); this.performSearch(event.target.value); }
    });
    document.addEventListener('keydown', (event) => this.handleKeyboardNavigation(event));
    this.elements.yearsgrid?.addEventListener('keydown', (event) => {
      const focused = document.activeElement;
      if (focused?.classList.contains('year-btn')) {
        const index = parseInt(focused.getAttribute('data-index'), 10);
        const cols = this.getGridColumns();
        switch (event.key) {
          case 'ArrowDown': event.preventDefault(); this.selectYearByIndex(Math.min(this.years.length-1,index+cols)); break;
          case 'ArrowUp': event.preventDefault(); this.selectYearByIndex(Math.max(0,index-cols)); break;
        }
      }
    });
    let resizeTimeout;
    window.addEventListener('resize', () => { clearTimeout(resizeTimeout); resizeTimeout=setTimeout(()=>this.renderPage(this.pageIndex),250); });
  }

  /* ============================
     API Integration for Historical Events
     ============================ */
  async fetchEventsForYear(year) {
    try {
      // Check if we should skip API calls entirely due to repeated failures
      if (!this.apiFailureCount) this.apiFailureCount = 0;
      
      if (this.apiFailureCount > 5) {
        console.warn('Too many API failures, using fallback for', year);
        return this.getFallbackEvent(year);
      }
      
      // First try to get events specifically for this year
      const result = await this.fetchSpecificYearEvents(year);
      
      // Reset failure count on success
      if (result && result.source !== 'Generated contextual event') {
        this.apiFailureCount = 0;
      }
      
      return result;
      
    } catch (error) {
      console.warn('fetchEventsForYear failed:', error);
      this.apiFailureCount = (this.apiFailureCount || 0) + 1;
      return this.getFallbackEvent(year);
    }
  }

  async fetchSpecificYearEvents(year) {
    // Cache for storing API responses to avoid duplicate calls
    if (!this.apiCache) this.apiCache = new Map();
    
    // Use known working dates instead of random ones
    const knownWorkingDates = [
      { month: 1, day: 1 }, { month: 7, day: 4 }, { month: 12, day: 25 },
      { month: 3, day: 15 }, { month: 6, day: 21 }, { month: 9, day: 11 },
      { month: 11, day: 11 }, { month: 4, day: 14 }, { month: 10, day: 31 },
      { month: 5, day: 8 }, { month: 8, day: 15 }, { month: 2, day: 14 }
    ];
    
    // Try fast parallel requests first (reduced to minimize 404s)
    const parallelAttempts = 2;
    const promises = [];
    
    for (let i = 0; i < parallelAttempts; i++) {
      const dateInfo = knownWorkingDates[Math.floor(Math.random() * knownWorkingDates.length)];
      const { month, day } = dateInfo;
      const cacheKey = `${month}-${day}`;
      
      // Check cache first
      if (this.apiCache.has(cacheKey)) {
        const cachedData = this.apiCache.get(cacheKey);
        const yearEvents = this.filterEventsForYear(cachedData, year);
        if (yearEvents.length > 0) {
          return await this.selectBestEvent(yearEvents, year);
        }
        continue;
      }
      
      // Create promise with timeout and better error handling
      const promise = Promise.race([
        fetch(`https://en.wikipedia.org/api/rest_v1/feed/onthisday/all/${month.toString().padStart(2, '0')}/${day.toString().padStart(2, '0')}`, {
          headers: { 'User-Agent': 'RandomHistoryApp/1.0 (Educational Purpose)' }
        }).then(async response => {
          if (response.ok) {
          const data = await response.json();
          
          // Prioritize actual events over births/deaths, but include notable ones
          const events = data.events || [];
          const births = (data.births || []).filter(birth => this.isNotablePerson(birth));
          const deaths = (data.deaths || []).filter(death => this.isNotablePerson(death));
          
          // Combine with events first (higher priority)
          const allEvents = [...events, ...deaths, ...births];
          
          // Add date information to events based on the API endpoint
          const months = ['January', 'February', 'March', 'April', 'May', 'June',
                         'July', 'August', 'September', 'October', 'November', 'December'];
          const dateString = `${months[month - 1]} ${day}`;
          
          allEvents.forEach(event => {
            if (!event.apiDate) {
              event.apiDate = dateString;
            }
            // Add source type for better handling
            if (data.events && data.events.includes(event)) {
              event.sourceType = 'event';
            } else if (data.deaths && data.deaths.includes(event)) {
              event.sourceType = 'death';
            } else if (data.births && data.births.includes(event)) {
              event.sourceType = 'birth';
            }
          });            // Cache the response
            this.apiCache.set(cacheKey, allEvents);
            
            return { events: allEvents, cacheKey, apiDate: dateString };
          } else if (response.status === 404) {
            // Try alternative API format or skip this date
            console.warn(`Wikipedia API 404 for ${month}/${day}, trying alternative approach`);
            return null;
          }
          return null;
        }).catch(error => {
          console.warn(`API request failed for ${month}/${day}:`, error);
          return null;
        }),
        // 2 second timeout per request
        new Promise(resolve => setTimeout(() => resolve(null), 2000))
      ]);
      
      promises.push(promise);
    }
    
    // Wait for all requests (max 2 seconds each, parallel)
    const results = await Promise.allSettled(promises);
    const foundEvents = [];
    
    for (const result of results) {
      if (result.status === 'fulfilled' && result.value?.events) {
        const yearEvents = this.filterEventsForYear(result.value.events, year);
        foundEvents.push(...yearEvents);
        
        // Store the API date for later use
        if (result.value.apiDate) {
          this.currentAPIDate = result.value.apiDate;
        }
        
        // Early return if we find exact year matches
        const exactMatches = yearEvents.filter(event => event.year === year);
        if (exactMatches.length > 0) {
          return await this.selectBestEvent(exactMatches, year);
        }
      }
    }
    
    if (foundEvents.length > 0) {
      return await this.selectBestEvent(foundEvents, year);
    }
    
    // Try alternative Wikipedia search approach
    return await this.fetchAlternativeHistoricalEvent(year);
  }
  
  filterEventsForYear(events, year) {
    // Look for exact year matches first, then nearby years
    const exactYearEvents = events.filter(event => event.year === year);
    if (exactYearEvents.length > 0) return exactYearEvents;
    
    return events.filter(event => 
      event.year && Math.abs(event.year - year) <= 3
    );
  }
  
  async selectBestEvent(events, targetYear) {
    // Prioritize exact year matches
    const exactMatches = events.filter(event => event.year === targetYear);
    let candidateEvents = exactMatches.length > 0 ? exactMatches : events;
    
    // Further prioritize actual historical events over births/deaths
    const historicalEvents = candidateEvents.filter(event => event.sourceType === 'event');
    const deathEvents = candidateEvents.filter(event => event.sourceType === 'death');
    const birthEvents = candidateEvents.filter(event => event.sourceType === 'birth');
    
    // Choose in order of preference: historical events > notable deaths > notable births
    let eventToUse;
    if (historicalEvents.length > 0) {
      eventToUse = historicalEvents[Math.floor(Math.random() * historicalEvents.length)];
    } else if (deathEvents.length > 0) {
      eventToUse = deathEvents[Math.floor(Math.random() * deathEvents.length)];
    } else if (birthEvents.length > 0) {
      eventToUse = birthEvents[Math.floor(Math.random() * birthEvents.length)];
    } else {
      eventToUse = candidateEvents[Math.floor(Math.random() * candidateEvents.length)];
    }
    
    // Extract detailed event information
    const eventDetails = this.extractEventDetails(eventToUse);
    
    // Try to get date from the cached API endpoint if available
    let eventDate = eventDetails.date;
    if (!eventDate && this.currentAPIDate) {
      eventDate = this.currentAPIDate;
    }
    
    const eventData = {
      year: eventToUse.year,
      text: eventDetails.description || this.formatWikipediaEvent(eventToUse),
      name: eventDetails.name,
      date: eventDate,
      source: eventToUse.year === targetYear ? 'Wikipedia API' : `Wikipedia API (${eventToUse.year})`,
      rawEvent: eventToUse
    };
    
    // Debug logging
    console.log('Event data:', {
      year: eventData.year,
      name: eventData.name,
      date: eventData.date,
      hasDate: !!eventData.date
    });
    
    // Try to fetch media for this event
    try {
      const mediaData = await this.fetchMediaForEvent(eventToUse, eventToUse.year);
      if (mediaData) {
        eventData.media = mediaData;
        // Enhance media with event context
        eventData.media.title = eventDetails.name;
        eventData.media.description = eventDetails.description || eventData.text;
      }
    } catch (error) {
      console.warn('Failed to fetch media:', error);
    }
    
    return eventData;
  }

  async fetchAlternativeHistoricalEvent(year) {
    try {
      // Try multiple search terms to find significant events
      const searchTerms = [
        `${year} events`,
        `${year} history`,
        `${year} war`,
        `${year} politics`,
        `${year} invention`,
        `${year} discovery`
      ];
      
      for (const searchTerm of searchTerms) {
        try {
          const searchResponse = await Promise.race([
            fetch(`https://en.wikipedia.org/w/api.php?action=opensearch&search="${searchTerm}"&limit=3&format=json&origin=*`, {
              headers: { 'User-Agent': 'RandomHistoryApp/1.0 (Educational Purpose)' }
            }),
            new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 1500))
          ]);

          if (searchResponse.ok) {
            const data = await searchResponse.json();
            if (data && data[2] && data[2].length > 0) {
              // Filter for substantial descriptions that seem like real events
              const goodDescriptions = data[2].filter(desc => 
                desc && 
                desc.length > 150 && 
                !desc.toLowerCase().includes('disambiguation') &&
                !desc.toLowerCase().includes('may refer to') &&
                (desc.includes('war') || desc.includes('treaty') || desc.includes('established') || 
                 desc.includes('founded') || desc.includes('discovered') || desc.includes('invented'))
              );
              
              if (goodDescriptions.length > 0) {
                const randomDesc = goodDescriptions[Math.floor(Math.random() * goodDescriptions.length)];
                return {
                  year: year,
                  text: randomDesc.substring(0, 350) + (randomDesc.length > 350 ? '...' : ''),
                  name: this.extractEventNameFromDescription(randomDesc),
                  source: 'Wikipedia Search API',
                  media: null
                };
              }
            }
          }
        } catch (error) {
          console.warn(`Search term "${searchTerm}" failed:`, error);
          continue;
        }
      }

      // Fallback to year page summary
      return await this.fetchRandomHistoricalEvent(year);
      
    } catch (error) {
      console.warn('fetchAlternativeHistoricalEvent failed:', error);
      return await this.fetchRandomHistoricalEvent(year);
    }
  }

  extractEventNameFromDescription(description) {
    // Try to extract a meaningful event name from the description
    const sentences = description.split('.');
    if (sentences.length > 0) {
      const firstSentence = sentences[0].trim();
      if (firstSentence.length < 100) {
        return firstSentence;
      }
      // If first sentence is too long, try to extract key phrases
      const keyPhrases = firstSentence.match(/\b(war|treaty|battle|revolution|discovery|invention|founding|establishment)\b/i);
      if (keyPhrases) {
        const words = firstSentence.split(' ');
        const keyIndex = words.findIndex(word => word.toLowerCase().includes(keyPhrases[0].toLowerCase()));
        if (keyIndex > 0) {
          return words.slice(Math.max(0, keyIndex - 3), keyIndex + 4).join(' ');
        }
      }
    }
    return 'Historical Event';
  }

  async fetchRandomHistoricalEvent(year) {
    try {
      // Use Promise.race with timeout for faster response
      const quickFetch = Promise.race([
        fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${year}`, {
          headers: { 'User-Agent': 'RandomHistoryApp/1.0 (Educational Purpose)' }
        }),
        // 1.5 second timeout
        new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 1500))
      ]);
      
      const searchResponse = await quickFetch;
      
      if (searchResponse.ok) {
        const data = await searchResponse.json();
        if (data.extract && data.extract.length > 50) {
          return {
            year: year,
            text: data.extract.substring(0, 400) + (data.extract.length > 400 ? '...' : ''),
            source: 'Wikipedia Summary',
            media: null
          };
        }
      }
      
      // If all APIs fail, return fallback immediately
      return this.getFallbackEvent(year);
      
    } catch (error) {
      console.warn('fetchRandomHistoricalEvent failed:', error);
      return this.getFallbackEvent(year);
    }
  }

  getFallbackEvent(year) {
    // Check if we have a curated event for this year
    if (curatedEvents[year]) {
      return {
        year: year,
        text: curatedEvents[year],
        source: 'Curated local event',
        media: curatedMedia[year] || null
      };
    }
    
    // Generate a contextual fallback based on the year
    let contextualEvent = this.generateContextualEvent(year);
    return {
      year: year,
      text: contextualEvent,
      source: 'Generated contextual event',
      media: null
    };
  }

  generateContextualEvent(year) {
    // Provide more specific historical context based on major historical periods
    if (year >= 1914 && year <= 1918) {
      return `${year} was during World War I, a global conflict that transformed international relations and society.`;
    } else if (year >= 1929 && year <= 1939) {
      return `${year} was during the Great Depression era, marked by economic hardship and social upheaval worldwide.`;
    } else if (year >= 1939 && year <= 1945) {
      return `${year} was during World War II, the most devastating conflict in human history affecting every continent.`;
    } else if (year >= 1947 && year <= 1991) {
      return `${year} was during the Cold War period, characterized by ideological tensions between superpowers.`;
    } else if (year >= 1960 && year <= 1975) {
      return `${year} was during the Civil Rights era and Space Race, a time of social change and scientific achievement.`;
    } else if (year >= 1990 && year <= 2000) {
      return `${year} was during the end of the Cold War and rise of the internet, marking a new technological age.`;
    } else if (year >= 2001 && year <= 2010) {
      return `${year} was in the post-9/11 era, marked by global security concerns and rapid technological advancement.`;
    } else if (year >= 2020) {
      return `${year} was during the COVID-19 pandemic era, a time of global health crisis and social transformation.`;
    }
    
    // Default contextual events for other periods
    const contexts = [
      `${year} was a year of historical significance with various global developments and cultural changes.`,
      `During ${year}, societies worldwide continued to evolve through technological and social progress.`,
      `${year} marked another year in the ongoing story of human civilization and cultural development.`
    ];
    
    return contexts[Math.floor(Math.random() * contexts.length)];
  }

  formatWikipediaEvent(event) {
    const result = {
      text: '',
      name: '',
      date: ''
    };
    
    // Extract event name/title
    if (event.text) {
      // Try to extract the first sentence as the name
      const firstSentence = event.text.split('.')[0];
      if (firstSentence.length < 100) {
        result.name = firstSentence.trim();
        result.text = event.text.substring(firstSentence.length + 1).trim();
      } else {
        result.text = event.text;
        result.name = 'Historical Event';
      }
    } else if (event.description) {
      result.text = event.description;
      result.name = 'Historical Event';
    } else if (event.pages && event.pages.length > 0) {
      const page = event.pages[0];
      result.name = page.title || 'Historical Event';
      if (page.extract) {
        result.text = page.extract;
      } else if (page.description) {
        result.text = page.description;
      }
    }
    
    // Try to extract date information
    if (event.month && event.day) {
      const months = ['January', 'February', 'March', 'April', 'May', 'June',
                     'July', 'August', 'September', 'October', 'November', 'December'];
      result.date = `${months[event.month - 1]} ${event.day}`;
    } else if (event.text && event.text.match(/\b(January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2}\b/)) {
      const dateMatch = event.text.match(/\b(January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2}\b/);
      result.date = dateMatch[0];
    }
    
    // Clean up and format the text
    if (result.text) {
      // Remove common Wikipedia formatting
      result.text = result.text.replace(/\[\[([^\]]+)\]\]/g, '$1'); // Remove wiki links
      result.text = result.text.replace(/\([^)]*\)/g, ''); // Remove parenthetical notes
      result.text = result.text.replace(/\s+/g, ' ').trim(); // Clean whitespace
      
      // Ensure proper length
      const maxLength = 300;
      if (result.text.length > maxLength) {
        result.text = result.text.substring(0, maxLength);
        // Try to end at a sentence boundary
        const lastPeriod = result.text.lastIndexOf('.');
        if (lastPeriod > maxLength * 0.7) {
          result.text = result.text.substring(0, lastPeriod + 1);
        } else {
          result.text += '...';
        }
      }
    }
    
    if (!result.text) {
      result.text = `Historical event occurred in ${event.year}.`;
    }
    
    return result.text;
  }

  extractEventDetails(event) {
    const details = {
      name: 'Historical Event',
      date: '',
      description: '',
      eventType: 'event' // 'event', 'birth', 'death'
    };
    
    // First check if we have API date information
    if (event.apiDate) {
      details.date = event.apiDate;
    }
    
    // Determine event type and enhance description accordingly
    if (event.text) {
      const text = event.text.toLowerCase();
      
      // Check if this is from births/deaths API section
      if (event.sourceType === 'birth') {
        details.eventType = 'birth';
        details.description = this.enhanceBirthEvent(event);
        details.name = this.extractPersonName(event.text) + ' is born';
      } else if (event.sourceType === 'death') {
        details.eventType = 'death';
        details.description = this.enhanceDeathEvent(event);
        details.name = this.extractPersonName(event.text) + ' dies';
      } else if (text.match(/\(died \d{4}\)/)) {
        // This is a birth event mentioning death year (person born this year, died later)
        details.eventType = 'birth';
        details.description = this.enhanceBirthEvent(event);
        details.name = this.extractPersonName(event.text) + ' is born';
      } else if (text.match(/\(born \d{4}\)/) || text.match(/born \d{4}/)) {
        // This is a death event showing birth year - the person died this year
        details.eventType = 'death';
        details.description = this.enhanceDeathEvent(event);
        details.name = this.extractPersonName(event.text) + ' dies';
      } else if (text.includes('born') && text.includes('died')) {
        // This is a death event mentioning both birth and death years
        details.eventType = 'death';
        details.description = this.enhanceDeathEvent(event);
        details.name = this.extractPersonName(event.text) + ' dies';
      } else {
        // Check if this event is just a simple name and profession without parenthetical info
        // but might still be a birth/death event based on context
        const simplePersonPattern = /^([^,]+),\s*([^(]+?)$/;
        const match = text.match(simplePersonPattern);
        
        if (match && match[2].match(/(actor|actress|singer|musician|writer|artist|politician|scientist|player|athlete|footballer|swimmer|runner|tennis|basketball|baseball|rugby|cricket|hockey)/i)) {
          // This looks like a person's birth or death event without clear indicators
          // Default to birth if no clear death context
          details.eventType = 'birth';
          details.description = this.enhanceBirthEvent(event);
          details.name = this.extractPersonName(event.text) + ' is born';
        } else {
          details.eventType = 'event';
          details.description = event.text;
          const firstSentence = event.text.split('.')[0];
          if (firstSentence.length < 120) {
            details.name = firstSentence.trim();
            const remainingText = event.text.substring(firstSentence.length + 1).trim();
            // Don't leave description empty - use full text if remaining text is too short
            details.description = remainingText.length > 20 ? remainingText : event.text;
          }
        }
      }
    }
    
    // Extract event name/title
    if (event.text) {
      const firstSentence = event.text.split('.')[0];
      if (firstSentence.length < 120) {
        details.name = firstSentence.trim();
        details.description = event.text.substring(firstSentence.length + 1).trim();
      } else {
        details.description = event.text;
        // Try to extract a shorter name from the beginning
        const words = event.text.split(' ').slice(0, 8).join(' ');
        details.name = words.length < 60 ? words + '...' : 'Historical Event';
      }
    } else if (event.pages && event.pages.length > 0) {
      const page = event.pages[0];
      details.name = page.title || 'Historical Event';
      details.description = page.extract || page.description || '';
    }
    
    // Try to extract date information from multiple sources
    if (event.month && event.day) {
      const months = ['January', 'February', 'March', 'April', 'May', 'June',
                     'July', 'August', 'September', 'October', 'November', 'December'];
      details.date = `${months[event.month - 1]} ${event.day}`;
    } else {
      // Try to extract from original text or description
      const textToSearch = event.text || details.description || '';
      const dateMatch = textToSearch.match(/\b(January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2}\b/);
      if (dateMatch) {
        details.date = dateMatch[0];
      } else {
        // Try different date patterns like "June 4, 1989" or "4 June 1989"
        const altDateMatch = textToSearch.match(/\b(January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2},?\s+\d{4}\b/);
        if (altDateMatch) {
          // Extract just the month and day part
          const monthDay = altDateMatch[0].match(/\b(January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2}\b/);
          if (monthDay) {
            details.date = monthDay[0];
          }
        }
        
        // Also try to get date from the API endpoint used (if it's from onthisday)
        if (!details.date && event.pages && event.pages.length > 0) {
          const page = event.pages[0];
          if (page.extract) {
            const extractDateMatch = page.extract.match(/\b(January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2}\b/);
            if (extractDateMatch) {
              details.date = extractDateMatch[0];
            }
          }
        }
      }
    }
    
    // Clean up description
    if (details.description) {
      details.description = details.description.replace(/\[\[([^\]]+)\]\]/g, '$1');
      details.description = details.description.replace(/\([^)]*\)/g, '');
      details.description = details.description.replace(/\s+/g, ' ').trim();
      
      const maxLength = 300;
      if (details.description.length > maxLength) {
        details.description = details.description.substring(0, maxLength);
        const lastPeriod = details.description.lastIndexOf('.');
        if (lastPeriod > maxLength * 0.7) {
          details.description = details.description.substring(0, lastPeriod + 1);
        } else {
          details.description += '...';
        }
      }
    }
    
    return details;
  }

  extractPersonName(text) {
    // Extract person's name (usually the first part before comma or description)
    const match = text.match(/^([^,]+)/);
    return match ? match[1].trim() : 'Person';
  }

  enhanceDeathEvent(event) {
    const text = event.text;
    const name = this.extractPersonName(text);
    
    // Extract birth year and profession - handle both (born YYYY) and born YYYY formats
    const bornMatch = text.match(/\(born (\d{4})\)/) || text.match(/born (\d{4})/);
    const birthYear = bornMatch ? bornMatch[1] : null;
    
    // Extract profession/description - handle both parenthetical and non-parenthetical birth years
    const professionMatch = text.match(/,\s*([^(]+?)(?:\s*\(|$)/) || text.match(/,\s*(.+?)\s+born\s+\d{4}/);
    const profession = professionMatch ? professionMatch[1].trim() : 'notable figure';
    
    if (birthYear) {
      const age = event.year - parseInt(birthYear);
      return `${name}, ${profession}, dies at age ${age}. Known for significant contributions to ${this.categorizeProfession(profession)}.`;
    } else {
      return `${name}, ${profession}, passes away. A notable figure in ${this.categorizeProfession(profession)}.`;
    }
  }

  enhanceBirthEvent(event) {
    const text = event.text;
    const name = this.extractPersonName(text);
    
    // Extract profession/description (remove death year reference)
    const professionMatch = text.match(/,\s*([^(]+?)(?:\s*\(|$)/);
    const profession = professionMatch ? professionMatch[1].trim() : 'notable figure';
    
    // Create more engaging birth descriptions based on profession
    const birthTemplates = {
      'singer': 'is born, destined to become a celebrated voice in music',
      'actor': 'is born, future star of stage and screen',
      'actress': 'is born, future star of stage and screen',
      'musician': 'is born, who will create memorable musical works',
      'writer': 'is born, future creator of influential literary works',
      'author': 'is born, future creator of influential literary works',
      'politician': 'is born, who will shape the political landscape',
      'scientist': 'is born, future pioneer in scientific discovery',
      'artist': 'is born, who will create lasting artistic works',
      'composer': 'is born, who will compose enduring musical pieces',
      'director': 'is born, future filmmaker of acclaimed works',
      'athlete': 'is born, who will achieve sporting excellence',
      'player': 'is born, future sporting talent who will excel in competition',
      'footballer': 'is born, who will become skilled on the football field',
      'rugby league player': 'is born, who will excel in rugby league competition',
      'rugby player': 'is born, who will excel in rugby competition',
      'cricket player': 'is born, who will excel in cricket',
      'tennis player': 'is born, who will excel on the tennis court',
      'basketball player': 'is born, who will excel on the basketball court',
      'baseball player': 'is born, who will excel on the baseball diamond',
      'hockey player': 'is born, who will excel on the hockey rink',
      'swimmer': 'is born, who will excel in swimming competition',
      'runner': 'is born, who will excel in running and athletics',
      'guitarist': 'is born, who will master the art of guitar',
      'songwriter': 'is born, who will pen memorable songs',
      'producer': 'is born, who will create influential productions',
      'playwright': 'is born, who will write memorable theatrical works',
      'comedian': 'is born, who will bring laughter to many audiences'
    };
    
    // Find the best template match
    let template = null;
    for (const [key, value] of Object.entries(birthTemplates)) {
      if (profession.toLowerCase().includes(key)) {
        template = value;
        break;
      }
    }
    
    if (!template) {
      const categoryDesc = this.categorizeProfession(profession);
      template = `is born, who will make significant contributions to ${categoryDesc}`;
    }
    
    return `${name} ${template}.`;
  }

  categorizeProfession(profession) {
    const prof = profession.toLowerCase();
    
    if (prof.includes('singer') || prof.includes('musician') || prof.includes('composer')) {
      return 'music and entertainment';
    } else if (prof.includes('actor') || prof.includes('actress') || prof.includes('director')) {
      return 'film and theater';
    } else if (prof.includes('writer') || prof.includes('author') || prof.includes('poet')) {
      return 'literature and writing';
    } else if (prof.includes('scientist') || prof.includes('physicist') || prof.includes('chemist')) {
      return 'science and research';
    } else if (prof.includes('politician') || prof.includes('president') || prof.includes('minister')) {
      return 'politics and governance';
    } else if (prof.includes('artist') || prof.includes('painter') || prof.includes('sculptor')) {
      return 'arts and culture';
    } else if (prof.includes('athlete') || prof.includes('player') || prof.includes('sports')) {
      return 'sports and athletics';
    } else {
      return 'their field';
    }
  }

  isNotablePerson(person) {
    if (!person.text) return false;
    
    const text = person.text.toLowerCase();
    
    // Filter for truly notable people based on their description
    const notableKeywords = [
      'president', 'prime minister', 'king', 'queen', 'emperor',
      'nobel', 'academy award', 'oscar', 'grammy', 'pulitzer',
      'famous', 'renowned', 'legendary', 'influential',
      'bestselling', 'world champion', 'olympic',
      'founder', 'inventor', 'pioneer', 'revolutionary',
      'international', 'world-famous', 'acclaimed'
    ];
    
    // Check if person has notable keywords
    const hasNotableKeywords = notableKeywords.some(keyword => text.includes(keyword));
    
    // Also check if they have a Wikipedia page (indicated by pages array)
    const hasWikipediaPage = person.pages && person.pages.length > 0;
    
    // Include if they have notable keywords or a substantial Wikipedia presence
    return hasNotableKeywords || hasWikipediaPage;
  }

  async fetchMediaForEvent(event, year) {
    // Initialize media cache if not exists
    if (!this.mediaCache) {
      this.mediaCache = new Map();
    }
    
    // Initialize rate limiting
    if (!this.lastMediaFetch) {
      this.lastMediaFetch = 0;
    }
    
    // Rate limiting: minimum 500ms between media fetch attempts
    const now = Date.now();
    const timeSinceLastFetch = now - this.lastMediaFetch;
    if (timeSinceLastFetch < 500) {
      await new Promise(resolve => setTimeout(resolve, 500 - timeSinceLastFetch));
    }
    this.lastMediaFetch = Date.now();
    
    // Check cache first
    const cacheKey = `${year}-${event?.name || 'unknown'}`;
    if (this.mediaCache.has(cacheKey)) {
      console.log(`📦 Using cached media for ${year}`);
      return this.mediaCache.get(cacheKey);
    }
    
    let mediaResult = null;
    
    // Check if we have curated media for this year
    if (curatedMedia[year]) {
      mediaResult = curatedMedia[year];
    }
    
    // Try to get media from Wikipedia if event has pages
    if (!mediaResult && event && event.pages && event.pages.length > 0) {
      mediaResult = await this.fetchWikipediaMedia(event.pages[0], year);
    }
    
    // Try alternative search methods
    if (!mediaResult) {
      mediaResult = await this.searchAlternativeMedia(event, year);
    }

    // Enhanced search with multiple strategies
    if (!mediaResult) {
      mediaResult = await this.comprehensiveMediaSearch(event, year);
    }

    // Cache the result (even if null to avoid repeated failed requests)
    this.mediaCache.set(cacheKey, mediaResult);

    return mediaResult;
  }

  async fetchWikipediaMedia(page, year) {
    try {
      // First try direct thumbnail
      if (page.thumbnail) {
        const highResUrl = page.thumbnail.source.replace('/320px-', '/800px-').replace('/240px-', '/800px-');
        const isValid = await this.validateImageUrl(highResUrl);
        if (isValid) {
          return {
            type: 'image',
            url: highResUrl,
            alt: page.title || `Historical image from ${year}`,
            source: 'Wikipedia thumbnail'
          };
        }
      }
      
      // Try page media API
      const pageTitle = encodeURIComponent(page.title);
      const mediaResponse = await Promise.race([
        fetch(`https://en.wikipedia.org/api/rest_v1/page/media/${pageTitle}`, {
          headers: { 'User-Agent': 'RandomHistoryApp/1.0 (Educational Purpose)' }
        }),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 3000))
      ]);
      
      if (mediaResponse.ok) {
        const mediaData = await mediaResponse.json();
        const validImages = mediaData.items?.filter(item => 
          item.type === 'image' && 
          item.srcset && 
          !item.title.toLowerCase().includes('commons-logo') &&
          !item.title.toLowerCase().includes('.svg') &&
          item.srcset.includes('upload.wikimedia.org')
        );
        
        if (validImages && validImages.length > 0) {
          const bestImage = validImages[0]; // Use first valid image
          const imageUrl = bestImage.srcset.split(' ')[0];
          
          const isValid = await this.validateImageUrl(imageUrl);
          if (isValid) {
            return {
              type: 'image',
              url: imageUrl,
              alt: bestImage.title || `Historical image from ${year}`,
              source: 'Wikipedia media'
            };
          }
        }
      }
    } catch (error) {
      console.warn('Wikipedia media fetch failed:', error.message);
    }
    
    return null;
  }

  async searchAlternativeMedia(event, year) {
    try {
      // Extract search terms from event
      const searchTerms = this.extractMediaSearchTerms(event, year);
      
      for (const term of searchTerms) {
        // Try Wikipedia Commons search
        const commonsResult = await this.searchWikimediaCommons(term, year);
        if (commonsResult) return commonsResult;
        
        // Try Wikimedia category search
        const categoryResult = await this.searchWikimediaCategory(year);
        if (categoryResult) return categoryResult;
      }
    } catch (error) {
      console.warn('Alternative media search failed:', error.message);
    }
    
    return null;
  }

  extractMediaSearchTerms(event, year) {
    const terms = [];
    
    if (event?.name) {
      // Extract key terms from event name
      const cleanName = event.name.replace(/\([^)]*\)/g, '').trim();
      terms.push(cleanName);
      
      // Extract specific entities
      const entities = cleanName.match(/\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\b/g);
      if (entities) {
        terms.push(...entities.slice(0, 2)); // Limit to first 2 entities
      }
    }
    
    if (event?.text) {
      // Extract key terms from description
      const keyWords = event.text.match(/\b(?:Battle|Treaty|War|University|Company|Building|Monument|Palace|Castle|Cathedral)\s+(?:of\s+)?([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/g);
      if (keyWords) {
        terms.push(...keyWords.slice(0, 2));
      }
    }
    
    // Add year-based search
    terms.push(`${year} historical events`);
    
    return [...new Set(terms)]; // Remove duplicates
  }

  async searchWikimediaCommons(searchTerm, year) {
    try {
      const response = await Promise.race([
        fetch(`https://commons.wikimedia.org/w/api.php?action=query&list=search&srsearch="${searchTerm}"&srnamespace=6&format=json&origin=*&srlimit=3`),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 2000))
      ]);
      
      if (response.ok) {
        const data = await response.json();
        if (data.query?.search?.length > 0) {
          const file = data.query.search[0];
          const fileName = file.title.replace('File:', '');
          const imageUrl = `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(fileName)}?width=600`;
          
          const isValid = await this.validateImageUrl(imageUrl);
          if (isValid) {
            return {
              type: 'image',
              url: imageUrl,
              alt: `Historical image related to ${searchTerm}`,
              source: 'Wikimedia Commons'
            };
          }
        }
      }
    } catch (error) {
      console.warn(`Commons search failed for "${searchTerm}":`, error.message);
    }
    
    return null;
  }

  async searchWikimediaCategory(year) {
    try {
      const decade = Math.floor(year / 10) * 10;
      const century = Math.floor(year / 100) + 1;
      
      const categorySearches = [
        `${year}`,
        `${decade}s`,
        `${century}th century`
      ];
      
      for (const category of categorySearches) {
        try {
          const response = await Promise.race([
            fetch(`https://commons.wikimedia.org/w/api.php?action=query&list=categorymembers&cmtitle=Category:${category}&cmnamespace=6&format=json&origin=*&cmlimit=5`),
            new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 2000))
          ]);
          
          if (response.ok) {
            const data = await response.json();
            if (data.query?.categorymembers?.length > 0) {
              const file = data.query.categorymembers[0];
              const fileName = file.title.replace('File:', '');
              const imageUrl = `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(fileName)}?width=600`;
              
              const isValid = await this.validateImageUrl(imageUrl);
              if (isValid) {
                return {
                  type: 'image',
                  url: imageUrl,
                  alt: `Historical image from ${year}`,
                  source: 'Wikimedia category'
                };
              }
            }
          }
        } catch (error) {
          continue; // Try next category
        }
      }
    } catch (error) {
      console.warn('Category search failed:', error.message);
    }
    
    return null;
  }

  async comprehensiveMediaSearch(event, year) {
    try {
      // Extract key terms more intelligently
      const searchTerms = this.extractAdvancedMediaSearchTerms(event, year);
      
      if (searchTerms.length === 0) {
        console.log('No quality search terms found, skipping media search');
        return null;
      }
      
      console.log(`🔍 Searching for media with terms: ${searchTerms.join(', ')}`);
      
      for (const term of searchTerms) {
        try {
          // Try search strategies sequentially with timeout
          const searchMethods = [
            () => this.searchWikimediaCommons(term, year),
            () => this.searchWikimediaCategory(year),
            () => this.searchHistoricalArchives(term, year)
          ];
          
          for (const searchMethod of searchMethods) {
            try {
              const result = await Promise.race([
                searchMethod(),
                new Promise((_, reject) => setTimeout(() => reject(new Error('Search timeout')), 3000))
              ]);
              
              if (result) {
                console.log(`✅ Found media via ${searchMethod.name} for term: ${term}`);
                return result;
              }
            } catch (methodError) {
              console.warn(`Search method failed for term "${term}":`, methodError.message);
              continue; // Try next method
            }
          }
        } catch (termError) {
          console.warn(`All search methods failed for term "${term}":`, termError.message);
          continue; // Try next term
        }
      }
      
      console.log('No media found after trying all search terms');
    } catch (error) {
      console.warn('Comprehensive media search failed:', error);
    }
    
    return null;
  }

  extractAdvancedMediaSearchTerms(event, year) {
    const text = (event?.text || event?.name || '').toLowerCase();
    const rawText = event?.rawEvent ? event.rawEvent.text.toLowerCase() : text;
    const allText = `${text} ${rawText}`;
    
    const terms = [];
    
    // Extract person names (pattern: Name, profession) - but avoid sports/generic terms
    const personMatch = allText.match(/^([^,]+),\s*([^(]+)/);
    if (personMatch) {
      const name = personMatch[1].trim();
      const profession = personMatch[2].trim();
      
      // Skip if it's clearly sports-related or generic
      if (!this.isLowQualitySearchTerm(name) && !profession.includes('playoff')) {
        terms.push(name);
        if (year >= 1850) { // Only add year for photographic era
          terms.push(`${name} ${year}`);
        }
      }
    }
    
    // Extract location names - but be more selective
    const locationPatterns = [
      /in ([A-Z][a-z]+(?:\s+[A-Z][a-z]+){0,2})/g, // Limit to 3 words max
      /at ([A-Z][a-z]+(?:\s+[A-Z][a-z]+){0,2})/g,
    ];
    
    locationPatterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(allText)) !== null) {
        const location = match[1];
        if (!this.isLowQualitySearchTerm(location)) {
          terms.push(location);
        }
      }
    });
    
    // Extract event types - more selective list
    const visualEventKeywords = [
      'war', 'battle', 'earthquake', 'disaster', 'crash', 'fire', 'explosion',
      'assassination', 'murder', 'revolution', 'coup', 'invasion',
      'building', 'bridge', 'monument', 'palace', 'cathedral',
      'invention', 'discovery', 'launch', 'flight'
    ];
    
    visualEventKeywords.forEach(keyword => {
      if (allText.includes(keyword)) {
        terms.push(`${keyword} ${year}`);
      }
    });
    
    // Only add decade terms for significant historical periods
    if (year >= 1850 && year <= 2000) {
      const decade = `${Math.floor(year / 10) * 10}s`;
      terms.push(decade);
    }
    
    // Filter and return high-quality terms only
    const qualityTerms = terms.filter(term => !this.isLowQualitySearchTerm(term));
    return [...new Set(qualityTerms)].slice(0, 3); // Reduced to 3 terms for efficiency
  }

  isLowQualitySearchTerm(term) {
    if (!term || term.length < 3) return true;
    
    const lowQualityPatterns = [
      /^\d{4}[-–]\d{4}/,           // Date ranges like "1994-1996"
      /playoffs?$/i,               // Sports playoffs
      /season$/i,                  // Sports seasons
      /\bnfl\b|\bnhl\b|\bnba\b/i,  // Sports leagues
      /realignment/i,              // TV/broadcast terms
      /crisis$/i,                  // Generic crisis terms
      /^[\d\s\-–]+$/,             // Only numbers and punctuation
      /^\d{4}$/,                   // Just years
    ];
    
    return lowQualityPatterns.some(pattern => pattern.test(term));
  }

  async searchHistoricalArchives(searchTerm, year) {
    try {
      // Skip obviously poor search terms
      if (this.isLowQualitySearchTerm(searchTerm)) {
        console.log(`Skipping low-quality search term: ${searchTerm}`);
        return null;
      }
      
      // Enhanced Wikipedia search with better term handling
      const cleanSearchTerm = searchTerm.replace(/[^\w\s]/g, ' ').trim();
      if (!cleanSearchTerm) return null;
      
      const wikiSearchUrl = `https://en.wikipedia.org/w/api.php?action=opensearch&search=${encodeURIComponent(cleanSearchTerm)}&limit=2&namespace=0&format=json&origin=*`;
      
      const response = await Promise.race([
        fetch(wikiSearchUrl),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 2000))
      ]);
      
      if (response.ok) {
        const [, titles, , urls] = await response.json();
        
        if (!titles || titles.length === 0) {
          console.log(`No Wikipedia results for: ${cleanSearchTerm}`);
          return null;
        }
        
        // Only try the first result to avoid excessive API calls
        const title = titles[0];
        if (title) {
          const mediaResult = await this.getImagesFromWikipediaPage(title);
          if (mediaResult) {
            return mediaResult;
          }
        }
      } else {
        console.warn(`Wikipedia search failed with status: ${response.status}`);
      }
    } catch (error) {
      console.warn(`Historical archives search failed for "${searchTerm}":`, error.message);
    }
    
    return null;
  }

  async getImagesFromWikipediaPage(pageTitle) {
    try {
      // Clean and validate page title before making API call
      const cleanTitle = this.cleanWikipediaPageTitle(pageTitle);
      if (!cleanTitle) {
        console.warn('Invalid page title, skipping:', pageTitle);
        return null;
      }
      
      const response = await Promise.race([
        fetch(`https://en.wikipedia.org/api/rest_v1/page/media/${encodeURIComponent(cleanTitle)}`, {
          headers: { 'User-Agent': 'RandomHistoryApp/1.0 (Educational Purpose)' }
        }),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 2000))
      ]);
      
      if (response.ok) {
        const mediaData = await response.json();
        const validImages = mediaData.items?.filter(item => 
          item.type === 'image' && 
          item.srcset && 
          !item.title.toLowerCase().includes('commons-logo') &&
          !item.title.toLowerCase().includes('.svg') &&
          item.srcset.includes('upload.wikimedia.org')
        );
        
        if (validImages && validImages.length > 0) {
          const bestImage = validImages[0];
          const imageUrl = bestImage.srcset.split(' ')[0];
          
          const isValid = await this.validateImageUrl(imageUrl);
          if (isValid) {
            return {
              type: 'image',
              url: imageUrl,
              alt: bestImage.title || `Historical image related to ${pageTitle}`,
              source: 'Wikipedia enhanced search'
            };
          }
        }
      }
    } catch (error) {
      console.warn('Wikipedia page media fetch failed:', error);
    }
    
    return null;
  }

  cleanWikipediaPageTitle(title) {
    if (!title || typeof title !== 'string') return null;
    
    // Remove common problematic patterns
    let cleanTitle = title.trim();
    
    // Skip titles that are clearly invalid
    const invalidPatterns = [
      /^\d{4}[-–]\d{4}.*playoffs?$/i,  // Sports playoffs with date ranges
      /^\d{4}[-–]\d{4}.*season$/i,     // Sports seasons with date ranges
      /^\d{4}[-–]\d{4}.*realignment$/i, // TV/broadcast realignments
      /^\d{4}[-–]\d{4}.*crisis$/i,     // Financial crises
      /^\d{4}[-–]\d{4}$/,              // Just year ranges
      /^[\d\s\-–]+$/,                  // Only numbers and dashes
    ];
    
    for (const pattern of invalidPatterns) {
      if (pattern.test(cleanTitle)) {
        console.warn('Skipping invalid page title pattern:', cleanTitle);
        return null;
      }
    }
    
    // Clean up common issues
    cleanTitle = cleanTitle
      .replace(/[-–]/g, '-')  // Normalize dashes
      .replace(/\s+/g, ' ')   // Normalize spaces
      .trim();
    
    // Skip very short or very long titles
    if (cleanTitle.length < 3 || cleanTitle.length > 100) {
      return null;
    }
    
    return cleanTitle;
  }

  async validateImageUrl(url) {
    try {
      // Skip validation for trusted domains to avoid CORS issues
      const trustedDomains = [
        'upload.wikimedia.org',
        'commons.wikimedia.org',
        'en.wikipedia.org'
      ];
      
      const urlObj = new URL(url);
      if (trustedDomains.some(domain => urlObj.hostname.includes(domain))) {
        // For trusted domains, do basic URL format validation
        const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'];
        const hasImageExtension = imageExtensions.some(ext => 
          url.toLowerCase().includes(ext) || url.toLowerCase().includes('width=')
        );
        return hasImageExtension;
      }
      
      // For other domains, try HEAD request but don't fail on CORS
      const response = await Promise.race([
        fetch(url, { method: 'HEAD' }),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 2000))
      ]);
      
      return response.ok && response.headers.get('content-type')?.startsWith('image/');
    } catch (error) {
      // If validation fails (CORS, network, etc.), assume URL might be valid
      // Better to show a potentially broken image than miss valid content
      console.warn('Image URL validation failed, assuming valid:', error.message);
      return true;
    }
  }

  async validateAudioUrl(url) {
    try {
      const response = await Promise.race([
        fetch(url, { method: 'HEAD' }),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 2000))
      ]);
      
      const contentType = response.headers.get('content-type');
      const isValid = response.ok && (
        contentType?.startsWith('audio/') || 
        contentType?.includes('mpeg') ||
        contentType?.includes('mp3') ||
        contentType?.includes('wav') ||
        contentType?.includes('ogg')
      );
      
      console.log(`Audio URL validation for ${url}:`, {
        status: response.status,
        contentType: contentType,
        isValid: isValid
      });
      
      return isValid;
    } catch (error) {
      console.warn('Audio URL validation failed:', error);
      return false; // Allow audio to try loading even if validation fails
    }
  }

  // Debug function to test audio playback
  debugAudioPlayback(mediaData) {
    console.log('🎵 Debugging audio playback:', {
      url: mediaData.url,
      fallback: mediaData.fallback,
      title: mediaData.title
    });
    
    // Test if we can create and play audio programmatically
    const testAudio = new Audio();
    
    testAudio.onloadstart = () => console.log('✅ Audio load started');
    testAudio.oncanplay = () => console.log('✅ Audio can play');
    testAudio.onplay = () => console.log('✅ Audio play event fired');
    testAudio.onpause = () => console.log('⏸️ Audio paused');
    testAudio.onerror = (e) => console.error('❌ Audio error:', e);
    testAudio.onstalled = () => console.warn('⚠️ Audio stalled');
    testAudio.onwaiting = () => console.warn('⏳ Audio waiting');
    
    testAudio.src = mediaData.url;
    testAudio.load();
    
    return testAudio;
  }

  validateAndCorrectMediaType(mediaData) {
    if (!mediaData || !mediaData.url) return mediaData;
    
    const url = mediaData.url.toLowerCase();
    
    // Determine correct type based on URL extension or content
    let correctType = mediaData.type;
    
    if (url.includes('.jpg') || url.includes('.jpeg') || url.includes('.png') || 
        url.includes('.gif') || url.includes('.webp') || url.includes('.svg') ||
        url.includes('upload.wikimedia.org') || url.includes('commons.wikimedia.org')) {
      correctType = 'image';
    } else if (url.includes('.mp3') || url.includes('.ogg') || url.includes('.wav') || 
               url.includes('.m4a') || url.includes('audio')) {
      correctType = 'audio';
    } else if (url.includes('.mp4') || url.includes('.webm') || url.includes('.avi') || 
               url.includes('video')) {
      correctType = 'video';
    }
    
    // Log if we're correcting the type
    if (correctType !== mediaData.type) {
      console.warn(`🔧 Correcting media type from "${mediaData.type}" to "${correctType}" for URL: ${mediaData.url}`);
      mediaData.type = correctType;
    }
    
    return mediaData;
  }

  displayMedia(mediaData) {
    // Hide media thumbnail first
    if (this.elements.mediathumbnail) {
      this.elements.mediathumbnail.style.display = 'none';
    }
    
    if (!mediaData) return;
    
    // Debug media data
    console.log('🎬 displayMedia called with:', {
      type: mediaData.type,
      url: mediaData.url,
      source: mediaData.source,
      alt: mediaData.alt
    });
    
    // Validate and correct media type based on URL
    mediaData = this.validateAndCorrectMediaType(mediaData);
    
    // Store current media data for modal
    this.currentMediaData = mediaData;
    
    // Show thumbnail for images
    if (mediaData.type === 'image' && this.elements.mediathumbnail && this.elements.eventimage) {
      console.log('📸 Displaying image thumbnail:', mediaData.url);
      
      // Clear any previous innerHTML content (from audio/video indicators)
      this.elements.mediathumbnail.innerHTML = '';
      
      // Ensure the img element exists in the thumbnail container
      if (!this.elements.mediathumbnail.querySelector('#event-image')) {
        this.elements.mediathumbnail.innerHTML = `
          <img id="event-image" alt="Historical image" />
          <div class="media-overlay">
            <span>📸 Click to view</span>
          </div>
        `;
        // Update the reference
        this.elements.eventimage = this.elements.mediathumbnail.querySelector('#event-image');
      }
      
      this.elements.eventimage.src = mediaData.url;
      this.elements.eventimage.alt = mediaData.alt || 'Historical image';
      this.elements.mediathumbnail.style.display = 'block';
      
      this.elements.eventimage.onerror = () => {
        console.warn('Failed to load image:', mediaData.url);
        this.elements.mediathumbnail.style.display = 'none';
      };
      
      // Add click handler for modal
      this.elements.mediathumbnail.onclick = () => this.openMediaModal(mediaData);
    }
    
    // For audio/video, we'll show them directly in a compact form or indicate availability
    if (mediaData.type === 'audio' || mediaData.type === 'video') {
      console.log(`🎵 Displaying ${mediaData.type} indicator for:`, mediaData.url);
      // Show a media indicator that opens the modal
      if (this.elements.mediathumbnail) {
        this.elements.mediathumbnail.innerHTML = `
          <div style="width: 300px; height: 200px; background: linear-gradient(135deg, rgba(110, 231, 183, 0.1), rgba(110, 231, 183, 0.05)); border-radius: 8px; display: flex; align-items: center; justify-content: center; cursor: pointer; border: 1px solid rgba(110, 231, 183, 0.2);">
            <div style="text-align: center; color: var(--accent);">
              <div style="font-size: 48px; margin-bottom: 8px;">${mediaData.type === 'audio' ? '🎵' : '🎬'}</div>
              <div style="font-weight: 600;">${mediaData.type === 'audio' ? 'Audio Available' : 'Video Available'}</div>
              <div style="font-size: 13px; opacity: 0.7;">Click to ${mediaData.type === 'audio' ? 'listen' : 'watch'}</div>
            </div>
          </div>
        `;
        this.elements.mediathumbnail.style.display = 'block';
        this.elements.mediathumbnail.onclick = () => this.openMediaModal(mediaData);
      }
    }
  }

  openMediaModal(mediaData) {
    if (!this.elements.mediamodal) return;
    
    // Set modal title
    if (this.elements.modaltitle) {
      this.elements.modaltitle.textContent = mediaData.title || mediaData.alt || 'Historical Media';
    }
    
    // Hide all modal media elements
    if (this.elements.modalimage) this.elements.modalimage.style.display = 'none';
    if (this.elements.modalaudio) this.elements.modalaudio.style.display = 'none';
    if (this.elements.modalvideo) this.elements.modalvideo.style.display = 'none';
    
    // Show appropriate media in modal
    switch (mediaData.type) {
      case 'image':
        if (this.elements.modalimage) {
          this.elements.modalimage.src = mediaData.url;
          this.elements.modalimage.alt = mediaData.alt || 'Historical image';
          this.elements.modalimage.style.display = 'block';
        }
        break;
      case 'audio':
        if (this.elements.modalaudio) {
          // Debug audio playback
          console.log('🎵 Opening audio in modal');
          this.debugAudioPlayback(mediaData);
          
          // Reset the audio element first
          this.elements.modalaudio.pause();
          this.elements.modalaudio.currentTime = 0;
          
          // Set source and load
          this.elements.modalaudio.src = mediaData.url;
          this.elements.modalaudio.style.display = 'block';
          
          // Add error handling
          this.elements.modalaudio.onloadstart = () => {
            console.log('Audio loading started:', mediaData.url);
          };
          
          this.elements.modalaudio.oncanplay = () => {
            console.log('Audio can start playing');
          };
          
          this.elements.modalaudio.onerror = (error) => {
            console.error('Audio failed to load:', error);
            console.error('Audio URL:', mediaData.url);
            
            // Try fallback URL if available
            if (mediaData.fallback) {
              console.log('Trying fallback URL:', mediaData.fallback);
              this.elements.modalaudio.src = mediaData.fallback;
            } else {
              // Show error message with alternative access
              if (this.elements.modaldescription) {
                this.elements.modaldescription.innerHTML = `
                  <div style="color: #ff6b35; font-weight: bold; margin-bottom: 12px;">
                    ⚠️ Audio Player Issue
                  </div>
                  <div style="margin-bottom: 16px; font-size: 14px; line-height: 1.4;">
                    The audio couldn't load in the player. Try these alternatives:
                  </div>
                  <div style="margin-bottom: 16px;">
                    <a href="${mediaData.url}" target="_blank" rel="noopener" 
                       style="display: inline-block; background: var(--accent); color: #000; 
                              padding: 8px 16px; border-radius: 6px; text-decoration: none; 
                              font-weight: bold; margin-right: 8px;">
                      🎵 Open Audio File
                    </a>
                    ${mediaData.fallback ? `
                      <a href="${mediaData.fallback}" target="_blank" rel="noopener"
                         style="display: inline-block; background: rgba(110, 231, 183, 0.2); 
                                color: var(--accent); padding: 8px 16px; border-radius: 6px; 
                                text-decoration: none; border: 1px solid var(--accent);">
                        🔗 Alternative Source
                      </a>
                    ` : ''}
                  </div>
                  <details style="margin-top: 16px; font-size: 12px; color: var(--muted);">
                    <summary style="cursor: pointer; color: var(--accent);">Why might this happen?</summary>
                    <div style="margin-top: 8px; padding-left: 16px;">
                      <ul style="padding-left: 16px;">
                        <li>Browser security policies for audio playback</li>
                        <li>CORS restrictions on external audio files</li>
                        <li>Network connectivity issues</li>
                        <li>File format compatibility</li>
                      </ul>
                    </div>
                  </details>
                `;
              }
            }
          };
          
          // Force load the audio
          this.elements.modalaudio.load();
          
          // Add manual play button as backup
          if (this.elements.modaldescription) {
            const originalDescription = mediaData.description || mediaData.alt || 'Historical audio content';
            this.elements.modaldescription.innerHTML = `
              <div style="margin-bottom: 16px;">
                ${originalDescription}
              </div>
              <div style="display: flex; gap: 8px; align-items: center; margin-bottom: 12px;">
                <button onclick="document.getElementById('modal-audio').play()" 
                        style="background: var(--accent); color: #000; border: none; 
                               padding: 8px 16px; border-radius: 6px; cursor: pointer; 
                               font-weight: bold;">
                  ▶️ Play Audio
                </button>
                <button onclick="document.getElementById('modal-audio').pause()" 
                        style="background: rgba(255, 255, 255, 0.1); color: white; border: 1px solid rgba(255, 255, 255, 0.2); 
                               padding: 8px 16px; border-radius: 6px; cursor: pointer;">
                  ⏸️ Pause
                </button>
                <a href="${mediaData.url}" target="_blank" rel="noopener"
                   style="color: var(--accent); text-decoration: none; font-size: 12px;">
                  🔗 Direct Link
                </a>
              </div>
              <div style="font-size: 12px; color: var(--muted);">
                If the player controls don't work, try the manual buttons above or the direct link.
              </div>
            `;
          }
        }
        break;
      case 'video':
        if (this.elements.modalvideo) {
          // Reset the video element first
          this.elements.modalvideo.pause();
          this.elements.modalvideo.currentTime = 0;
          
          // Set source and load
          this.elements.modalvideo.src = mediaData.url;
          this.elements.modalvideo.style.display = 'block';
          
          // Add error handling for video too
          this.elements.modalvideo.onerror = (error) => {
            console.error('Video failed to load:', error);
            if (this.elements.modaldescription) {
              this.elements.modaldescription.innerHTML = `
                <div style="color: #ff6b35; font-weight: bold;">
                  ⚠️ Video failed to load
                </div>
                <div style="margin-top: 8px; font-size: 14px;">
                  The video file could not be loaded.
                </div>
              `;
            }
          };
          
          // Force load the video
          this.elements.modalvideo.load();
        }
        break;
    }
    
    // Set description
    if (this.elements.modaldescription) {
      this.elements.modaldescription.textContent = mediaData.description || mediaData.alt || 'Historical media content';
    }
    
    // Show modal
    this.elements.mediamodal.style.display = 'flex';
    
    // Prevent body scroll
    document.body.style.overflow = 'hidden';
  }

  closeMediaModal() {
    if (this.elements.mediamodal) {
      this.elements.mediamodal.style.display = 'none';
    }
    
    // Restore body scroll
    document.body.style.overflow = '';
    
    // Pause any playing media
    if (this.elements.modalaudio) this.elements.modalaudio.pause();
    if (this.elements.modalvideo) this.elements.modalvideo.pause();
  }

  async handleMultimediaWithLoadingState(eventData) {
    if (!this.elements.mediathumbnail) return;

    // Check if we already have media
    if (eventData.media) {
      this.displayMedia(eventData.media);
      return;
    }

    // Check curated media first
    if (curatedMedia[eventData.year]) {
      this.displayMedia(curatedMedia[eventData.year]);
      return;
    }

    // Determine if this event should have multimedia
    const shouldHaveMedia = this.shouldEventHaveMultimedia(eventData);
    
    if (shouldHaveMedia) {
      // Show loading state with placeholder
      this.showMultimediaLoadingState();

      try {
        // Attempt to fetch media in the background
        console.log('🔍 Fetching media for event:', eventData.year, eventData.name || eventData.text?.substring(0, 50));
        const mediaData = await this.fetchMediaForEvent(eventData, eventData.year);
        
        if (mediaData) {
          console.log('✅ Media found:', {
            type: mediaData.type,
            url: mediaData.url,
            source: mediaData.source
          });
          // Media found - display it
          eventData.media = mediaData; // Cache it in the event data
          this.displayMedia(mediaData);
        } else {
          console.log('❌ No media found for event');
          // No media found but should have - show placeholder with message
          this.showMultimediaNotFoundState();
        }
      } catch (error) {
        console.warn('Failed to fetch multimedia:', error);
        this.showMultimediaNotFoundState();
      }
    } else {
      // Event likely doesn't need multimedia - hide media container
      this.hideMultimediaLoadingState();
    }
  }

  shouldEventHaveMultimedia(eventData) {
    const text = (eventData.text || eventData.name || '').toLowerCase();
    const rawText = eventData.rawEvent ? eventData.rawEvent.text.toLowerCase() : text;
    
    // Historical events that typically have visual documentation
    const visualEvents = [
      'war', 'battle', 'invasion', 'attack', 'bombing', 'crash', 'disaster',
      'earthquake', 'tsunami', 'hurricane', 'fire', 'explosion', 
      'assassination', 'murder', 'protest', 'revolution', 'coup',
      'launched', 'landing', 'flight', 'invention', 'discovery',
      'opens', 'built', 'construction', 'building', 'bridge', 'monument',
      'ceremony', 'celebration', 'festival', 'performance', 'concert',
      'treaty', 'agreement', 'conference', 'meeting', 'summit',
      'olympic', 'championship', 'world cup', 'match', 'game'
    ];

    // People events that typically have photos
    const peopleEvents = [
      'born', 'dies', 'elected', 'crowned', 'married', 'divorced',
      'president', 'king', 'queen', 'emperor', 'leader', 'prime minister'
    ];

    // Check for visual event keywords
    const hasVisualKeywords = visualEvents.some(keyword => 
      text.includes(keyword) || rawText.includes(keyword)
    );

    // Check for people events (but be more selective)
    const hasPeopleKeywords = peopleEvents.some(keyword => 
      text.includes(keyword) || rawText.includes(keyword)
    );

    // Events from certain years are more likely to have photos
    const photographicEra = eventData.year >= 1850;
    
    // More likely to have media if it's a significant historical event
    const isSignificantEvent = text.length > 100 || rawText.length > 100;

    return (hasVisualKeywords && photographicEra) || 
           (hasPeopleKeywords && eventData.year >= 1900) ||
           (isSignificantEvent && eventData.year >= 1920);
  }

  showMultimediaLoadingState() {
    if (!this.elements.mediathumbnail) return;

    // Create loading placeholder with spinner
    this.elements.mediathumbnail.innerHTML = `
      <div class="media-loading-container">
        <div class="media-placeholder">
          <div class="loading-spinner"></div>
          <div class="loading-text">Finding multimedia...</div>
        </div>
      </div>
    `;
    this.elements.mediathumbnail.style.display = 'block';
  }

  hideMultimediaLoadingState() {
    if (!this.elements.mediathumbnail) return;
    this.elements.mediathumbnail.style.display = 'none';
  }

  showMultimediaNotFoundState() {
    if (!this.elements.mediathumbnail) return;

    // Show placeholder indicating no media was found
    this.elements.mediathumbnail.innerHTML = `
      <div class="media-loading-container">
        <div class="media-placeholder media-not-found">
          <div class="not-found-icon">📷</div>
          <div class="not-found-text">No multimedia found</div>
          <div class="not-found-subtext">This event may not have visual documentation</div>
        </div>
      </div>
    `;
    this.elements.mediathumbnail.style.display = 'block';
    
    // Hide the placeholder after a few seconds
    setTimeout(() => {
      this.hideMultimediaLoadingState();
    }, 3000);
  }

  getRandomMonth() {
    return Math.floor(Math.random() * 12) + 1;
  }

  getRandomDay() {
    return Math.floor(Math.random() * 28) + 1; // Safe day range for all months
  }

  async autoFetchEventForYear(year) {
    // Check if we already have cached data for this year
    if (!this.eventCache) this.eventCache = new Map();
    
    if (this.eventCache.has(year)) {
      const cachedEvent = this.eventCache.get(year);
      if (this.elements.displayevent) this.elements.displayevent.textContent = cachedEvent.text;
      if (this.elements.displaysub) this.elements.displaysub.textContent = `Source: ${cachedEvent.source} (cached)`;
      return cachedEvent;
    }
    
    // Show subtle loading indicator
    if (this.elements.displaysub) {
      this.elements.displaysub.textContent = `🔄 Loading...`;
    }
    
    try {
      // Race between API fetch and timeout
      const eventDataPromise = this.fetchEventsForYear(year);
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('API timeout')), 3000)
      );
      
      const eventData = await Promise.race([eventDataPromise, timeoutPromise]);
      
      // Cache the result
      this.eventCache.set(year, eventData);
      
      // Only update if we're still on the same year (user might have navigated away)
      const currentYear = this.years[this.currentSelection.index];
      if (currentYear === year) {
        // Update event display with enhanced format
        if (this.elements.displaysub) this.elements.displaysub.textContent = `Source: ${eventData.source}`;
        
        // Show event date if available
        if (eventData.date && this.elements.eventdate) {
          console.log('Showing event date:', eventData.date);
          this.elements.eventdate.textContent = eventData.date;
          this.elements.eventdate.style.display = 'block';
        } else if (this.elements.eventdate) {
          console.log('Hiding event date - no date available or element not found');
          this.elements.eventdate.style.display = 'none';
        }
        
        // Display event in the new structured format
        this.displayEventInStructuredFormat(eventData);
        
        // Display media if available
        if (eventData.media) {
          this.displayMedia(eventData.media);
        } else {
          this.displayMedia(null);
        }
      }
      
      return eventData;
    } catch (error) {
      console.warn('autoFetchEventForYear failed:', error);
      const currentYear = this.years[this.currentSelection.index];
      if (currentYear === year) {
        const fallbackData = this.getFallbackEvent(year);
        // Cache fallback too to avoid repeated failures
        this.eventCache.set(year, fallbackData);
        
        if (this.elements.displayevent) this.elements.displayevent.textContent = fallbackData.text;
        if (this.elements.displaysub) this.elements.displaysub.textContent = fallbackData.source;
        return fallbackData;
      }
    }
  }

  async fetchEventForCurrentYear() {
    const currentYear = this.years[this.currentSelection.index];
    this.showNotification(`🔄 Fetching event for ${currentYear}...`, 'info', 1000);
    
    try {
      const eventData = await this.fetchEventsForYear(currentYear);
      
      if (this.elements.displayyear) this.elements.displayyear.textContent = eventData.year;
      
      // Display event in the new structured format
      this.displayEventInStructuredFormat(eventData);
      
      // Display media if available
      if (eventData.media) {
        this.displayMedia(eventData.media);
      } else {
        this.displayMedia(null);
      }
      
      this.showNotification(`📚 Found event for ${eventData.year}`, 'success');
      return eventData;
    } catch (error) {
      console.warn('fetchEventForCurrentYear failed:', error);
      const fallbackData = this.getFallbackEvent(currentYear);
      
      if (this.elements.displayyear) this.elements.displayyear.textContent = fallbackData.year;
      if (this.elements.displayevent) this.elements.displayevent.textContent = fallbackData.text;
      if (this.elements.displaysub) this.elements.displaysub.textContent = `Source: ${fallbackData.source}`;
      
      this.showNotification('Using fallback event', 'warning');
      return fallbackData;
    }
  }

  /* ============================
     Fetch live "On This Day" event
     ============================ */
  async fetchRandomTodayEventOnline() {
    try {
      const currentYear = this.years[this.currentSelection.index];
      const eventData = await this.fetchEventsForYear(currentYear);
      
      if (this.elements.displayyear) this.elements.displayyear.textContent = eventData.year;
      if (this.elements.displaysub) this.elements.displaysub.textContent = `Source: ${eventData.source}`;
      
      // Show event date if available
      if (eventData.date && this.elements.eventdate) {
        this.elements.eventdate.textContent = eventData.date;
        this.elements.eventdate.style.display = 'block';
      } else if (this.elements.eventdate) {
        this.elements.eventdate.style.display = 'none';
      }
      
      // Display event in the new structured format
      this.displayEventInStructuredFormat(eventData);
      
      // Display media if available
      if (eventData.media) {
        this.displayMedia(eventData.media);
      } else {
        this.displayMedia(null);
      }
      
      this.showNotification(`🎲 Random event for ${eventData.year}`, 'info');
      return eventData;
    } catch(error) {
      console.warn('fetchRandomTodayEventOnline failed:',error);
      const currentYear = this.years[this.currentSelection.index];
      const fallbackData = this.getFallbackEvent(currentYear);
      
      if (this.elements.displayyear) this.elements.displayyear.textContent = fallbackData.year;
      if (this.elements.displayevent) this.elements.displayevent.textContent = fallbackData.text;
      if (this.elements.displaysub) this.elements.displaysub.textContent = `Source: ${fallbackData.source}`;
      
      this.showNotification('Using fallback event', 'warning');
      return fallbackData;
    }
  }

  /* ============================
     Initialization
     ============================ */
  init() {
    try {
      // Initialize caches
      this.apiCache = new Map();
      this.eventCache = new Map();
      
      // Clean up custom events
      Object.keys(this.customEvents).forEach(key => {
        const year = parseInt(key,10);
        if (!this.isValidYear(year)) delete this.customEvents[key];
      });
      
      if (this.elements.currentyearlabel) this.elements.currentyearlabel.textContent = CONFIG.CURRENT_YEAR;
      this.setupEventListeners();
      this.renderPage(this.pageIndex);
      
      // Don't auto-fetch on init, let user select year first
      this.showNotification('History Timeline loaded! Select any year to fetch events.', 'success');
      
      // Clear cache periodically to prevent memory issues
      setInterval(() => {
        if (this.apiCache.size > 50) {
          this.apiCache.clear();
        }
        if (this.eventCache.size > 100) {
          // Keep only recent 50 entries
          const entries = Array.from(this.eventCache.entries());
          this.eventCache.clear();
          entries.slice(-50).forEach(([key, value]) => {
            this.eventCache.set(key, value);
          });
        }
      }, 300000); // Every 5 minutes
      
    } catch(error) {
      console.error('Failed to initialize app:',error);
      this.showNotification('Failed to initialize app. Please refresh the page.','error');
      this.currentSelection.index = 0;
      this.pageIndex = 0;
      this.renderPage(this.pageIndex);
    }
  }

  displayEventInStructuredFormat(eventData) {
    // Hide fallback elements
    if (this.elements.displaysub) this.elements.displaysub.style.display = 'none';
    if (this.elements.displayevent) this.elements.displayevent.style.display = 'none';
    
    // YEAR - already displayed by main function
    
    // DATE
    if (eventData.date && this.elements.eventdate) {
      this.elements.eventdate.textContent = eventData.date;
      this.elements.eventdate.style.display = 'block';
    } else if (this.elements.eventdate) {
      this.elements.eventdate.style.display = 'none';
    }
    
    // SOURCE
    if (eventData.source && this.elements.eventsource) {
      this.elements.eventsource.textContent = `Source: ${eventData.source}`;
      this.elements.eventsource.style.display = 'block';
    } else if (this.elements.eventsource) {
      this.elements.eventsource.style.display = 'none';
    }
    
    // MULTIMEDIA - Enhanced with real-time loading
    this.handleMultimediaWithLoadingState(eventData);
    
    // TITLE - Show the original event text as title
    let titleText = eventData.rawEvent ? eventData.rawEvent.text : eventData.name;
    if (titleText && this.elements.eventname) {
      this.elements.eventname.textContent = titleText;
      this.elements.eventname.style.display = 'block';
    } else if (this.elements.eventname) {
      this.elements.eventname.style.display = 'none';
    }
    
    // DESCRIPTION - Show the enhanced description
    if (this.elements.eventdescription) {
      let description = '';
      
      // Always create a contextual description for better user experience
      if (eventData.text && eventData.text.length > 50) {
        // Check if this is already an enhanced description (birth/death events)
        const rawText = eventData.rawEvent ? eventData.rawEvent.text : titleText;
        if (eventData.text.includes('is born,') || eventData.text.includes('dies at age') || eventData.text.includes('passes away')) {
          // This is already an enhanced birth/death description
          description = eventData.text;
        } else {
          // This is a historical event that needs contextual description
          description = this.createContextualDescription(eventData);
        }
      } else {
        // Fallback to creating contextual description
        description = this.createContextualDescription(eventData);
      }
      
      this.elements.eventdescription.textContent = description;
      this.elements.eventdescription.style.display = 'block';
    }
  }

  createContextualDescription(eventData) {
    const rawText = eventData.rawEvent ? eventData.rawEvent.text : eventData.name || '';
    const year = eventData.year;
    
    // Check if this looks like a birth event (contains died year)
    if (rawText.match(/\(died \d{4}\)/)) {
      const name = this.extractPersonName(rawText);
      const professionMatch = rawText.match(/,\s*([^(]+?)(?:\s*\(|$)/);
      const profession = professionMatch ? professionMatch[1].trim() : 'notable figure';
      return `${name} was born on this day in ${year}, beginning a life that would lead to becoming a renowned ${profession}. This birth would prove significant in the fields of ${this.categorizeProfession(profession)}.`;
    }
    
    // Check if this looks like a death event (contains born year)
    if (rawText.match(/\(born \d{4}\)/) || rawText.match(/born \d{4}/)) {
      const name = this.extractPersonName(rawText);
      const bornMatch = rawText.match(/\(born (\d{4})\)/) || rawText.match(/born (\d{4})/);
      const birthYear = bornMatch ? bornMatch[1] : null;
      const professionMatch = rawText.match(/,\s*([^(]+?)(?:\s*\(|born|$)/) || rawText.match(/,\s*(.+?)\s+born\s+\d{4}/);
      const profession = professionMatch ? professionMatch[1].trim() : 'notable figure';
      
      if (birthYear) {
        const age = year - parseInt(birthYear);
        return `On this day in ${year}, ${name} passed away at the age of ${age}. Throughout their life, they made significant contributions as a ${profession}, leaving a lasting impact in the field of ${this.categorizeProfession(profession)}.`;
      }
    }
    
    // Create contextual description for historical events
    const text = rawText.toLowerCase();
    
    // Aviation/Transportation disasters
    if (text.includes('crash') || text.includes('flight') || text.includes('airline') || text.includes('aircraft') || text.includes('plane')) {
      let description = `This aviation incident occurred on this day in ${year}, highlighting the risks and challenges of modern air transportation. `;
      
      if (text.includes('azerbaijan airlines flight 8243')) {
        description = `Azerbaijan Airlines Flight 8243 was a scheduled international passenger flight that tragically crashed near Aktau, Kazakhstan on this day in ${year}. The incident involved an Embraer 190 aircraft carrying passengers and crew, resulting in significant casualties. This aviation disaster highlighted ongoing safety concerns in the region and demonstrated the complex challenges faced by international aviation, particularly in areas of geopolitical tension. The crash investigation revealed important insights about aviation safety protocols and emergency response procedures.`;
      } else {
        description += `Aviation accidents serve as critical learning opportunities for improving safety standards, aircraft design, and emergency response procedures in the aviation industry.`;
      }
      return description;
    }
    
    // Military/War events with specific context
    if (text.includes('battle') || text.includes('war') || text.includes('army') || text.includes('siege') || text.includes('attack') || text.includes('invasion') || text.includes('military') || text.includes('forces') || text.includes('troops')) {
      
      // Extract specific details from the raw text
      const nameMatch = rawText.match(/Battle of ([^,\n]+)/i) || rawText.match(/Siege of ([^,\n]+)/i) || rawText.match(/Operation ([^,\n]+)/i);
      const locationMatch = rawText.match(/in ([A-Z][a-z]+(?: [A-Z][a-z]+)*)/);
      const commanderMatch = rawText.match(/under ([A-Z][a-z]+ [A-Z][a-z]+)/i) || rawText.match(/led by ([A-Z][a-z]+ [A-Z][a-z]+)/i);
      
      if (text.includes('tugela heights')) {
        return `The Battle of Tugela Heights began in ${year} as British General Redvers Buller launched an assault to relieve besieged Ladysmith during the Second Boer War. This 18-day campaign across difficult terrain would prove pivotal in the British strategy to control Natal Province.`;
      }
      
      if (nameMatch) {
        const battleName = nameMatch[1];
        const location = locationMatch ? ` in ${locationMatch[1]}` : '';
        const commander = commanderMatch ? ` under ${commanderMatch[1]}` : '';
        
        if (year >= 1914 && year <= 1918) {
          return `The ${battleName}${location} was fought in ${year} during World War I${commander}. This engagement was part of the massive conflict that reshaped Europe and marked the end of traditional warfare tactics.`;
        } else if (year >= 1939 && year <= 1945) {
          return `The ${battleName}${location} took place in ${year} during World War II${commander}. This operation contributed to the Allied or Axis strategic objectives in the global conflict.`;
        } else {
          return `The ${battleName}${location} occurred in ${year}${commander}. This military engagement reflected the strategic and tactical considerations of ${this.getHistoricalPeriod(year)}.`;
        }
      }
      
      // Fallback for military events without clear battle names
      if (year >= 2001 && (text.includes('afghanistan') || text.includes('iraq'))) {
        return `Military operations in ${year} were part of the post-9/11 conflicts in the Middle East, involving coalition forces in counterterrorism and nation-building efforts that would define early 21st-century warfare.`;
      }
      
      return `Military action in ${year} involved ${this.extractMilitaryUnits(rawText)} and reflected the strategic priorities and tactical doctrines of the era.`;
    }
    
    // Political events with specific context
    if (text.includes('government') || text.includes('parliament') || text.includes('president') || text.includes('minister') || text.includes('election') || text.includes('treaty') || text.includes('law') || text.includes('congress') || text.includes('senate') || text.includes('prime minister') || text.includes('constitution') || text.includes('vote') || text.includes('legislation')) {
      
      // Extract specific political details
      const treatyMatch = rawText.match(/Treaty of ([^,\n]+)/i);
      const actMatch = rawText.match(/([A-Z][^,\n]*?)\s+Act/i);
      const leaderMatch = rawText.match(/(President|Prime Minister|King|Queen|Chancellor|Emperor)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/i);
      const countryMatch = rawText.match(/\b(United States|Britain|France|Germany|Russia|China|Japan|Italy|Spain|India|Canada|Australia)\b/i);
      
      if (treatyMatch) {
        return `The Treaty of ${treatyMatch[1]} was signed in ${year}, establishing new diplomatic relations and potentially reshaping territorial boundaries or international agreements between the signatory nations.`;
      }
      
      if (actMatch && countryMatch) {
        return `The ${actMatch[1]} Act was enacted in ${countryMatch[1]} in ${year}, representing significant legislative change that would affect citizens' rights, economic policy, or governmental structure.`;
      }
      
      if (leaderMatch) {
        return `${leaderMatch[1]} ${leaderMatch[2]} took significant political action in ${year}, reflecting the leadership decisions and policy directions that would influence national development during this period.`;
      }
      
      if (text.includes('election') && countryMatch) {
        return `Elections held in ${countryMatch[1]} in ${year} determined new leadership and policy direction, reflecting the democratic will of citizens during a period of political change.`;
      }
      
      if (text.includes('independence') || text.includes('constitution')) {
        const nationMatch = rawText.match(/\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s+(?:gains|declares|adopts)/i);
        if (nationMatch) {
          return `${nationMatch[1]} achieved a major constitutional milestone in ${year}, establishing new governmental structures and defining the relationship between citizens and state.`;
        }
      }
      
      // Fallback for political events
      const action = text.includes('signed') ? 'diplomatic agreement' : 
                   text.includes('passed') ? 'legislative action' :
                   text.includes('elected') ? 'electoral decision' : 'political development';
      
      return `A significant ${action} occurred in ${year}, reflecting the political priorities and governmental changes characteristic of this historical period.`;
    }
    
    // Scientific/Technology events with specific context
    if (text.includes('discovery') || text.includes('invention') || text.includes('research') || text.includes('patent') || text.includes('experiment') || text.includes('launched') || text.includes('tested') || text.includes('satellite') || text.includes('spacecraft') || text.includes('laboratory') || text.includes('vaccine') || text.includes('medicine') || text.includes('dna') || text.includes('nuclear') || text.includes('computer') || text.includes('internet')) {
      
      // Extract specific scientific details
      const inventionMatch = rawText.match(/([A-Z][^,\n]*?)\s+(?:invented|discovered|developed|launched)/i);
      const scientistMatch = rawText.match(/(?:by|Dr\.|Professor)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/);
      const institutionMatch = rawText.match(/at\s+([A-Z][^,\n]*?(?:University|Institute|Laboratory|Center))/i);
      
      if (text.includes('satellite') || text.includes('spacecraft')) {
        const missionMatch = rawText.match(/(Sputnik|Apollo|Voyager|Hubble|[A-Z][a-z]+\-\d+)/i);
        if (missionMatch) {
          return `The ${missionMatch[1]} space mission was launched in ${year}, marking a significant milestone in space exploration and advancing our understanding of the cosmos.`;
        }
        return `A significant space mission launched in ${year}, contributing to humanity's exploration of space and advancing satellite technology.`;
      }
      
      if (text.includes('vaccine') || text.includes('medicine')) {
        const diseaseMatch = rawText.match(/(polio|smallpox|measles|tuberculosis|malaria|COVID|influenza|HIV)/i);
        if (diseaseMatch && scientistMatch) {
          return `Dr. ${scientistMatch[1]} developed a breakthrough treatment for ${diseaseMatch[1]} in ${year}, advancing medical science and public health.`;
        }
        return `A medical breakthrough in ${year} advanced treatment options and improved public health outcomes.`;
      }
      
      if (text.includes('computer') || text.includes('internet') || text.includes('software')) {
        if (inventionMatch) {
          return `The ${inventionMatch[1]} was developed in ${year}, representing a major advancement in computing technology that would influence the digital revolution.`;
        }
        return `A computing innovation in ${year} contributed to the development of modern digital technology.`;
      }
      
      if (text.includes('nuclear') || text.includes('atomic')) {
        const testMatch = rawText.match(/(first|successful)\s+(nuclear|atomic)\s+(test|bomb|reactor)/i);
        if (testMatch) {
          return `The ${testMatch[1]} ${testMatch[2]} ${testMatch[3]} occurred in ${year}, marking a pivotal moment in nuclear science and technology.`;
        }
        return `Nuclear technology advanced in ${year} with implications for energy, medicine, and international relations.`;
      }
      
      if (inventionMatch && scientistMatch) {
        return `${scientistMatch[1]} ${inventionMatch[1].toLowerCase()} in ${year}, contributing to scientific knowledge and technological progress.`;
      }
      
      if (inventionMatch) {
        return `The ${inventionMatch[1]} was achieved in ${year}, representing scientific progress in this field.`;
      }
      
      return `Scientific research in ${year} advanced human knowledge and laid groundwork for future technological development.`;
    }
    
    // Religious/Social milestone events
    if (text.includes('ordination') || text.includes('priest') || text.includes('bishop') || text.includes('church') || text.includes('religious') || text.includes('ordained') || text.includes('consecrated')) {
      let description = `This religious milestone occurred on this day in ${year}, marking a significant moment in ecclesiastical history. `;
      
      if (text.includes('raphael morgan') || (text.includes('african-american') && text.includes('orthodox'))) {
        description = `On this day in ${year}, Fr. Raphael Morgan made history by becoming the first African-American Orthodox priest, ordained in Constantinople. This groundbreaking ordination represented a significant milestone in both African-American religious history and the Orthodox Church in America. Morgan's appointment as "Priest-Apostolic" to America and the West Indies established him as a pioneering figure who bridged cultural and religious communities. His ordination challenged racial barriers in religious institutions and paved the way for greater diversity in Orthodox Christianity, making this a landmark moment in both civil rights and religious history.`;
      } else {
        description += `Religious ordinations and appointments often represent important steps in the development of faith communities and can mark significant social and cultural changes within religious institutions.`;
      }
      return description;
    }
    
    // Social/Civil Rights events
    if (text.includes('first african-american') || text.includes('first black') || text.includes('civil rights') || text.includes('segregation') || text.includes('discrimination') || text.includes('milestone')) {
      return `This social milestone occurred on this day in ${year}, representing an important breakthrough in civil rights and social progress. The achievement challenged existing barriers and opened new opportunities for underrepresented communities, contributing to the broader struggle for equality and social justice. Such moments often serve as catalysts for further progress and inspire future generations of activists and leaders.`;
    }
    
    // Cultural/Arts events with specific context
    if (text.includes('opens') || text.includes('premiere') || text.includes('published') || text.includes('exhibition') || text.includes('performance') || text.includes('released') || text.includes('museum') || text.includes('theater') || text.includes('opera') || text.includes('symphony') || text.includes('novel') || text.includes('book') || text.includes('film') || text.includes('movie') || text.includes('painting') || text.includes('sculpture')) {
      let description = `This cultural milestone occurred on this day in ${year}, `;
      
      if (text.includes('museum') || text.includes('exhibition')) {
        description += `enriching public access to art, history, and cultural heritage. Museums and exhibitions serve as guardians of human creativity and knowledge, providing educational opportunities and preserving cultural artifacts for future generations. This cultural institution or exhibition likely featured significant works, historical artifacts, or innovative displays that would educate visitors, promote cultural understanding, and contribute to the intellectual life of the community. The opening would have established a new venue for cultural exchange and artistic appreciation.`;
      } else if (text.includes('theater') || text.includes('opera') || text.includes('performance') || text.includes('premiere')) {
        description += `contributing to the performing arts tradition that brings communities together through shared cultural experiences. Theatrical and musical performances reflect social values, tell important stories, and provide emotional and intellectual engagement for audiences. This premiere or performance likely featured talented artists, innovative staging, or compelling narratives that would influence artistic trends, provide social commentary, or simply offer entertainment and cultural enrichment to the community.`;
      } else if (text.includes('published') || text.includes('novel') || text.includes('book') || text.includes('literature')) {
        description += `contributing to literary culture and the preservation of human thought and creativity in written form. Published works can influence public opinion, preserve historical perspectives, advance philosophical ideas, or provide entertainment and emotional connection for readers. This publication likely represented months or years of creative work, offering new perspectives, stories, or knowledge that would contribute to intellectual discourse and cultural understanding across generations.`;
      } else if (text.includes('film') || text.includes('movie') || text.includes('cinema') || text.includes('released')) {
        description += `advancing the art of cinema and visual storytelling that would influence popular culture and artistic expression. Films can document historical events, explore social issues, provide entertainment, and create shared cultural experiences across diverse audiences. This release likely involved collaborative artistic effort, innovative techniques, or compelling narratives that would influence filmmaking trends, reflect social values, or contribute to the evolution of cinema as an art form.`;
      } else if (text.includes('painting') || text.includes('sculpture') || text.includes('art') || text.includes('gallery')) {
        description += `contributing to the visual arts tradition that captures human creativity, beauty, and expression in tangible form. Visual arts reflect cultural values, document historical periods, and provide aesthetic experiences that transcend language and cultural barriers. This artistic achievement likely demonstrated technical skill, creative vision, or innovative approaches that would influence other artists, contribute to art historical development, and provide lasting cultural value for communities and future generations.`;
      } else {
        description += `enriching the cultural landscape through creative expression that reflects the values, concerns, and aspirations of the time period. Cultural events serve as bridges between communities, preserve human creativity, and provide shared experiences that bind societies together. This cultural milestone likely involved artistic collaboration, creative innovation, or cultural preservation that would contribute to the intellectual and emotional life of the community while potentially influencing broader cultural trends.`;
      }
      
      return description;
    }
    
    // Transportation/Infrastructure with specific context
    if (text.includes('railway') || text.includes('bridge') || text.includes('road') || text.includes('canal') || text.includes('airport') || text.includes('opened') || text.includes('completed') || text.includes('tunnel') || text.includes('highway') || text.includes('port') || text.includes('subway') || text.includes('metro') || text.includes('station')) {
      let description = `This infrastructure milestone was achieved on this day in ${year}, `;
      
      if (text.includes('railway') || text.includes('railroad') || text.includes('train') || text.includes('locomotive')) {
        description += `revolutionizing transportation and commerce through rail connectivity. Railways transform regional economies by enabling efficient movement of people, goods, and resources across long distances. This rail development likely required significant engineering expertise, financial investment, and labor coordination, connecting previously isolated communities and facilitating trade, migration, and cultural exchange. The railway would have reduced transportation costs, travel time, and opened new opportunities for economic development, industrial growth, and social mobility.`;
      } else if (text.includes('bridge') || text.includes('tunnel')) {
        description += `overcoming geographical barriers through innovative engineering and construction techniques. Bridges and tunnels represent human ingenuity in conquering natural obstacles like rivers, valleys, mountains, or bodies of water. This structural achievement likely involved complex engineering challenges, significant financial investment, and skilled construction work. The completed infrastructure would have reduced travel time, connected previously separated communities, facilitated commerce, and demonstrated technological capabilities while potentially becoming an iconic landmark.`;
      } else if (text.includes('airport') || text.includes('aviation') || text.includes('runway')) {
        description += `advancing aviation infrastructure and air connectivity that would transform travel and commerce. Airports serve as crucial hubs for passenger travel, cargo transport, and economic activity, connecting local communities to national and international networks. This aviation facility likely required substantial planning, investment in specialized infrastructure, and coordination with regulatory authorities. The airport would have enhanced regional accessibility, supported business development, tourism, and emergency services while contributing to economic growth.`;
      } else if (text.includes('canal') || text.includes('waterway') || text.includes('navigation')) {
        description += `enhancing water transportation and navigation capabilities that would facilitate commerce and regional connectivity. Canals represent major engineering undertakings that can transform trade routes, reduce shipping costs, and connect different water bodies or regions. This waterway project likely involved extensive excavation, engineering innovation, and long-term planning. The canal would have enabled more efficient transport of goods, reduced transportation costs, and potentially influenced settlement patterns and economic development along its route.`;
      } else if (text.includes('highway') || text.includes('road') || text.includes('interstate')) {
        description += `improving road transportation infrastructure that would enhance mobility, commerce, and regional connectivity. Modern highway systems enable efficient movement of people and goods while supporting economic development and social connectivity. This road project likely involved significant planning, engineering work, and coordination between multiple jurisdictions. The highway would have reduced travel time, improved safety, supported commercial transportation, and facilitated suburban development and economic growth along its corridor.`;
      } else if (text.includes('subway') || text.includes('metro') || text.includes('underground')) {
        description += `advancing urban transportation through rapid transit systems that would reduce congestion and improve city mobility. Subway and metro systems represent sophisticated urban planning solutions that can transform how people move within dense metropolitan areas. This transit project likely required extensive tunneling, electrical systems, and urban planning coordination. The metro system would have reduced surface traffic, provided reliable public transportation, supported urban development, and improved quality of life for city residents.`;
      } else {
        description += `enhancing regional infrastructure and connectivity through significant engineering and construction achievements. Infrastructure projects represent investments in long-term economic development, social connectivity, and quality of life improvements. This development likely required careful planning, substantial financial resources, and coordination between government agencies, engineers, and construction teams. The completed infrastructure would have improved transportation efficiency, supported economic growth, and provided lasting benefits to the communities it serves.`;
      }
      
      return description;
    }
    
    // Natural disasters/Weather with specific context
    if (text.includes('earthquake') || text.includes('flood') || text.includes('hurricane') || text.includes('storm') || text.includes('eruption') || text.includes('disaster') || text.includes('tsunami') || text.includes('wildfire') || text.includes('tornado')) {
      let description = `This natural disaster occurred on this day in ${year}, `;
      
      // Provide specific context based on disaster type and location
      if (text.includes('earthquake')) {
        description += `demonstrating the devastating power of seismic activity. Earthquakes often result in significant casualties, infrastructure damage, and long-term economic impacts on affected communities. This event likely led to improvements in building codes, emergency response procedures, and seismic monitoring systems. The disaster serves as a reminder of the importance of earthquake preparedness and resilient construction in seismically active regions.`;
      } else if (text.includes('hurricane') || text.includes('storm')) {
        description += `showcasing the destructive force of severe weather systems. Hurricanes and major storms can cause widespread damage through high winds, storm surge, and flooding, often affecting large geographic areas. This weather event likely prompted improvements in meteorological forecasting, evacuation procedures, and disaster preparedness protocols. The storm's impact demonstrates the vulnerability of coastal and low-lying communities to extreme weather.`;
      } else if (text.includes('flood')) {
        description += `highlighting the destructive potential of water when natural or man-made flood control systems are overwhelmed. Flooding can devastate communities, destroy crops, displace populations, and cause long-lasting economic hardship. This event likely influenced future flood management strategies, urban planning decisions, and emergency response capabilities in the affected region.`;
      } else if (text.includes('eruption')) {
        description += `displaying the raw power of volcanic forces and their far-reaching effects on human settlements and the environment. Volcanic eruptions can cause immediate destruction through lava flows, ash fall, and pyroclastic flows, while also affecting global climate patterns. This eruption likely contributed to scientific understanding of volcanic processes and influenced evacuation and monitoring procedures for volcanic regions.`;
      } else if (text.includes('wildfire')) {
        description += `demonstrating how fire can rapidly spread across landscapes, threatening communities and ecosystems. Wildfires often reflect the intersection of climate conditions, land management practices, and human activity. This fire event likely influenced firefighting techniques, forest management policies, and community wildfire protection measures.`;
      } else {
        description += `showing the unpredictable and often devastating impact of natural forces on human communities. Natural disasters serve as powerful reminders of environmental risks and the importance of disaster preparedness, resilient infrastructure, and effective emergency response systems.`;
      }
      
      description += ` The lessons learned from this disaster contributed to improved understanding of natural hazards and better preparation for future events.`;
      return description;
    }
    
    // Educational/Academic events with specific context
    if (text.includes('university') || text.includes('school') || text.includes('education') || text.includes('founded') || text.includes('established') || text.includes('academy') || text.includes('college') || text.includes('institute') || text.includes('graduation') || text.includes('degree') || text.includes('research') || text.includes('scholarship')) {
      let description = `This educational milestone occurred on this day in ${year}, `;
      
      if (text.includes('university') || text.includes('college') || text.includes('founded') || text.includes('established')) {
        description += `establishing an institution of higher learning that would serve communities for generations. Universities and colleges represent centers of intellectual development, research advancement, and professional preparation that contribute to societal progress and individual opportunity. This educational founding likely involved visionary planning, community support, financial investment, and academic leadership. The institution would have provided degree programs, research opportunities, cultural enrichment, and economic benefits to the region while training future leaders, professionals, and innovators.`;
      } else if (text.includes('school') || text.includes('academy') || text.includes('elementary') || text.includes('secondary')) {
        description += `advancing primary or secondary education that would shape young minds and prepare future generations for civic participation and professional success. Schools serve as foundational institutions that provide literacy, numeracy, critical thinking skills, and social development opportunities. This educational development likely reflected community commitment to youth development, educational access, and social progress. The school would have served local families, reduced educational barriers, and contributed to community development and social mobility.`;
      } else if (text.includes('graduation') || text.includes('degree') || text.includes('commencement')) {
        description += `celebrating academic achievement and the completion of educational programs that prepare individuals for professional careers and civic leadership. Graduation ceremonies mark important transitions from student to professional life, representing years of learning, personal growth, and skill development. This academic milestone likely recognized student dedication, faculty guidance, and institutional excellence while celebrating the achievement of educational goals and the preparation for future contributions to society.`;
      } else if (text.includes('research') || text.includes('institute') || text.includes('laboratory')) {
        description += `advancing scholarly research and scientific inquiry that would contribute to human knowledge and technological progress. Research institutions serve as centers of innovation, discovery, and intellectual advancement that benefit society through new knowledge, technologies, and solutions to complex problems. This research milestone likely involved collaborative investigation, rigorous methodology, and peer review processes. The research would have contributed to academic understanding, practical applications, and future scientific development.`;
      } else {
        description += `contributing to educational advancement and intellectual development that would benefit individuals and communities through expanded learning opportunities. Educational initiatives represent investments in human potential, social progress, and economic development through knowledge creation, skill development, and cultural preservation. This educational event likely involved dedicated educators, supportive communities, and commitment to learning excellence that would influence student achievement, community development, and social advancement for years to come.`;
      }
      
      return description;
    }
    
    // Economic/Business events with specific context
    if (text.includes('company') || text.includes('corporation') || text.includes('business') || text.includes('industry') || text.includes('founded') || text.includes('merger') || text.includes('stock') || text.includes('bank') || text.includes('factory') || text.includes('manufacturing') || text.includes('trade') || text.includes('commerce') || text.includes('market') || text.includes('economic')) {
      let description = `This economic milestone occurred on this day in ${year}, `;
      
      if (text.includes('founded') || text.includes('established') || text.includes('company') || text.includes('corporation')) {
        description += `establishing a business enterprise that would contribute to economic development, employment opportunities, and innovation. Company formations represent entrepreneurial vision, risk-taking, and investment in productive activities that can transform industries and communities. This business founding likely involved careful planning, financial investment, market analysis, and regulatory compliance. The company would have created jobs, generated tax revenue, provided goods or services, and potentially influenced industry standards, technological development, and regional economic growth.`;
      } else if (text.includes('merger') || text.includes('acquisition') || text.includes('consolidation')) {
        description += `representing corporate restructuring that would reshape industry dynamics, market competition, and business operations. Mergers and acquisitions can create economies of scale, eliminate redundancy, and consolidate resources while potentially affecting employment, market competition, and consumer choice. This corporate combination likely involved complex negotiations, regulatory review, and strategic planning. The merger would have influenced market share, operational efficiency, and competitive positioning while potentially affecting suppliers, customers, and shareholders.`;
      } else if (text.includes('stock') || text.includes('ipo') || text.includes('shares') || text.includes('market')) {
        description += `involving capital markets and investment activities that would influence business financing, economic growth, and wealth creation. Stock market activities facilitate business expansion, provide investment opportunities, and reflect economic confidence and market sentiment. This financial milestone likely involved investment banking, regulatory compliance, and market analysis. The stock activity would have enabled business growth, provided investor returns, and potentially influenced market trends, economic indicators, and business development strategies.`;
      } else if (text.includes('bank') || text.includes('banking') || text.includes('financial')) {
        description += `advancing financial services and banking capabilities that would support economic development, business growth, and individual financial needs. Banks serve as crucial intermediaries in economic systems, facilitating savings, lending, payment processing, and capital allocation. This banking development likely involved regulatory approval, capital requirements, and community needs assessment. The bank would have provided essential financial services, supported business development, facilitated economic transactions, and contributed to regional economic stability and growth.`;
      } else if (text.includes('factory') || text.includes('manufacturing') || text.includes('industrial') || text.includes('production')) {
        description += `establishing manufacturing capabilities that would create employment opportunities, produce goods, and contribute to industrial development. Factories represent concentrations of production technology, worker skills, and capital investment that can transform local economies and supply chains. This industrial development likely involved significant capital investment, workforce training, and supply chain establishment. The factory would have created jobs, produced goods for local or export markets, and potentially influenced urban development, transportation infrastructure, and regional economic specialization.`;
      } else {
        description += `contributing to economic development through business activities that would influence employment, innovation, and regional prosperity. Economic developments reflect entrepreneurial initiative, market opportunities, and investment in productive activities that create value for communities and stakeholders. This business milestone likely involved strategic planning, financial resources, and market analysis. The economic activity would have contributed to job creation, tax revenue, technological advancement, and community development while potentially influencing industry trends and regional economic growth.`;
      }
      
      return description;
    }
    
    // Legal/Judicial events with specific context
    if (text.includes('court') || text.includes('judge') || text.includes('ruling') || text.includes('verdict') || text.includes('legal') || text.includes('constitutional') || text.includes('supreme court') || text.includes('lawsuit') || text.includes('trial') || text.includes('justice') || text.includes('civil rights') || text.includes('appeal') || text.includes('sentence')) {
      let description = `This legal milestone occurred on this day in ${year}, `;
      
      if (text.includes('supreme court') || text.includes('constitutional') || text.includes('landmark')) {
        description += `establishing important constitutional precedent that would influence legal interpretation and civil rights for generations. Supreme Court decisions and constitutional rulings shape the fundamental legal framework that governs society, defining the relationship between government and citizens while protecting individual rights and liberties. This judicial decision likely involved complex legal arguments, extensive deliberation, and careful consideration of constitutional principles. The ruling would have influenced lower court decisions, legislative actions, and social policy while potentially affecting civil liberties, governmental power, and individual rights.`;
      } else if (text.includes('civil rights') || text.includes('discrimination') || text.includes('equality') || text.includes('segregation')) {
        description += `advancing civil rights and social justice through legal proceedings that would challenge discrimination and promote equality. Civil rights cases serve as crucial mechanisms for protecting individual liberties, challenging unjust laws, and promoting social progress through legal channels. This legal action likely involved courageous plaintiffs, dedicated attorneys, and community support in confronting systemic injustice. The case would have influenced anti-discrimination law, social attitudes, and institutional practices while potentially inspiring further civil rights activism and legal reform.`;
      } else if (text.includes('trial') || text.includes('verdict') || text.includes('jury') || text.includes('criminal')) {
        description += `demonstrating the judicial process and the rule of law through criminal or civil proceedings that would determine guilt, innocence, or legal responsibility. Trials represent the cornerstone of justice systems, providing fair hearings, due process protections, and impartial determination of facts and legal liability. This judicial proceeding likely involved careful evidence presentation, legal argument, and jury deliberation. The verdict would have provided justice for victims, accountability for wrongdoing, and precedent for similar cases while reinforcing public confidence in legal institutions.`;
      } else if (text.includes('appeal') || text.includes('appellate') || text.includes('overturned') || text.includes('reversed')) {
        description += `involving appellate review that would examine legal procedures, evidence evaluation, and judicial decision-making to ensure fair and accurate legal outcomes. Appeals provide essential oversight of lower court decisions, protecting against legal errors and ensuring consistent application of legal principles. This appellate action likely involved detailed legal briefs, oral arguments, and careful review of trial records. The appeal decision would have influenced legal precedent, trial procedures, and judicial standards while potentially affecting the original parties and similar future cases.`;
      } else if (text.includes('judge') || text.includes('appointment') || text.includes('nomination')) {
        description += `involving judicial appointment or nomination that would influence legal interpretation, court operations, and justice administration for years to come. Judicial appointments represent crucial decisions that affect legal precedent, constitutional interpretation, and court efficiency through the selection of qualified legal professionals. This judicial selection likely involved political consideration, legal qualification assessment, and community input. The appointment would have influenced court decisions, legal precedent, and judicial philosophy while potentially affecting case outcomes and legal development in the jurisdiction.`;
      } else {
        description += `contributing to legal development and judicial administration through proceedings that would influence legal precedent, individual rights, and societal justice. Legal events serve as mechanisms for resolving disputes, enforcing laws, and adapting legal systems to changing social needs and circumstances. This legal milestone likely involved careful legal analysis, procedural compliance, and consideration of competing interests. The legal action would have contributed to jurisprudential development, conflict resolution, and rule of law maintenance while potentially influencing future legal decisions and social policy.`;
      }
      
      return description;
    }
    
    // Sports/Athletics events
    if (text.includes('olympics') || text.includes('championship') || text.includes('world cup') || text.includes('tournament') || text.includes('record') || text.includes('athlete') || text.includes('sport') || text.includes('game') || text.includes('match') || text.includes('competition')) {
      return `This athletic milestone occurred on this day in ${year}, demonstrating human physical achievement, competitive spirit, and the unifying power of sports. Athletic competitions bring communities together, inspire individual excellence, and showcase human potential through physical skill, training dedication, and competitive determination. This sporting event likely involved extensive preparation, skilled athletes, and enthusiastic spectators. The competition would have provided entertainment, community pride, and inspiration while potentially setting new performance standards, breaking records, or contributing to sporting tradition and athletic development.`;
    }

    // Environmental/Conservation events  
    if (text.includes('environment') || text.includes('conservation') || text.includes('wildlife') || text.includes('pollution') || text.includes('climate') || text.includes('forest') || text.includes('park') || text.includes('preserve') || text.includes('species') || text.includes('habitat')) {
      return `This environmental milestone occurred on this day in ${year}, reflecting growing awareness of conservation needs, ecological protection, and sustainable resource management. Environmental initiatives represent recognition of humanity's relationship with nature and responsibility for preserving natural resources for future generations. This conservation event likely involved scientific research, community activism, governmental policy, or institutional commitment to environmental protection. The initiative would have contributed to habitat preservation, species protection, pollution reduction, or environmental education while potentially influencing policy development and public environmental awareness.`;
    }

    // Media/Communication events
    if (text.includes('newspaper') || text.includes('radio') || text.includes('television') || text.includes('broadcast') || text.includes('media') || text.includes('press') || text.includes('journalism') || text.includes('magazine') || text.includes('publication') || text.includes('communication')) {
      return `This media milestone occurred on this day in ${year}, advancing communication technology, information dissemination, and public discourse through new channels of mass communication. Media developments transform how communities receive information, form opinions, and participate in democratic processes. This communication event likely involved technological innovation, editorial leadership, or regulatory changes that would influence news coverage, entertainment programming, and public information access. The media development would have affected political discourse, cultural exchange, and community connectivity while potentially shaping public opinion and social awareness.`;
    }

    // Health/Medical events (beyond scientific)
    if (text.includes('hospital') || text.includes('doctor') || text.includes('patient') || text.includes('health') || text.includes('clinic') || text.includes('nursing') || text.includes('medical care') || text.includes('public health') || text.includes('epidemic') || text.includes('disease')) {
      return `This health milestone occurred on this day in ${year}, advancing medical care, public health protection, and community wellness through improved healthcare delivery, disease prevention, or medical innovation. Healthcare developments directly impact quality of life, mortality rates, and community wellbeing through better treatment options, preventive care, and health education. This medical event likely involved healthcare professionals, community health initiatives, or institutional development that would improve patient care, reduce disease burden, and enhance health outcomes. The healthcare advancement would have benefited individual patients and community health while potentially influencing medical practice standards and public health policy.`;
    }

    // Default for other historical events - still more specific than before
    const eventType = rawText.length > 0 ? 'documented historical event' : 'significant occurrence';
    const century = Math.floor(year/100) + 1;
    let centuryContext = '';
    
    if (century === 21) {
      centuryContext = 'reflecting the complex global interconnectedness, technological advancement, and rapid social change characteristic of the modern era';
    } else if (century === 20) {
      centuryContext = 'representing the transformative changes, technological progress, and social upheavals that defined the twentieth century';
    } else if (century === 19) {
      centuryContext = 'reflecting the industrial development, social reform movements, and cultural changes of the nineteenth century';
    } else {
      centuryContext = 'representing the historical developments and social changes of its time period';
    }
    
    return `This ${eventType} took place on this day in ${year}, ${centuryContext}. Historical events serve as markers of human experience, documenting the decisions, actions, and circumstances that shaped communities and influenced subsequent developments. While the full historical significance may become clearer through continued research and historical analysis, this occurrence represents part of the broader narrative of human activity, social development, and historical change that continues to influence our understanding of the past and its connection to contemporary life.`;
  }

  getHistoricalPeriod(year) {
    if (year >= 2000) return 'the modern digital age';
    if (year >= 1950) return 'the post-war era';
    if (year >= 1900) return 'the early modern period';
    if (year >= 1800) return 'the industrial age';
    if (year >= 1500) return 'the early modern era';
    return 'earlier historical periods';
  }

  extractMilitaryUnits(text) {
    const unitMatch = text.match(/(\d+(?:st|nd|rd|th)?\s+(?:Army|Corps|Division|Regiment|Battalion|Brigade))/i);
    if (unitMatch) return unitMatch[1];
    
    const forceMatch = text.match(/(Allied|Axis|British|American|German|French|Russian|Soviet|Confederate|Union)\s+forces/i);
    if (forceMatch) return forceMatch[0];
    
    return 'military forces';
  }
}

/* ============================
   Application Entry Point
   ============================ */
document.addEventListener('DOMContentLoaded', () => {
  window.historyApp = new HistoryApp();
});

if(typeof window!=='undefined'){
  window.HistoryApp = HistoryApp;
  window.CONFIG = CONFIG;
}
