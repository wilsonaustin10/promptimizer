// Privacy Controls for Analytics
// Centralized privacy management and data clearing utilities

class PrivacyManager {
  constructor() {
    this.analytics = null
    this.init()
  }
  
  async init() {
    try {
      const analyticsModule = await import('./analytics.js')
      this.analytics = analyticsModule.analytics
    } catch (error) {
      console.warn('Analytics module not available for privacy controls')
    }
  }
  
  // Check if analytics is currently enabled
  async isAnalyticsEnabled() {
    if (!this.analytics) return false
    
    try {
      const status = await this.analytics.getStatus()
      return status.enabled
    } catch (error) {
      console.error('Failed to check analytics status:', error)
      return false
    }
  }
  
  // Enable or disable analytics
  async setAnalyticsEnabled(enabled) {
    if (!this.analytics) {
      console.warn('Analytics not available')
      return false
    }
    
    try {
      await this.analytics.setEnabled(enabled)
      return true
    } catch (error) {
      console.error('Failed to set analytics status:', error)
      return false
    }
  }
  
  // Get analytics status and data summary
  async getDataSummary() {
    if (!this.analytics) {
      return {
        analytics_enabled: false,
        user_id: null,
        install_date: null,
        email_provided: false,
        data_types: []
      }
    }
    
    try {
      const status = await this.analytics.getStatus()
      
      const dataTypes = []
      if (status.enabled) {
        dataTypes.push('Anonymous usage patterns')
        dataTypes.push('Feature interaction counts')
        dataTypes.push('Performance metrics')
        dataTypes.push('Error logs (anonymized)')
        
        if (status.email_provided) {
          dataTypes.push('Email address (encrypted)')
        }
      }
      
      return {
        analytics_enabled: status.enabled,
        user_id: status.user_id,
        install_date: status.install_date,
        email_provided: status.email_provided,
        data_types: dataTypes
      }
    } catch (error) {
      console.error('Failed to get data summary:', error)
      return {
        analytics_enabled: false,
        user_id: null,
        install_date: null,
        email_provided: false,
        data_types: [],
        error: error.message
      }
    }
  }
  
  // Clear all analytics data
  async clearAllData() {
    if (!this.analytics) {
      console.warn('Analytics not available')
      return false
    }
    
    try {
      await this.analytics.clearData()
      
      // Also clear any related storage
      await this.clearExtensionData()
      
      return true
    } catch (error) {
      console.error('Failed to clear analytics data:', error)
      return false
    }
  }
  
  // Clear extension-specific data (cache, preferences, etc.)
  async clearExtensionData() {
    try {
      // Clear local storage data
      await new Promise((resolve) => {
        chrome.storage.local.clear(() => {
          resolve()
        })
      })
      
      // Clear sync storage data (keep API key if user wants)
      const keepApiKey = await this.confirmKeepApiKey()
      
      if (keepApiKey) {
        // Get current API key before clearing
        const syncData = await new Promise((resolve) => {
          chrome.storage.sync.get(['encryptedApiKey'], resolve)
        })
        
        // Clear all sync data
        await new Promise((resolve) => {
          chrome.storage.sync.clear(() => {
            resolve()
          })
        })
        
        // Restore API key if it existed
        if (syncData.encryptedApiKey) {
          await new Promise((resolve) => {
            chrome.storage.sync.set({ encryptedApiKey: syncData.encryptedApiKey }, resolve)
          })
        }
      } else {
        // Clear everything including API key
        await new Promise((resolve) => {
          chrome.storage.sync.clear(() => {
            resolve()
          })
        })
      }
      
      return true
    } catch (error) {
      console.error('Failed to clear extension data:', error)
      return false
    }
  }
  
  // Ask user if they want to keep their API key when clearing data
  async confirmKeepApiKey() {
    return new Promise((resolve) => {
      const keep = confirm(
        'Do you want to keep your API key saved?\n\n' +
        'Choose "OK" to keep your API key\n' +
        'Choose "Cancel" to remove everything including your API key'
      )
      resolve(keep)
    })
  }
  
  // Export user data (GDPR compliance)
  async exportUserData() {
    try {
      const summary = await this.getDataSummary()
      
      // Get extension settings
      const localStorage = await new Promise((resolve) => {
        chrome.storage.local.get(null, resolve)
      })
      
      const syncStorage = await new Promise((resolve) => {
        chrome.storage.sync.get(null, resolve)
      })
      
      // Remove sensitive data from export
      const sanitizedSyncStorage = { ...syncStorage }
      delete sanitizedSyncStorage.encryptedApiKey // Don't export API key
      delete sanitizedSyncStorage.encryptionKey // Don't export encryption key
      
      const exportData = {
        export_date: new Date().toISOString(),
        extension_version: chrome.runtime.getManifest().version,
        analytics_summary: summary,
        extension_settings: {
          local_storage: localStorage,
          sync_storage: sanitizedSyncStorage
        },
        privacy_notice: 'This export contains your extension settings and analytics summary. ' +
                       'API keys and encryption keys are excluded for security. ' +
                       'User IDs are anonymous and cannot be linked to personal identity.'
      }
      
      return exportData
    } catch (error) {
      console.error('Failed to export user data:', error)
      throw error
    }
  }
  
  // Download exported data as JSON file
  async downloadUserData() {
    try {
      const data = await this.exportUserData()
      const blob = new Blob([JSON.stringify(data, null, 2)], { 
        type: 'application/json' 
      })
      
      const url = URL.createObjectURL(blob)
      const filename = `promptimizer-data-export-${new Date().toISOString().split('T')[0]}.json`
      
      // Create download link
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      
      URL.revokeObjectURL(url)
      
      return true
    } catch (error) {
      console.error('Failed to download user data:', error)
      return false
    }
  }
  
  // Show privacy information
  getPrivacyInfo() {
    return {
      data_collection: [
        'Anonymous user IDs (generated from browser fingerprint)',
        'Basic usage patterns (which features are used)',
        'Performance metrics (optimization time, success rates)',
        'Error logs (anonymized, no personal data)',
        'Email addresses (optional, encrypted, for updates only)'
      ],
      data_not_collected: [
        'Actual prompt content or text',
        'Personal identifying information',
        'Browsing history or websites visited',
        'API keys or sensitive credentials',
        'Location or device-specific information'
      ],
      data_retention: [
        'Usage analytics: 90 days',
        'Error logs: 30 days',
        'Email addresses: Until unsubscribed',
        'Anonymous metrics: Aggregated permanently'
      ],
      your_rights: [
        'Opt-out of analytics anytime',
        'Clear all collected data',
        'Export your data (GDPR)',
        'Unsubscribe from emails',
        'View what data is collected'
      ],
      contact: 'For privacy concerns, please open an issue on GitHub'
    }
  }
}

// Create singleton instance
const privacyManager = new PrivacyManager()

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { PrivacyManager, privacyManager }
} else {
  // Browser environment
  window.privacyManager = privacyManager
}