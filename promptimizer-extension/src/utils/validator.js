/**
 * API response validation utilities
 * Validates and sanitizes responses from external APIs
 */

import { sanitizeTextContent, validateContent } from './sanitizer.js'

// Validate OpenAI API response structure
export function validateOpenAIResponse(response) {
  try {
    if (!response || typeof response !== 'object') {
      return { valid: false, error: 'Invalid response format' }
    }

    // Check for required fields
    if (!response.choices || !Array.isArray(response.choices)) {
      return { valid: false, error: 'Missing choices array' }
    }

    if (response.choices.length === 0) {
      return { valid: false, error: 'Empty choices array' }
    }

    const choice = response.choices[0]
    if (!choice.message || !choice.message.content) {
      return { valid: false, error: 'Missing message content' }
    }

    // Validate content safety
    const content = choice.message.content
    if (typeof content !== 'string') {
      return { valid: false, error: 'Content is not a string' }
    }

    if (!validateContent(content)) {
      return { valid: false, error: 'Content contains potentially dangerous elements' }
    }

    // Check content length (prevent DoS)
    if (content.length > 100000) {
      return { valid: false, error: 'Content too long' }
    }

    return { valid: true, content: sanitizeTextContent(content) }
  } catch (error) {
    return { valid: false, error: `Validation error: ${error.message}` }
  }
}

// Validate streaming response chunk
export function validateStreamChunk(chunk) {
  try {
    if (!chunk || typeof chunk !== 'string') {
      return { valid: false, error: 'Invalid chunk format' }
    }

    // Parse JSON chunk
    let parsed
    try {
      parsed = JSON.parse(chunk)
    } catch (e) {
      return { valid: false, error: 'Invalid JSON in chunk' }
    }

    // Validate chunk structure
    if (!parsed.choices || !Array.isArray(parsed.choices)) {
      return { valid: false, error: 'Invalid chunk structure' }
    }

    if (parsed.choices.length === 0) {
      return { valid: true, content: null } // End of stream
    }

    const delta = parsed.choices[0].delta
    if (!delta || !delta.content) {
      return { valid: true, content: null } // No content in this chunk
    }

    const content = delta.content
    if (typeof content !== 'string') {
      return { valid: false, error: 'Chunk content is not a string' }
    }

    // Validate content safety
    if (!validateContent(content)) {
      return { valid: false, error: 'Chunk contains potentially dangerous elements' }
    }

    return { valid: true, content: sanitizeTextContent(content) }
  } catch (error) {
    return { valid: false, error: `Chunk validation error: ${error.message}` }
  }
}

// Validate API error response
export function validateErrorResponse(response, status) {
  try {
    const errorInfo = {
      status: status || 'unknown',
      message: 'An error occurred',
      code: null
    }

    if (response && typeof response === 'object') {
      if (response.error) {
        // OpenAI error format
        if (response.error.message) {
          errorInfo.message = sanitizeTextContent(response.error.message.substring(0, 200))
        }
        if (response.error.code) {
          errorInfo.code = response.error.code
        }
      } else if (response.message) {
        // Generic error format
        errorInfo.message = sanitizeTextContent(response.message.substring(0, 200))
      }
    }

    // Sanitize status code
    if (typeof status === 'number' && status >= 100 && status <= 599) {
      errorInfo.status = status
    }

    return errorInfo
  } catch (error) {
    return {
      status: 'unknown',
      message: 'Error validation failed',
      code: null
    }
  }
}

// Validate prompt optimization result
export function validateOptimizationResult(result) {
  try {
    if (!result || typeof result !== 'object') {
      return { valid: false, error: 'Invalid result format' }
    }

    // Check required fields
    const requiredFields = ['optimizedPrompt', 'detectedIntent', 'qualityLevel', 'metadata']
    for (const field of requiredFields) {
      if (!(field in result)) {
        return { valid: false, error: `Missing required field: ${field}` }
      }
    }

    // Validate optimized prompt
    if (typeof result.optimizedPrompt !== 'string') {
      return { valid: false, error: 'Optimized prompt must be a string' }
    }

    if (!validateContent(result.optimizedPrompt)) {
      return { valid: false, error: 'Optimized prompt contains dangerous content' }
    }

    // Validate other fields
    const validIntents = ['code_generation', 'analytical', 'creative_writing', 'general']
    if (!validIntents.includes(result.detectedIntent)) {
      return { valid: false, error: 'Invalid detected intent' }
    }

    const validQualities = ['simple', 'advanced', 'expert']
    if (!validQualities.includes(result.qualityLevel)) {
      return { valid: false, error: 'Invalid quality level' }
    }

    // Validate metadata
    if (!result.metadata || typeof result.metadata !== 'object') {
      return { valid: false, error: 'Invalid metadata format' }
    }

    // Sanitize the result
    const sanitized = {
      optimizedPrompt: sanitizeTextContent(result.optimizedPrompt),
      detectedIntent: result.detectedIntent,
      qualityLevel: result.qualityLevel,
      metadata: {
        originalLength: Math.max(0, parseInt(result.metadata.originalLength) || 0),
        optimizedLength: Math.max(0, parseInt(result.metadata.optimizedLength) || 0),
        optimizationTips: Array.isArray(result.metadata.optimizationTips) 
          ? result.metadata.optimizationTips.slice(0, 10).map(tip => sanitizeTextContent(tip))
          : [],
        model: sanitizeTextContent(result.metadata.model || ''),
        maxTokensUsed: Math.max(0, parseInt(result.metadata.maxTokensUsed) || 0)
      }
    }

    return { valid: true, result: sanitized }
  } catch (error) {
    return { valid: false, error: `Result validation error: ${error.message}` }
  }
}