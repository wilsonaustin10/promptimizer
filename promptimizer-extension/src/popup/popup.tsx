import React, { useState, useEffect } from 'react'
import ReactDOM from 'react-dom/client'
import './popup.css'

type TargetModel = 'gpt-4o' | 'claude-3-sonnet' | 'gemini-1.5' | 'o3-mini'
type QualityLevel = 'simple' | 'advanced'

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
  const [qualityLevel, setQualityLevel] = useState<QualityLevel>('advanced')
  const [isOptimizing, setIsOptimizing] = useState(false)
  const [result, setResult] = useState<OptimizationResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [streamingResult, setStreamingResult] = useState('')
  const [isStreaming, setIsStreaming] = useState(false)

  useEffect(() => {
    chrome.storage.local.get(['lastPrompt', 'lastModel', 'lastQuality'], (data) => {
      if (data.lastPrompt) setRawPrompt(data.lastPrompt)
      if (data.lastModel) setTargetModel(data.lastModel)
      if (data.lastQuality) setQualityLevel(data.lastQuality)
    })

    // Listen for streaming progress
    const handleMessage = (message: any) => {
      if (message.action === 'optimizationProgress') {
        setIsStreaming(true)
        setStreamingResult(message.data.partialResult)
      }
    }

    chrome.runtime.onMessage.addListener(handleMessage)
    return () => chrome.runtime.onMessage.removeListener(handleMessage)
  }, [])

  const handleOptimize = async () => {
    if (!rawPrompt.trim()) return

    setIsOptimizing(true)
    setError(null)
    setResult(null)
    setStreamingResult('')
    setIsStreaming(false)

    const startTime = Date.now()

    try {
      const response = await chrome.runtime.sendMessage({
        action: 'optimizePrompt',
        data: { rawPrompt, targetModel, qualityLevel }
      })

      const latency = Date.now() - startTime

      if (response.success) {
        setResult(response.data)
        setIsStreaming(false)
        setStreamingResult('')
        
        // Show performance info
        console.log(`Optimization completed in ${latency}ms ${response.cached ? '(cached)' : ''}`)
        
        chrome.storage.local.set({ 
          lastPrompt: rawPrompt, 
          lastModel: targetModel,
          lastQuality: qualityLevel
        })
      } else {
        setError(response.error || 'Optimization failed')
      }
    } catch (err) {
      setError('Failed to connect to optimization service')
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
              onChange={(e) => setTargetModel(e.target.value as TargetModel)}
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
              onChange={(e) => setQualityLevel(e.target.value as QualityLevel)}
              disabled={isOptimizing}
            >
              <option value="simple">⚡ Simple (Fast)</option>
              <option value="advanced">🎯 Advanced (Detailed)</option>
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
        <a href="#" onClick={() => chrome.runtime.openOptionsPage()}>
          ⚙️ Settings
        </a>
      </footer>
    </div>
  )
}

const root = ReactDOM.createRoot(document.getElementById('root')!)
root.render(<React.StrictMode><App /></React.StrictMode>)