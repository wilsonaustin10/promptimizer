// Privacy-Conscious Analytics Client for Chrome Extension
// Minimal data collection with user consent and opt-out controls

class AnalyticsClient {
  constructor(options = {}) {
    this.apiEndpoint = options.apiEndpoint || 'https://your-analytics-api.netlify.app/.netlify/functions/analytics';
    this.userId = null;
    this.isEnabled = true;
    this.isInitialized = false;
    this.extensionVersion = chrome.runtime.getManifest().version;
    this.queuedEvents = [];
    
    // Initialize on construction
    this.init();
  }
  
  // Generate browser fingerprint for anonymous user ID
  generateFingerprint() {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    ctx.textBaseline = 'top';
    ctx.font = '14px Arial';
    ctx.fillText('Analytics fingerprint', 2, 2);
    
    const fingerprint = [
      navigator.userAgent,
      navigator.language,
      screen.width + 'x' + screen.height,
      screen.colorDepth,
      new Date().getTimezoneOffset(),
      !!window.sessionStorage,
      !!window.localStorage,
      canvas.toDataURL()
    ].join('|');
    
    return btoa(fingerprint).substring(0, 50);
  }
  
  // Get browser type
  getBrowserType() {
    const userAgent = navigator.userAgent.toLowerCase();
    if (userAgent.includes('chrome')) return 'chrome';
    if (userAgent.includes('firefox')) return 'firefox';
    if (userAgent.includes('safari')) return 'safari';
    if (userAgent.includes('edge')) return 'edge';
    return 'unknown';
  }
  
  // Initialize analytics client
  async init() {
    try {
      // Check if analytics is disabled
      const settings = await this.getStorageData(['analytics_enabled', 'user_id', 'install_recorded']);
      
      this.isEnabled = settings.analytics_enabled !== false; // Default to enabled
      
      if (!this.isEnabled) {
        console.log('Analytics disabled by user');
        return;
      }
      
      // Generate or retrieve anonymous user ID
      if (settings.user_id) {
        this.userId = settings.user_id;
      } else {
        await this.recordInstall();
      }
      
      this.isInitialized = true;
      
      // Process any queued events
      this.processQueuedEvents();
      
      // Record daily active user
      await this.recordDailyActive();
      
    } catch (error) {
      console.error('Analytics initialization failed:', error);
    }
  }
  
  // Helper to get data from chrome.storage
  getStorageData(keys) {
    return new Promise((resolve) => {
      chrome.storage.local.get(keys, resolve);
    });
  }
  
  // Helper to set data in chrome.storage
  setStorageData(data) {
    return new Promise((resolve) => {
      chrome.storage.local.set(data, resolve);
    });
  }
  
  // Record install event and get anonymous user ID
  async recordInstall() {
    try {
      const fingerprint = this.generateFingerprint();
      const browser = this.getBrowserType();
      
      const response = await fetch(this.apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'install',
          data: {
            fingerprint,
            version: this.extensionVersion,
            browser
          }
        })
      });
      
      const result = await response.json();
      
      if (result.success && result.user_id) {
        this.userId = result.user_id;
        await this.setStorageData({
          user_id: this.userId,
          install_recorded: true,
          install_date: new Date().toISOString()
        });
        
        console.log('Install recorded successfully');
      } else {
        throw new Error(result.error || 'Install recording failed');
      }
      
    } catch (error) {
      console.error('Failed to record install:', error);
      // Generate fallback user ID
      this.userId = 'fallback_' + Date.now().toString(36) + Math.random().toString(36).substr(2);
      await this.setStorageData({ user_id: this.userId });
    }
  }
  
  // Record daily active user (throttled)
  async recordDailyActive() {
    try {
      const today = new Date().toDateString();
      const settings = await this.getStorageData(['last_active_date']);
      
      if (settings.last_active_date === today) {
        return; // Already recorded today
      }
      
      await this.trackEvent('daily_active', {});
      await this.setStorageData({ last_active_date: today });
      
    } catch (error) {
      console.error('Failed to record daily active:', error);
    }
  }
  
  // Track custom events
  async trackEvent(eventType, eventData = {}) {
    if (!this.isEnabled) {
      return;
    }
    
    const event = {
      eventType,
      eventData,
      timestamp: Date.now()
    };
    
    if (!this.isInitialized || !this.userId) {
      // Queue event until initialized
      this.queuedEvents.push(event);
      return;
    }
    
    try {
      const response = await fetch(this.apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'event',
          data: {
            user_id: this.userId,
            event_type: eventType,
            event_data: eventData
          }
        })
      });
      
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Event tracking failed');
      }
      
    } catch (error) {
      console.error('Failed to track event:', error);
      
      // Retry logic for important events
      if (['optimization_completed', 'error_occurred'].includes(eventType)) {
        setTimeout(() => this.trackEvent(eventType, eventData), 5000);
      }
    }
  }
  
  // Process queued events after initialization
  async processQueuedEvents() {
    while (this.queuedEvents.length > 0) {
      const event = this.queuedEvents.shift();
      await this.trackEvent(event.eventType, event.eventData);
    }
  }
  
  // Record email (optional, with user consent)
  async recordEmail(email) {
    if (!this.isEnabled || !email) {
      return false;
    }
    
    try {
      const response = await fetch(this.apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'email',
          data: {
            email: email.trim().toLowerCase(),
            user_id: this.userId
          }
        })
      });
      
      const result = await response.json();
      
      if (result.success) {
        await this.setStorageData({ email_provided: true });
        return true;
      } else {
        throw new Error(result.error || 'Email recording failed');
      }
      
    } catch (error) {
      console.error('Failed to record email:', error);
      return false;
    }
  }
  
  // Enable/disable analytics
  async setEnabled(enabled) {
    this.isEnabled = enabled;
    await this.setStorageData({ analytics_enabled: enabled });
    
    if (enabled && !this.isInitialized) {
      await this.init();
    }
    
    // Track opt-out/opt-in
    if (this.isInitialized) {
      await this.trackEvent(enabled ? 'analytics_enabled' : 'analytics_disabled', {});
    }
  }
  
  // Get analytics status
  async getStatus() {
    const settings = await this.getStorageData([
      'analytics_enabled', 
      'user_id', 
      'install_date',
      'email_provided'
    ]);
    
    return {
      enabled: this.isEnabled,
      user_id: this.userId,
      install_date: settings.install_date,
      email_provided: settings.email_provided || false
    };
  }
  
  // Clear all analytics data
  async clearData() {
    await this.setStorageData({
      analytics_enabled: false,
      user_id: null,
      install_recorded: false,
      install_date: null,
      last_active_date: null,
      email_provided: false
    });
    
    this.userId = null;
    this.isEnabled = false;
    this.isInitialized = false;
    this.queuedEvents = [];
  }
}

// Pre-defined event types for consistency
const ANALYTICS_EVENTS = {
  // Core functionality
  OPTIMIZATION_STARTED: 'optimization_started',
  OPTIMIZATION_COMPLETED: 'optimization_completed',
  OPTIMIZATION_FAILED: 'optimization_failed',
  COPY_TO_CLIPBOARD: 'copy_to_clipboard',
  
  // User interactions
  MODEL_CHANGED: 'model_changed',
  QUALITY_CHANGED: 'quality_changed',
  SETTINGS_OPENED: 'settings_opened',
  CONTEXT_MENU_USED: 'context_menu_used',
  
  // Features
  STREAMING_USED: 'streaming_used',
  CACHE_HIT: 'cache_hit',
  API_KEY_CONFIGURED: 'api_key_configured',
  
  // Errors
  API_ERROR: 'api_error',
  VALIDATION_ERROR: 'validation_error',
  
  // Privacy
  EMAIL_PROVIDED: 'email_provided',
  ANALYTICS_DISABLED: 'analytics_disabled',
  ANALYTICS_ENABLED: 'analytics_enabled'
};

// Create singleton instance
const analytics = new AnalyticsClient();

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { AnalyticsClient, ANALYTICS_EVENTS, analytics };
} else {
  // Browser environment
  window.analytics = analytics;
  window.ANALYTICS_EVENTS = ANALYTICS_EVENTS;
}