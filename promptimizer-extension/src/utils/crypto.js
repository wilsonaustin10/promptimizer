/**
 * Secure API key storage utilities using Web Crypto API
 * Provides encryption/decryption for sensitive data storage
 */

// Generate a key for encryption/decryption
async function generateKey() {
  return await crypto.subtle.generateKey(
    {
      name: 'AES-GCM',
      length: 256,
    },
    true,
    ['encrypt', 'decrypt']
  );
}

// Get or create encryption key from storage
async function getOrCreateKey() {
  return new Promise((resolve) => {
    chrome.storage.local.get(['encryptionKey'], async (result) => {
      if (result.encryptionKey) {
        // Import existing key
        const keyData = new Uint8Array(result.encryptionKey);
        const key = await crypto.subtle.importKey(
          'raw',
          keyData,
          { name: 'AES-GCM' },
          true,
          ['encrypt', 'decrypt']
        );
        resolve(key);
      } else {
        // Generate new key
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

// Encrypt sensitive data
export async function encryptData(plaintext) {
  if (!plaintext || plaintext.trim() === '') {
    return null;
  }

  try {
    const key = await getOrCreateKey();
    const iv = crypto.getRandomValues(new Uint8Array(12)); // 96-bit IV for AES-GCM
    const encodedText = new TextEncoder().encode(plaintext);
    
    const encrypted = await crypto.subtle.encrypt(
      {
        name: 'AES-GCM',
        iv: iv,
      },
      key,
      encodedText
    );
    
    // Combine IV and encrypted data
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

// Decrypt sensitive data
export async function decryptData(encryptedData) {
  if (!encryptedData) {
    return '';
  }

  try {
    const key = await getOrCreateKey();
    const combined = new Uint8Array(encryptedData);
    
    // Extract IV and encrypted data
    const iv = combined.slice(0, 12);
    const encrypted = combined.slice(12);
    
    const decrypted = await crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv: iv,
      },
      key,
      encrypted
    );
    
    return new TextDecoder().decode(decrypted);
  } catch (error) {
    console.error('Decryption failed:', error);
    // Return empty string on decryption failure (corrupted data)
    return '';
  }
}

// Secure storage wrapper for API keys
export async function setSecureApiKey(apiKey) {
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

// Secure retrieval wrapper for API keys
export async function getSecureApiKey() {
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

// Clear all stored keys (for logout/reset)
export async function clearSecureStorage() {
  return new Promise((resolve) => {
    chrome.storage.sync.remove(['encryptedApiKey'], () => {
      chrome.storage.local.remove(['encryptionKey'], () => {
        resolve();
      });
    });
  });
}