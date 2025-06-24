document.addEventListener('DOMContentLoaded', () => {
  const apiKeyInput = document.getElementById('apiKey')
  const defaultModelSelect = document.getElementById('defaultModel')
  const autoDetectCheckbox = document.getElementById('autoDetectIntent')
  const showTipsCheckbox = document.getElementById('showTips')
  const saveButton = document.getElementById('saveButton')
  const status = document.getElementById('status')

  // Load saved settings
  chrome.storage.sync.get([
    'apiKey',
    'defaultModel',
    'autoDetectIntent',
    'showTips'
  ], (data) => {
    if (data.apiKey) {
      apiKeyInput.value = data.apiKey
    }
    if (data.defaultModel) {
      defaultModelSelect.value = data.defaultModel
    }
    autoDetectCheckbox.checked = data.autoDetectIntent !== false
    showTipsCheckbox.checked = data.showTips !== false
  })

  // Save settings
  saveButton.addEventListener('click', () => {
    const settings = {
      apiKey: apiKeyInput.value.trim(),
      defaultModel: defaultModelSelect.value,
      autoDetectIntent: autoDetectCheckbox.checked,
      showTips: showTipsCheckbox.checked
    }

    chrome.storage.sync.set(settings, () => {
      // Show success message
      status.textContent = '✓ Settings saved'
      status.classList.add('show')
      
      setTimeout(() => {
        status.classList.remove('show')
      }, 3000)
    })
  })

  // Add enter key support for API key input
  apiKeyInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      saveButton.click()
    }
  })
})