import React, { useState, useEffect } from 'react'
import ReactDOM from 'react-dom/client'
import './popup.css'

// Analytics integration
declare global {
  interface Window {
    analytics?: {
      trackEvent: (eventType: string, eventData?: any) => Promise<void>
      getStatus: () => Promise<{ enabled: boolean }>
    }
    ANALYTICS_EVENTS?: {
      OPTIMIZATION_STARTED: string
      OPTIMIZATION_COMPLETED: string
      OPTIMIZATION_FAILED: string
      COPY_TO_CLIPBOARD: string
      MODEL_CHANGED: string
      QUALITY_CHANGED: string
      SETTINGS_OPENED: string
      CONTEXT_MENU_USED: string
      STREAMING_USED: string
      CACHE_HIT: string
    }
  }
}

// Load analytics module
import('../utils/analytics.js').then(module => {
  window.analytics = module.analytics
  window.ANALYTICS_EVENTS = module.ANALYTICS_EVENTS
}).catch(() => {
  console.warn('Analytics module not available')
})

type TargetModel = 'gpt-4o' | 'claude-3-sonnet' | 'gemini-1.5' | 'o3-mini'
type QualityLevel = 'simple' | 'advanced' | 'expert'
type OptimizationType = 'standard' | 'agent'

interface OptimizationResult {
  optimizedPrompt: string
  detectedIntent: string
  metadata: {
    originalLength: number
    optimizedLength: number
    optimizationTips: string[]
  }
}

const App: React.FC = () => {
  const [rawPrompt, setRawPrompt] = useState('')
  const [targetModel, setTargetModel] = useState<TargetModel>('o3-mini')
  const [qualityLevel, setQualityLevel] = useState<QualityLevel>('expert')
  const [optimizationType, setOptimizationType] = useState<OptimizationType>('standard')
  const [isOptimizing, setIsOptimizing] = useState(false)
  const [result, setResult] = useState<OptimizationResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [streamingResult, setStreamingResult] = useState('')
  const [isStreaming, setIsStreaming] = useState(false)

  useEffect(() => {
    chrome.storage.local.get(['lastPrompt', 'lastModel', 'lastQuality', 'lastOptimizationType', 'fromContextMenu', 'selectedText'], (data) => {
      if (data.lastPrompt) setRawPrompt(data.lastPrompt)
      if (data.lastModel) setTargetModel(data.lastModel)
      if (data.lastQuality) setQualityLevel(data.lastQuality)
      if (data.lastOptimizationType) setOptimizationType(data.lastOptimizationType)
      
      // Handle context menu selection
      if (data.fromContextMenu && data.selectedText) {
        setRawPrompt(data.selectedText)
        // Track context menu usage
        window.analytics?.trackEvent(window.ANALYTICS_EVENTS?.CONTEXT_MENU_USED || 'context_menu_used', {
          prompt_length: data.selectedText.length
        })
        // Clear the context menu flag
        chrome.storage.local.remove(['fromContextMenu', 'selectedText'])
      }
    })

    // Listen for streaming progress
    const handleMessage = (message: any) => {
      if (message.action === 'optimizationProgress') {
        setIsStreaming(true)
        setStreamingResult(message.data.partialResult)
        // Track streaming usage
        window.analytics?.trackEvent(window.ANALYTICS_EVENTS?.STREAMING_USED || 'streaming_used', {
          target_model: targetModel
        })
      }
    }

    chrome.runtime.onMessage.addListener(handleMessage)
    return () => chrome.runtime.onMessage.removeListener(handleMessage)
  }, [])

  const handleOptimize = async () => {
    if (!rawPrompt.trim()) return

    // Track optimization start
    window.analytics?.trackEvent(window.ANALYTICS_EVENTS?.OPTIMIZATION_STARTED || 'optimization_started', {
      target_model: targetModel,
      quality_level: qualityLevel,
      optimization_type: optimizationType,
      prompt_length: rawPrompt.length
    })

    setIsOptimizing(true)
    setError(null)
    setResult(null)
    setStreamingResult('')
    setIsStreaming(false)

    const startTime = Date.now()

    try {
      const response = await chrome.runtime.sendMessage({
        action: 'optimizePrompt',
        data: { rawPrompt, targetModel, qualityLevel, optimizationType }
      })

      const latency = Date.now() - startTime

      if (response.success) {
        setResult(response.data)
        setIsStreaming(false)
        setStreamingResult('')
        
        // Track successful optimization
        window.analytics?.trackEvent(window.ANALYTICS_EVENTS?.OPTIMIZATION_COMPLETED || 'optimization_completed', {
          target_model: targetModel,
          quality_level: qualityLevel,
          optimization_type: optimizationType,
          prompt_length: rawPrompt.length,
          optimized_length: response.data.optimizedPrompt.length,
          optimization_time: latency,
          cached: response.cached || false
        })
        
        // Track cache hit separately if applicable
        if (response.cached) {
          window.analytics?.trackEvent(window.ANALYTICS_EVENTS?.CACHE_HIT || 'cache_hit', {
            target_model: targetModel,
            quality_level: qualityLevel
          })
        }
        
        // Show performance info
        console.log(`Optimization completed in ${latency}ms ${response.cached ? '(cached)' : ''}`)
        
        chrome.storage.local.set({ 
          lastPrompt: rawPrompt, 
          lastModel: targetModel,
          lastQuality: qualityLevel,
          lastOptimizationType: optimizationType
        })
      } else {
        setError(response.error || 'Optimization failed')
        
        // Track optimization failure
        window.analytics?.trackEvent(window.ANALYTICS_EVENTS?.OPTIMIZATION_FAILED || 'optimization_failed', {
          target_model: targetModel,
          quality_level: qualityLevel,
          optimization_type: optimizationType,
          error_message: response.error || 'Unknown error',
          optimization_time: latency
        })
      }
    } catch (err) {
      const errorMessage = 'Failed to connect to optimization service'
      setError(errorMessage)
      
      // Track connection failure
      window.analytics?.trackEvent(window.ANALYTICS_EVENTS?.OPTIMIZATION_FAILED || 'optimization_failed', {
        target_model: targetModel,
        quality_level: qualityLevel,
        optimization_type: optimizationType,
        error_message: errorMessage,
        optimization_time: Date.now() - startTime
      })
    } finally {
      setIsOptimizing(false)
      setIsStreaming(false)
    }
  }

  const handleCopy = async () => {
    if (!result) return
    
    await navigator.clipboard.writeText(result.optimizedPrompt)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
    
    // Track copy action
    window.analytics?.trackEvent(window.ANALYTICS_EVENTS?.COPY_TO_CLIPBOARD || 'copy_to_clipboard', {
      target_model: targetModel,
      quality_level: qualityLevel,
      prompt_length: result.optimizedPrompt.length
    })
  }

  const handleReset = () => {
    setRawPrompt('')
    setResult(null)
    setError(null)
  }

  return (
    <div className="popup-container">
      <header className="header">
        <h1>🚀 Promptimizer</h1>
        <p className="subtitle">Optimize prompts for any LLM</p>
      </header>

      <main className="main">
        <div className="controls-row">
          <div className="model-selector">
            <label htmlFor="model">Target Model:</label>
            <select 
              id="model"
              value={targetModel} 
              onChange={(e) => {
                const newModel = e.target.value as TargetModel
                setTargetModel(newModel)
                // Track model change
                window.analytics?.trackEvent(window.ANALYTICS_EVENTS?.MODEL_CHANGED || 'model_changed', {
                  from_model: targetModel,
                  to_model: newModel
                })
              }}
              disabled={isOptimizing}
            >
              <option value="o3-mini">o3-mini (🧠 Reasoning)</option>
              <option value="gpt-4o">GPT-4o</option>
              <option value="claude-3-sonnet">Claude 3 Sonnet</option>
              <option value="gemini-1.5">Gemini 1.5</option>
            </select>
          </div>
          
          <div className="quality-selector">
            <label htmlFor="quality">Quality:</label>
            <select 
              id="quality"
              value={qualityLevel} 
              onChange={(e) => {
                const newQuality = e.target.value as QualityLevel
                setQualityLevel(newQuality)
                // Track quality change
                window.analytics?.trackEvent(window.ANALYTICS_EVENTS?.QUALITY_CHANGED || 'quality_changed', {
                  from_quality: qualityLevel,
                  to_quality: newQuality
                })
              }}
              disabled={isOptimizing}
            >
              <option value="simple">⚡ Simple (Fast)</option>
              <option value="advanced">🎯 Advanced (Detailed)</option>
              <option value="expert">🚀 Expert (Production-Grade)</option>
            </select>
          </div>
          
          <div className="optimization-type-selector">
            <label htmlFor="optimization-type">Mode:</label>
            <select 
              id="optimization-type"
              value={optimizationType} 
              onChange={(e) => {
                const newType = e.target.value as OptimizationType
                setOptimizationType(newType)
                // Track optimization type change
                window.analytics?.trackEvent('optimization_type_changed', {
                  from_type: optimizationType,
                  to_type: newType
                })
              }}
              disabled={isOptimizing}
            >
              <option value="standard">📝 Standard (General Use)</option>
              <option value="agent">🤖 Agent Mode (ChatGPT Agent)</option>
            </select>
          </div>
        </div>

        {!result ? (
          <>
            <div className="input-section">
              <textarea
                value={rawPrompt}
                onChange={(e) => setRawPrompt(e.target.value)}
                placeholder="Paste your prompt here..."
                className="prompt-input"
                disabled={isOptimizing}
                rows={6}
              />
              <div className="char-count">
                {rawPrompt.length} characters
              </div>
            </div>

            {error && (
              <div className="error-message">
                ⚠️ {error}
              </div>
            )}

            <button 
              onClick={handleOptimize}
              disabled={!rawPrompt.trim() || isOptimizing}
              className="optimize-button"
            >
              {isOptimizing ? (
                isStreaming ? (
                  <>⚡ Streaming...</>
                ) : (
                  <>🔄 Processing...</>
                )
              ) : (
                <>✨ Optimize Prompt</>
              )}
            </button>
            
            {/* Show streaming preview */}
            {isStreaming && streamingResult && (
              <div className="streaming-preview">
                <h4>✨ Optimizing in real-time:</h4>
                <div className="streaming-text">
                  <pre>{streamingResult}</pre>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="result-section">
            <div className="result-header">
              <h3>✅ Optimized for {targetModel}</h3>
              <div className="badges">
                <span className={`quality-badge quality-${qualityLevel}`}>{qualityLevel}</span>
                <span className="intent-badge">{result.detectedIntent}</span>
              </div>
            </div>

            <div className="optimized-prompt">
              <pre>{result.optimizedPrompt}</pre>
            </div>

            <div className="metadata">
              <div className="stat">
                <span className="label">Original:</span>
                <span>{result.metadata.originalLength} chars</span>
              </div>
              <div className="stat">
                <span className="label">Optimized:</span>
                <span>{result.metadata.optimizedLength} chars</span>
              </div>
            </div>

            {result.metadata.optimizationTips.length > 0 && (
              <div className="tips">
                <h4>Applied optimizations:</h4>
                <ul>
                  {result.metadata.optimizationTips.map((tip, i) => (
                    <li key={i}>{tip}</li>
                  ))}
                </ul>
              </div>
            )}

            <div className="action-buttons">
              <button onClick={handleCopy} className="copy-button">
                {copied ? '✓ Copied!' : '📋 Copy to Clipboard'}
              </button>
              <button onClick={handleReset} className="reset-button">
                🔄 Try Another
              </button>
            </div>
          </div>
        )}
      </main>

      <footer className="footer">
        <a href="#" onClick={() => {
          chrome.runtime.openOptionsPage()
          // Track settings access
          window.analytics?.trackEvent(window.ANALYTICS_EVENTS?.SETTINGS_OPENED || 'settings_opened', {})
        }}>
          ⚙️ Settings
        </a>
      </footer>
    </div>
  )
}

const root = ReactDOM.createRoot(document.getElementById('root')!)
root.render(<React.StrictMode><App /></React.StrictMode>)