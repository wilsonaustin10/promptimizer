/**
 * Content sanitization utilities to prevent XSS attacks
 * Safely handles user-generated content before DOM insertion
 */

// Basic HTML entity encoding
export function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Remove potentially dangerous HTML tags and attributes
export function sanitizeHtml(html) {
  // Allow only safe tags
  const allowedTags = ['p', 'br', 'strong', 'em', 'ul', 'ol', 'li', 'code', 'pre'];
  const allowedAttributes = [];

  // Create a temporary element to parse HTML
  const temp = document.createElement('div');
  temp.innerHTML = html;

  // Remove all script tags and event handlers
  const scripts = temp.querySelectorAll('script');
  scripts.forEach(script => script.remove());

  // Remove dangerous attributes
  const allElements = temp.querySelectorAll('*');
  allElements.forEach(element => {
    // Remove elements not in allowed list
    if (!allowedTags.includes(element.tagName.toLowerCase())) {
      element.replaceWith(...element.childNodes);
      return;
    }

    // Remove all attributes (including event handlers)
    const attributes = Array.from(element.attributes);
    attributes.forEach(attr => {
      if (!allowedAttributes.includes(attr.name.toLowerCase())) {
        element.removeAttribute(attr.name);
      }
    });
  });

  return temp.innerHTML;
}

// Sanitize text content for safe insertion into DOM
export function sanitizeTextContent(content) {
  if (typeof content !== 'string') {
    return '';
  }

  // Remove null bytes and control characters except newlines and tabs
  let sanitized = content.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
  
  // Limit length to prevent DoS
  const maxLength = 50000;
  if (sanitized.length > maxLength) {
    sanitized = sanitized.substring(0, maxLength) + '... [truncated]';
  }

  return sanitized;
}

// Validate that content is safe for insertion
export function validateContent(content) {
  if (!content || typeof content !== 'string') {
    return false;
  }

  // Check for suspicious patterns
  const dangerousPatterns = [
    /<script/i,
    /javascript:/i,
    /vbscript:/i,
    /on\w+\s*=/i,  // Event handlers like onclick=
    /<iframe/i,
    /<object/i,
    /<embed/i,
    /<form/i
  ];

  return !dangerousPatterns.some(pattern => pattern.test(content));
}

// Safe DOM text insertion with validation
export function safeSetTextContent(element, content) {
  if (!element || !element.textContent !== undefined) {
    throw new Error('Invalid DOM element provided');
  }

  const sanitized = sanitizeTextContent(content);
  
  if (!validateContent(sanitized)) {
    console.warn('Potentially dangerous content blocked:', content.substring(0, 100));
    element.textContent = '[Content blocked for security]';
    return false;
  }

  element.textContent = sanitized;
  return true;
}

// Safe DOM value insertion for form inputs
export function safeSetInputValue(element, value) {
  if (!element || typeof element.value === 'undefined') {
    throw new Error('Invalid input element provided');
  }

  const sanitized = sanitizeTextContent(value);
  
  if (!validateContent(sanitized)) {
    console.warn('Potentially dangerous input blocked:', value.substring(0, 100));
    element.value = '[Content blocked for security]';
    return false;
  }

  element.value = sanitized;
  return true;
}