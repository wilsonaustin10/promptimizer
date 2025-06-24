let selectedText = ''

document.addEventListener('mouseup', () => {
  const selection = window.getSelection()
  selectedText = selection.toString().trim()
  
  if (selectedText && selectedText.length > 10) {
    chrome.storage.local.set({ selectedText })
  }
})

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'getSelectedText') {
    sendResponse({ text: selectedText })
  } else if (request.action === 'insertOptimizedPrompt') {
    const activeElement = document.activeElement
    
    if (activeElement && (activeElement.tagName === 'TEXTAREA' || 
        activeElement.tagName === 'INPUT' || 
        activeElement.contentEditable === 'true')) {
      
      if (activeElement.tagName === 'TEXTAREA' || activeElement.tagName === 'INPUT') {
        activeElement.value = request.prompt
        activeElement.dispatchEvent(new Event('input', { bubbles: true }))
      } else {
        activeElement.textContent = request.prompt
        activeElement.dispatchEvent(new Event('input', { bubbles: true }))
      }
      
      sendResponse({ success: true })
    } else {
      sendResponse({ success: false, error: 'No active text input found' })
    }
  }
})