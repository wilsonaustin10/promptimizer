const SYSTEM_PROMPTS = {
  simple: {
    'gpt-4o': `You are an expert prompt engineer. Transform the user's prompt for GPT-4o:
- Add clear role definition
- Break into numbered steps
- Specify output format
- Add "Think step-by-step" for reasoning

Return ONLY the optimized prompt. Do NOT include any explanations, descriptions, or commentary about the prompt.`,

    'claude-3-sonnet': `You are an expert prompt engineer. Transform the user's prompt for Claude 3 Sonnet:
- Use XML tags for structure (<task>, <context>)
- Provide context upfront
- Include specific formatting
- Add ethical framing

Return ONLY the optimized prompt. Do NOT include any explanations, descriptions, or commentary about the prompt.`,

    'gemini-1.5': `You are an expert prompt engineer. Transform the user's prompt for Gemini 1.5:
- Use structured sections
- Include reasoning requests
- Specify response length
- Add evaluation criteria

Return ONLY the optimized prompt. Do NOT include any explanations, descriptions, or commentary about the prompt.`,

    'o3-mini': `You are an expert prompt engineer. Transform the user's prompt for o3-mini:
- Add clear role definition and constraints
- Structure with numbered steps
- Include specific success criteria
- Add "Think step-by-step" for complex tasks

Return ONLY the optimized prompt.`
  },

  advanced: {
    'gpt-4o': `# ROLE
You are a SENIOR PROMPT ENGINEER with deep expertise in GPT-4o optimization patterns.

# OBJECTIVE
Transform the user's raw prompt into a production-ready, highly optimized version that leverages GPT-4o's capabilities for maximum performance and reliability.

# TRANSFORMATION GUIDELINES
1. **Role Definition**: Start with clear, specific role assignment ("You are a [specific expert]...")
2. **Task Structure**: Break complex requests into numbered, sequential steps
3. **Output Specification**: Define exact format, length, and structure requirements
4. **Reasoning Enhancement**: Add "Think step-by-step" or "Show your work" for analytical tasks
5. **Constraints & Guardrails**: Include specific limitations and success criteria
6. **Context Injection**: Add relevant background information and examples when beneficial
7. **Error Handling**: Include instructions for edge cases and uncertainty

# OUTPUT FORMAT
Return ONLY the optimized prompt formatted with clear sections, using markdown headings where appropriate. Do NOT include any explanations or descriptions about what the prompt is designed to do. Do NOT add a title or heading like "# Optimized Prompt for GPT-4o" - start directly with the actual prompt content.

# QUALITY STANDARDS
The optimized prompt should be:
- Specific and unambiguous
- Structured for consistent results
- Enhanced with relevant constraints
- Optimized for GPT-4o's reasoning capabilities`,

    'claude-3-sonnet': `# ROLE
You are a SENIOR PROMPT ENGINEER specializing in Claude 3 Sonnet optimization with deep understanding of its architectural strengths.

# OBJECTIVE
Transform the user's raw prompt into a comprehensive, well-structured prompt that maximizes Claude 3 Sonnet's performance through proper XML structuring and ethical framing.

# TRANSFORMATION GUIDELINES
1. **XML Structure**: Use semantic tags like <task>, <context>, <requirements>, <constraints>, <output_format>
2. **Ethical Framing**: Emphasize helpful, harmless, honest approach
3. **Detailed Context**: Provide comprehensive background and reasoning
4. **Specific Examples**: Include concrete examples when beneficial
5. **Clear Boundaries**: Define what should and shouldn't be included
6. **Step-by-Step**: Break complex tasks into logical sequences
7. **Verification**: Add self-checking mechanisms

# OUTPUT FORMAT
Return ONLY the optimized prompt using proper XML structure and professional formatting. Do NOT include any meta-commentary or descriptions about the prompt. Do NOT add a title or heading - start directly with the prompt content.

# QUALITY STANDARDS
- Comprehensive context and clear structure
- Ethical considerations and safety guidelines
- Detailed requirements and success criteria
- Claude-optimized XML formatting`,

    'gemini-1.5': `# ROLE
You are a SENIOR PROMPT ENGINEER with expertise in Gemini 1.5's multimodal and reasoning capabilities.

# OBJECTIVE
Transform the user's raw prompt into a comprehensive, structured prompt that leverages Gemini 1.5's strengths in reasoning, analysis, and structured thinking.

# TRANSFORMATION GUIDELINES
1. **Structured Sections**: Use clear headings and logical organization
2. **Reasoning Transparency**: Include "Explain your reasoning" and "Show your work"
3. **Multimodal Awareness**: Reference relevant multimodal capabilities when applicable
4. **Length Specifications**: Define expected response length and detail level
5. **Evaluation Criteria**: Include metrics for success and quality assessment
6. **Comprehensive Context**: Provide thorough background and constraints
7. **Iterative Refinement**: Include self-improvement instructions

# OUTPUT FORMAT
Return ONLY the optimized prompt with professional structure and clear sections. Do NOT include any explanations about the prompt's purpose or design. Do NOT add a title heading - start directly with the prompt content.

# QUALITY STANDARDS
- Comprehensive and well-organized
- Transparency in reasoning requirements
- Specific evaluation criteria
- Optimized for Gemini's analytical strengths`,

    'o3-mini': `# ROLE
You are a SENIOR PROMPT ENGINEER with deep expertise in o3-mini's reasoning and efficiency capabilities.

# OBJECTIVE
Transform the user's raw prompt into a highly optimized, production-ready prompt that maximizes o3-mini's reasoning capabilities while maintaining efficiency.

# TRANSFORMATION GUIDELINES
1. **Precise Role Definition**: Establish clear expertise and context
2. **Reasoning Structure**: Use step-by-step thinking and logical progression
3. **Efficiency Optimization**: Balance thoroughness with conciseness for o3-mini
4. **Success Metrics**: Define clear, measurable outcomes
5. **Constraint Management**: Include specific limitations and guardrails
6. **Context Integration**: Provide necessary background without redundancy
7. **Quality Assurance**: Include verification and error-checking steps

# OUTPUT FORMAT
Return ONLY the optimized prompt using professional structure with clear sections and headings. Do NOT add any explanatory text about what the prompt does or how it's designed. Do NOT add a title heading like "Optimized Prompt" - start directly with the prompt content.

# QUALITY STANDARDS
- Highly structured and logical
- Optimized for reasoning efficiency
- Clear success criteria and constraints
- Balanced detail appropriate for o3-mini's capabilities`
  }
}

// Model configurations for different APIs and performance
const MODEL_CONFIGS = {
  'gpt-4o': { api: 'openai', model: 'gpt-4o-mini', maxTokens: 1200, temperature: 0.3 },
  'claude-3-sonnet': { api: 'openai', model: 'gpt-3.5-turbo-1106', maxTokens: 1000, temperature: 0.3 },
  'gemini-1.5': { api: 'openai', model: 'gpt-3.5-turbo-1106', maxTokens: 1000, temperature: 0.3 },
  'o3-mini': { api: 'openai', model: 'o3-mini-2025-01-31', maxTokens: 100000, temperature: 1.0 } // Using actual o3-mini model
}

async function callOptimizationAPI(rawPrompt, targetModel, qualityLevel = 'simple', onProgress) {
  const apiKey = await getAPIKey()
  if (!apiKey) {
    throw new Error('API key not configured. Please set up your API key in settings.')
  }

  const systemPrompt = SYSTEM_PROMPTS[qualityLevel][targetModel]
  const config = MODEL_CONFIGS[targetModel]
  
  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: config.model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Optimize this prompt for ${targetModel}: ${rawPrompt}` }
        ],
        temperature: config.temperature,
        max_tokens: config.maxTokens,
        stream: config.model !== 'o3-mini-2025-01-31' // o3-mini doesn't support streaming
      })
    })

    if (!response.ok) {
      throw new Error(`API request failed: ${response.statusText}`)
    }

    // Handle streaming vs non-streaming response
    if (config.model === 'o3-mini-2025-01-31') {
      // Non-streaming response for o3-mini
      const data = await response.json()
      const result = data.choices[0].message.content
      if (onProgress) onProgress(result)
      return result
    } else {
      // Streaming response for other models
      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let result = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value)
        const lines = chunk.split('\n')

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6)
            if (data === '[DONE]') continue
            
            try {
              const parsed = JSON.parse(data)
              const content = parsed.choices?.[0]?.delta?.content
              if (content) {
                result += content
                // Send progress updates
                if (onProgress) onProgress(result)
              }
            } catch (e) {
              // Skip invalid JSON chunks
            }
          }
        }
      }

      return result
    }
  } catch (error) {
    console.error('API call failed:', error)
    throw error
  }
}

// Post-process to remove common explanatory phrases
function cleanOptimizedPrompt(prompt) {
  // Remove common explanatory sentences that models might add
  const explanatoryPatterns = [
    /^#+ ?(?:Optimized )?Prompt (?:for|optimized for) .+?$/gmi,  // Remove "# Optimized Prompt for GPT-4o" etc
    /^#+ ?(?:Prompt|Optimized) .+?$/gmi,  // Remove any prompt-related headings
    /This (?:optimized )?prompt is designed to.+?\./gi,
    /This prompt (?:will )?leverage.+?\./gi,
    /The following prompt.+?\./gi,
    /Here's the optimized prompt.+?:/gi,
    /Below is the optimized prompt.+?:/gi,
    /I've optimized.+?\./gi,
    /The optimized prompt.+?:/gi,
    /^This .+? prompt .+?\.\s*/gm,
    /^Here is .+? prompt.+?:?\s*/gmi,
    /^The .+? prompt.+?:?\s*/gmi
  ]
  
  let cleaned = prompt
  for (const pattern of explanatoryPatterns) {
    cleaned = cleaned.replace(pattern, '')
  }
  
  // Remove leading/trailing whitespace and extra newlines
  cleaned = cleaned.trim().replace(/\n{3,}/g, '\n\n')
  
  // If the prompt starts with extra newlines after cleaning, remove them
  cleaned = cleaned.replace(/^\n+/, '')
  
  return cleaned
}

// Simple in-memory cache with TTL
const promptCache = new Map()
const CACHE_TTL = 24 * 60 * 60 * 1000 // 24 hours

function getCacheKey(rawPrompt, targetModel, qualityLevel) {
  return `${qualityLevel}:${targetModel}:${rawPrompt.toLowerCase().trim()}`
}

function getCachedResult(rawPrompt, targetModel, qualityLevel) {
  const key = getCacheKey(rawPrompt, targetModel, qualityLevel)
  const cached = promptCache.get(key)
  
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.result
  }
  
  // Clean expired entries
  if (cached) {
    promptCache.delete(key)
  }
  
  return null
}

function setCachedResult(rawPrompt, targetModel, qualityLevel, result) {
  const key = getCacheKey(rawPrompt, targetModel, qualityLevel)
  promptCache.set(key, {
    result,
    timestamp: Date.now()
  })
  
  // Limit cache size
  if (promptCache.size > 100) {
    const firstKey = promptCache.keys().next().value
    promptCache.delete(firstKey)
  }
}

async function getAPIKey() {
  return new Promise((resolve) => {
    chrome.storage.sync.get(['apiKey'], (result) => {
      resolve(result.apiKey || '')
    })
  })
}

function detectIntent(prompt) {
  const lowerPrompt = prompt.toLowerCase()
  
  if (lowerPrompt.includes('code') || lowerPrompt.includes('function') || 
      lowerPrompt.includes('implement') || lowerPrompt.includes('debug')) {
    return 'code_generation'
  } else if (lowerPrompt.includes('analyze') || lowerPrompt.includes('explain') || 
             lowerPrompt.includes('compare')) {
    return 'analytical'
  } else if (lowerPrompt.includes('write') || lowerPrompt.includes('story') || 
             lowerPrompt.includes('create')) {
    return 'creative_writing'
  } else {
    return 'general'
  }
}

function getOptimizationTips(original, optimized, targetModel) {
  const tips = []
  
  if (!original.includes('You are') && optimized.includes('You are')) {
    tips.push('Added role definition for clarity')
  }
  
  if (targetModel === 'claude-3-sonnet' && optimized.includes('<')) {
    tips.push('Added XML-style structure tags')
  }
  
  if (optimized.includes('step') && !original.includes('step')) {
    tips.push('Broke down into clear steps')
  }
  
  if (optimized.length > original.length * 1.5) {
    tips.push('Added specific constraints and context')
  }
  
  return tips
}

chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: 'optimizePrompt',
    title: 'Optimize this prompt',
    contexts: ['selection']
  })
})

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === 'optimizePrompt' && info.selectionText) {
    chrome.storage.local.set({ 
      selectedText: info.selectionText,
      fromContextMenu: true 
    })
    chrome.action.openPopup()
  }
})

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'optimizePrompt') {
    const { rawPrompt, targetModel, qualityLevel = 'simple' } = request.data
    
    // Check cache first
    const cachedResult = getCachedResult(rawPrompt, targetModel, qualityLevel)
    if (cachedResult) {
      console.log(`Cache hit - instant response! (${qualityLevel} quality)`)
      sendResponse({ success: true, data: cachedResult, cached: true })
      return
    }
    
    // Progress callback for streaming
    const onProgress = (partialResult) => {
      // Send progress update to popup
      chrome.runtime.sendMessage({
        action: 'optimizationProgress',
        data: { partialResult }
      }).catch(() => {}) // Ignore if popup is closed
    }
    
    callOptimizationAPI(rawPrompt, targetModel, qualityLevel, onProgress)
      .then(optimizedPrompt => {
        // Clean any explanatory text that might have been added
        const cleanedPrompt = cleanOptimizedPrompt(optimizedPrompt)
        
        const result = {
          optimizedPrompt: cleanedPrompt,
          detectedIntent: detectIntent(rawPrompt),
          qualityLevel,
          metadata: {
            originalLength: rawPrompt.length,
            optimizedLength: cleanedPrompt.length,
            optimizationTips: getOptimizationTips(rawPrompt, cleanedPrompt, targetModel),
            model: MODEL_CONFIGS[targetModel].model
          }
        }
        
        // Cache the result
        setCachedResult(rawPrompt, targetModel, qualityLevel, result)
        
        sendResponse({ success: true, data: result })
      })
      .catch(error => {
        sendResponse({ success: false, error: error.message })
      })
    
    return true
  }
})