import { sanitizeTextContent, validateContent, safeSetTextContent, safeSetInputValue } from '../utils/sanitizer.js'

let selectedText = ''

document.addEventListener('mouseup', () => {
  const selection = window.getSelection()
  const rawText = selection.toString().trim()
  
  // Sanitize selected text before storing
  selectedText = sanitizeTextContent(rawText)
  
  if (selectedText && selectedText.length > 10 && validateContent(selectedText)) {
    chrome.storage.local.set({ selectedText })
  }
})

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'getSelectedText') {
    sendResponse({ text: selectedText })
  } else if (request.action === 'insertOptimizedPrompt') {
    try {
      const activeElement = document.activeElement
      
      // Validate the element exists and is a valid input
      if (!activeElement || !isValidInputElement(activeElement)) {
        sendResponse({ success: false, error: 'No valid text input found' })
        return
      }

      // Validate and sanitize the prompt content
      if (!request.prompt || !validateContent(request.prompt)) {
        console.warn('Blocked unsafe prompt insertion attempt')
        sendResponse({ success: false, error: 'Content blocked for security reasons' })
        return
      }

      // Safely insert content based on element type
      let insertSuccess = false
      
      if (activeElement.tagName === 'TEXTAREA' || activeElement.tagName === 'INPUT') {
        insertSuccess = safeSetInputValue(activeElement, request.prompt)
        if (insertSuccess) {
          activeElement.dispatchEvent(new Event('input', { bubbles: true }))
        }
      } else if (activeElement.contentEditable === 'true') {
        insertSuccess = safeSetTextContent(activeElement, request.prompt)
        if (insertSuccess) {
          activeElement.dispatchEvent(new Event('input', { bubbles: true }))
        }
      }
      
      sendResponse({ 
        success: insertSuccess,
        error: insertSuccess ? null : 'Failed to insert content safely'
      })
    } catch (error) {
      console.error('Content insertion error:', error)
      sendResponse({ success: false, error: 'Insertion failed due to security restrictions' })
    }
  }
})

// Validate that an element is a safe target for text insertion
function isValidInputElement(element) {
  if (!element) return false
  
  const tagName = element.tagName.toLowerCase()
  const isInput = tagName === 'input' || tagName === 'textarea'
  const isContentEditable = element.contentEditable === 'true'
  
  // Additional security check - ensure element is not in a dangerous context
  const isDangerous = element.closest('script, style, iframe') !== null
  
  return (isInput || isContentEditable) && !isDangerous
}