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

document.addEventListener('DOMContentLoaded', async () => {
  const apiKeyInput = document.getElementById('apiKey')
  const defaultModelSelect = document.getElementById('defaultModel')
  const autoDetectCheckbox = document.getElementById('autoDetectIntent')
  const showTipsCheckbox = document.getElementById('showTips')
  const saveButton = document.getElementById('saveButton')
  const status = document.getElementById('status')

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

    // Load other settings
    chrome.storage.sync.get([
      'defaultModel',
      'autoDetectIntent',
      'showTips'
    ], (data) => {
      if (data.defaultModel) {
        defaultModelSelect.value = data.defaultModel
      }
      autoDetectCheckbox.checked = data.autoDetectIntent !== false
      showTipsCheckbox.checked = data.showTips !== false
    })
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

      // Store other settings
      const settings = {
        defaultModel: defaultModelSelect.value,
        autoDetectIntent: autoDetectCheckbox.checked,
        showTips: showTipsCheckbox.checked
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

  // Add enter key support for API key input
  apiKeyInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      saveButton.click()
    }
  })
})