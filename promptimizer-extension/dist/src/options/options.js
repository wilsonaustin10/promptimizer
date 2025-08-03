// Inline crypto functions for options page (self-contained)
async function generateKey() {
  return await crypto.subtle.generateKey(
    { name: 'AES-GCM', length: 256 },
    true,
    ['encrypt', 'decrypt']
  );
}

async function getOrCreateKey() {
  return new Promise((resolve) => {
    chrome.storage.local.get(['encryptionKey'], async (result) => {
      if (result.encryptionKey) {
        const keyData = new Uint8Array(result.encryptionKey);
        const key = await crypto.subtle.importKey(
          'raw', keyData, { name: 'AES-GCM' }, true, ['encrypt', 'decrypt']
        );
        resolve(key);
      } else {
        const key = await generateKey();
        const exportedKey = await crypto.subtle.exportKey('raw', key);
        const keyArray = Array.from(new Uint8Array(exportedKey));
        chrome.storage.local.set({ encryptionKey: keyArray }, () => {
          resolve(key);
        });
      }
    });
  });
}

async function encryptData(plaintext) {
  if (!plaintext || plaintext.trim() === '') return null;
  try {
    const key = await getOrCreateKey();
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const encodedText = new TextEncoder().encode(plaintext);
    const encrypted = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, encodedText);
    const encryptedArray = new Uint8Array(encrypted);
    const combined = new Uint8Array(iv.length + encryptedArray.length);
    combined.set(iv);
    combined.set(encryptedArray, iv.length);
    return Array.from(combined);
  } catch (error) {
    console.error('Encryption failed:', error);
    throw new Error('Failed to encrypt sensitive data');
  }
}

async function decryptData(encryptedData) {
  if (!encryptedData) return '';
  try {
    const key = await getOrCreateKey();
    const combined = new Uint8Array(encryptedData);
    const iv = combined.slice(0, 12);
    const encrypted = combined.slice(12);
    const decrypted = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, encrypted);
    return new TextDecoder().decode(decrypted);
  } catch (error) {
    console.error('Decryption failed:', error);
    return '';
  }
}

async function setSecureApiKey(apiKey) {
  try {
    const encrypted = await encryptData(apiKey);
    return new Promise((resolve, reject) => {
      chrome.storage.sync.set({ encryptedApiKey: encrypted }, () => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
        } else {
          resolve();
        }
      });
    });
  } catch (error) {
    throw new Error('Failed to securely store API key');
  }
}

async function getSecureApiKey() {
  try {
    return new Promise((resolve) => {
      chrome.storage.sync.get(['encryptedApiKey'], async (result) => {
        if (result.encryptedApiKey) {
          try {
            const decrypted = await decryptData(result.encryptedApiKey);
            resolve(decrypted);
          } catch (error) {
            console.error('Failed to decrypt API key:', error);
            resolve('');
          }
        } else {
          resolve('');
        }
      });
    });
  } catch (error) {
    console.error('Failed to retrieve API key:', error);
    return '';
  }
}

async function clearSecureStorage() {
  return new Promise((resolve) => {
    chrome.storage.sync.remove(['encryptedApiKey'], () => {
      chrome.storage.local.remove(['encryptionKey'], () => {
        resolve();
      });
    });
  });
}

// Import analytics functionality
import('../utils/analytics.js').then(module => {
  window.analytics = module.analytics;
  window.ANALYTICS_EVENTS = module.ANALYTICS_EVENTS;
}).catch(() => {
  // Fallback if module loading fails
  console.warn('Analytics module not available');
});

// Import privacy controls
import('../utils/privacy-controls.js').then(module => {
  window.privacyManager = module.privacyManager;
}).catch(() => {
  console.warn('Privacy controls not available');
});

document.addEventListener('DOMContentLoaded', async () => {
  const apiKeyInput = document.getElementById('apiKey')
  const defaultModelSelect = document.getElementById('defaultModel')
  const autoDetectCheckbox = document.getElementById('autoDetectIntent')
  const showTipsCheckbox = document.getElementById('showTips')
  const saveButton = document.getElementById('saveButton')
  const status = document.getElementById('status')
  
  // Analytics controls
  const analyticsEnabledCheckbox = document.getElementById('analyticsEnabled')
  const userEmailInput = document.getElementById('userEmail')
  const analyticsStatusText = document.getElementById('analyticsStatusText')
  const learnMoreLink = document.getElementById('learnMoreAnalytics')
  
  // Privacy controls
  const exportDataButton = document.getElementById('exportDataButton')
  const clearDataButton = document.getElementById('clearDataButton')
  const privacyInfoButton = document.getElementById('privacyInfoButton')

  // Load saved settings with migration support
  try {
    // First check for encrypted API key
    let apiKey = await getSecureApiKey()
    
    // If no encrypted key, check for legacy plaintext key and migrate
    if (!apiKey) {
      chrome.storage.sync.get(['apiKey'], async (data) => {
        if (data.apiKey) {
          console.log('Migrating legacy API key to encrypted storage...')
          try {
            await setSecureApiKey(data.apiKey)
            // Remove the old plaintext key
            chrome.storage.sync.remove(['apiKey'])
            apiKeyInput.value = data.apiKey
            showStatus('🔒 API key migrated to secure storage', 'success')
          } catch (error) {
            console.error('Failed to migrate API key:', error)
            // Fallback to plaintext if migration fails
            apiKeyInput.value = data.apiKey
            showStatus('⚠️ Using legacy storage - please re-save API key', 'error')
          }
        }
      })
    } else {
      apiKeyInput.value = apiKey
    }

    // Load other settings including analytics preferences
    chrome.storage.sync.get([
      'defaultModel',
      'autoDetectIntent',
      'showTips',
      'userEmail'
    ], (data) => {
      if (data.defaultModel) {
        defaultModelSelect.value = data.defaultModel
      }
      autoDetectCheckbox.checked = data.autoDetectIntent !== false
      showTipsCheckbox.checked = data.showTips !== false
      
      // Load saved email if available
      if (data.userEmail) {
        userEmailInput.value = data.userEmail
      }
    })
    
    // Load analytics status
    await loadAnalyticsStatus()
  } catch (error) {
    console.error('Failed to load settings:', error)
    showStatus('⚠️ Failed to load secure settings', 'error')
  }

  // Save settings
  saveButton.addEventListener('click', async () => {
    console.log('Save button clicked')
    const apiKeyValue = apiKeyInput.value.trim()
    
    // Show saving status
    showStatus('💾 Saving...', 'success')
    
    // Validate API key format if provided
    if (apiKeyValue && !isValidApiKey(apiKeyValue)) {
      console.warn('Invalid API key format:', apiKeyValue.substring(0, 10) + '...')
      showStatus('⚠️ Invalid API key format', 'error')
      return
    }

    try {
      // Securely store API key
      if (apiKeyValue) {
        console.log('Encrypting and storing API key...')
        await setSecureApiKey(apiKeyValue)
        console.log('API key stored successfully')
      } else {
        console.log('Clearing stored API key...')
        await clearSecureStorage()
        console.log('API key cleared successfully')
      }

      // Handle analytics settings
      const analyticsEnabled = analyticsEnabledCheckbox.checked
      const userEmail = userEmailInput.value.trim()
      
      // Update analytics preferences
      if (window.analytics) {
        await window.analytics.setEnabled(analyticsEnabled)
        
        // Handle email if provided and analytics is enabled
        if (analyticsEnabled && userEmail && isValidEmail(userEmail)) {
          const emailSaved = await window.analytics.recordEmail(userEmail)
          if (emailSaved) {
            showEmailStatus('✓ Email saved securely', 'success')
          } else {
            showEmailStatus('⚠️ Failed to save email', 'error')
          }
        }
      }
      
      // Store other settings
      const settings = {
        defaultModel: defaultModelSelect.value,
        autoDetectIntent: autoDetectCheckbox.checked,
        showTips: showTipsCheckbox.checked,
        userEmail: userEmail
      }

      console.log('Saving other settings:', settings)

      chrome.storage.sync.set(settings, () => {
        if (chrome.runtime.lastError) {
          console.error('Chrome storage error:', chrome.runtime.lastError)
          showStatus('⚠️ Failed to save settings', 'error')
        } else {
          console.log('All settings saved successfully')
          showStatus('✓ Settings saved securely', 'success')
        }
      })
    } catch (error) {
      console.error('Failed to save settings:', error)
      showStatus(`⚠️ Save failed: ${error.message}`, 'error')
    }
  })

  // Helper function to show status messages
  function showStatus(message, type = 'success') {
    status.textContent = message
    status.className = `status ${type} show`
    
    setTimeout(() => {
      status.classList.remove('show')
    }, 3000)
  }

  // Validate API key format (more flexible)
  function isValidApiKey(key) {
    // OpenAI API keys start with sk- and are typically 51 characters long
    // But allow some flexibility for different key formats
    if (!key || key.length < 20) return false
    
    // Check for OpenAI format
    if (/^sk-[a-zA-Z0-9]{20,}$/.test(key)) return true
    
    // Check for other potential formats (future-proofing)
    if (/^[a-zA-Z0-9-_]{20,}$/.test(key)) return true
    
    return false
  }

  // Analytics-related event handlers
  analyticsEnabledCheckbox.addEventListener('change', async () => {
    if (window.analytics) {
      await window.analytics.setEnabled(analyticsEnabledCheckbox.checked)
      await updateAnalyticsStatus()
    }
  })
  
  learnMoreLink.addEventListener('click', (e) => {
    e.preventDefault()
    showAnalyticsInfo()
  })
  
  userEmailInput.addEventListener('blur', () => {
    const email = userEmailInput.value.trim()
    if (email && !isValidEmail(email)) {
      showEmailStatus('Invalid email format', 'error')
    } else {
      showEmailStatus('', '')
    }
  })
  
  // Add enter key support for inputs
  apiKeyInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      saveButton.click()
    }
  })
  
  userEmailInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      saveButton.click()
    }
  })
  
  // Load analytics status on page load
  async function loadAnalyticsStatus() {
    try {
      if (window.analytics) {
        const status = await window.analytics.getStatus()
        analyticsEnabledCheckbox.checked = status.enabled
        await updateAnalyticsStatus()
      } else {
        analyticsStatusText.textContent = 'Analytics module not available'
      }
    } catch (error) {
      console.error('Failed to load analytics status:', error)
      analyticsStatusText.textContent = 'Error loading analytics status'
    }
  }
  
  async function updateAnalyticsStatus() {
    try {
      if (!window.analytics) {
        analyticsStatusText.textContent = 'Analytics module not available'
        return
      }
      
      const status = await window.analytics.getStatus()
      
      if (status.enabled) {
        const installDate = status.install_date ? 
          new Date(status.install_date).toLocaleDateString() : 'Unknown'
        analyticsStatusText.innerHTML = `
          ✓ Enabled | User ID: ${status.user_id ? status.user_id.substring(0, 8) + '...' : 'Generating...'} | 
          Installed: ${installDate}
          ${status.email_provided ? ' | 📧 Email provided' : ''}
        `
      } else {
        analyticsStatusText.textContent = '❌ Disabled - No data is collected'
      }
    } catch (error) {
      console.error('Failed to update analytics status:', error)
      analyticsStatusText.textContent = 'Error checking analytics status'
    }
  }
  
  function showAnalyticsInfo() {
    const info = `
Privacy-Conscious Analytics:

• Anonymous user IDs (no personal identification)
• Basic usage patterns only (which features are used)
• No prompt content is ever collected
• Data encrypted in transit and at rest
• Full opt-out available anytime
• Email is optional and used only for updates

We collect minimal data to improve the extension while respecting your privacy.
    `
    alert(info)
  }
  
  function showEmailStatus(message, type) {
    const emailValidation = document.getElementById('emailValidation')
    emailValidation.textContent = message
    emailValidation.className = `validation-message ${type}`
  }
  
  function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }
  
  // Privacy control event handlers
  exportDataButton.addEventListener('click', async () => {
    try {
      if (window.privacyManager) {
        const success = await window.privacyManager.downloadUserData()
        if (success) {
          showStatus('✓ Data exported successfully', 'success')
        } else {
          showStatus('⚠️ Failed to export data', 'error')
        }
      } else {
        showStatus('⚠️ Privacy controls not available', 'error')
      }
    } catch (error) {
      console.error('Export data error:', error)
      showStatus('⚠️ Export failed: ' + error.message, 'error')
    }
  })
  
  clearDataButton.addEventListener('click', async () => {
    const confirmed = confirm(
      'Are you sure you want to clear ALL extension data?\\n\\n' +
      'This will remove:\\n' +
      '• All analytics data\\n' +
      '• Extension settings and preferences\\n' +
      '• Cached optimization results\\n' +
      '• Email subscription (if provided)\\n\\n' +
      'You will be asked separately about your API key.\\n\\n' +
      'This action cannot be undone.'
    )
    
    if (confirmed) {
      try {
        if (window.privacyManager) {
          const success = await window.privacyManager.clearAllData()
          if (success) {
            showStatus('✓ All data cleared successfully', 'success')
            // Refresh the page to show cleared state
            setTimeout(() => {
              window.location.reload()
            }, 2000)
          } else {
            showStatus('⚠️ Failed to clear all data', 'error')
          }
        } else {
          showStatus('⚠️ Privacy controls not available', 'error')
        }
      } catch (error) {
        console.error('Clear data error:', error)
        showStatus('⚠️ Clear failed: ' + error.message, 'error')
      }
    }
  })
  
  privacyInfoButton.addEventListener('click', () => {
    if (window.privacyManager) {
      const info = window.privacyManager.getPrivacyInfo()
      
      const infoText = `
📊 PRIVACY INFORMATION

🔍 Data We Collect:
${info.data_collection.map(item => '• ' + item).join('\\n')}

🚫 Data We DON'T Collect:
${info.data_not_collected.map(item => '• ' + item).join('\\n')}

⏰ Data Retention:
${info.data_retention.map(item => '• ' + item).join('\\n')}

🛡️ Your Rights:
${info.your_rights.map(item => '• ' + item).join('\\n')}

📞 Contact: ${info.contact}
      `.trim()
      
      alert(infoText)
    } else {
      alert('Privacy information not available')
    }
  })
})