import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Save, Eye, EyeOff, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react'
import axios from 'axios'

export default function SettingsPage() {
  const navigate = useNavigate()
  const [apiKeys, setApiKeys] = useState({
    GEMINI_API_KEY: '',
    OPENAI_API_KEY: '',
    GROQ_API_KEY: '',
    ANTHROPIC_API_KEY: '',
    CUSTOM_API_KEY: ''
  })
  
  const [showKeys, setShowKeys] = useState({})
  const [loading, setLoading] = useState({})
  const [validationStatus, setValidationStatus] = useState({})

  const providers = [
    {
      id: 'GEMINI_API_KEY',
      name: 'Google Gemini',
      providerId: 'gemini',
      description: 'Primary model for analysis and evaluation. Get from Google AI Studio.',
      placeholder: 'AIzaSyD...'
    },
    {
      id: 'GROQ_API_KEY',
      name: 'Groq (Llama 3)',
      providerId: 'groq',
      description: 'Used for blazing fast audio transcription via Whisper.',
      placeholder: 'gsk_...'
    },
    {
      id: 'OPENAI_API_KEY',
      name: 'OpenAI GPT',
      providerId: 'openai',
      description: 'Alternative LLM provider for text generation.',
      placeholder: 'sk-...'
    },
    {
      id: 'ANTHROPIC_API_KEY',
      name: 'Anthropic Claude',
      providerId: 'anthropic',
      description: 'Alternative LLM provider for complex reasoning.',
      placeholder: 'sk-ant-...'
    },
    {
      id: 'CUSTOM_API_KEY',
      name: 'Custom API Key',
      providerId: 'custom',
      description: 'For third-party endpoints or local model runners.',
      placeholder: 'your_custom_key'
    }
  ]

  useEffect(() => {
    const stored = localStorage.getItem('placify_api_keys')
    if (stored) {
      try {
        const parsed = JSON.parse(stored)
        setApiKeys(prev => ({ ...prev, ...parsed }))
      } catch (e) {
        console.error('Failed to parse stored API keys')
      }
    }
  }, [])

  const handleKeyChange = (providerId, value) => {
    setApiKeys(prev => ({
      ...prev,
      [providerId]: value
    }))
    // Clear validation status if key changes
    setValidationStatus(prev => ({
      ...prev,
      [providerId]: null
    }))
  }

  const toggleShowKey = (providerId) => {
    setShowKeys(prev => ({
      ...prev,
      [providerId]: !prev[providerId]
    }))
  }

  const handleVerifyAndSave = async (providerKey, providerId) => {
    const keyValue = apiKeys[providerKey]?.trim()
    if (!keyValue) {
      setValidationStatus(prev => ({
        ...prev,
        [providerKey]: { valid: false, message: 'API key cannot be empty' }
      }))
      return
    }

    setLoading(prev => ({ ...prev, [providerKey]: true }))
    setValidationStatus(prev => ({ ...prev, [providerKey]: null }))

    try {
      const res = await axios.post('/analyze/interview-studio/validate-key', {
        provider: providerId,
        api_key: keyValue
      })

      if (res.data?.valid) {
        // Save to localStorage
        const currentStored = JSON.parse(localStorage.getItem('placify_api_keys') || '{}')
        currentStored[providerKey] = keyValue
        localStorage.setItem('placify_api_keys', JSON.stringify(currentStored))
        
        setValidationStatus(prev => ({
          ...prev,
          [providerKey]: { valid: true, message: 'Connection successful' }
        }))
      } else {
        setValidationStatus(prev => ({
          ...prev,
          [providerKey]: { valid: false, message: res.data?.message || 'Verification failed' }
        }))
      }
    } catch (err) {
      setValidationStatus(prev => ({
        ...prev,
        [providerKey]: { valid: false, message: err.response?.data?.detail || 'Network verification error' }
      }))
    } finally {
      setLoading(prev => ({ ...prev, [providerKey]: false }))
    }
  }

  const handleClearKey = (providerKey) => {
    const currentStored = JSON.parse(localStorage.getItem('placify_api_keys') || '{}')
    delete currentStored[providerKey]
    localStorage.setItem('placify_api_keys', JSON.stringify(currentStored))
    
    setApiKeys(prev => ({ ...prev, [providerKey]: '' }))
    setValidationStatus(prev => ({ ...prev, [providerKey]: null }))
  }

  return (
    <div className="min-h-screen bg-[#FAF7F0] text-[#111] font-sans antialiased">
      {/* Header */}
      <header className="fixed top-0 w-full z-50 bg-[#FAF7F0]/80 backdrop-blur-md border-b border-black/5">
        <div className="max-w-4xl mx-auto px-6 h-20 flex items-center justify-between">
          <button 
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-sm font-medium text-[#555] hover:text-black transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>
          <span className="font-bold text-lg tracking-tight">System Settings</span>
          <div className="w-8"></div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-4xl mx-auto px-6 pt-32 pb-24">
        <div className="space-y-4 mb-12">
          <h1 className="text-4xl font-bold tracking-tight">API Configuration</h1>
          <p className="text-sm text-[#666] max-w-xl">
            Configure integration keys for your LLM and transcription services. Keys are saved securely inside your browser's local storage and used directly to interact with AI APIs.
          </p>
        </div>

        {/* Key Configuration Cards */}
        <div className="space-y-6">
          {providers.map((p) => {
            const status = validationStatus[p.id]
            const isKeyLoading = loading[p.id]
            const isVisible = showKeys[p.id]

            return (
              <div 
                key={p.id}
                className="bg-white border border-black/5 rounded-2xl p-6 transition-shadow hover:shadow-sm flex flex-col md:flex-row md:items-start justify-between gap-6"
              >
                <div className="flex-1 space-y-1">
                  <h3 className="font-semibold text-lg text-[#111]">{p.name}</h3>
                  <p className="text-xs text-[#666] leading-relaxed max-w-md">{p.description}</p>
                  
                  {/* Status Banner */}
                  {status && (
                    <div className={`mt-3 flex items-center gap-2 text-xs font-medium py-2 px-3 rounded-lg w-fit ${
                      status.valid ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'
                    }`}>
                      {status.valid ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertCircle className="w-3.5 h-3.5" />}
                      {status.message}
                    </div>
                  )}
                </div>

                <div className="w-full md:w-96 space-y-3">
                  <div className="relative flex items-center">
                    <input
                      type={isVisible ? 'text' : 'password'}
                      value={apiKeys[p.id] || ''}
                      onChange={(e) => handleKeyChange(p.id, e.target.value)}
                      placeholder={p.placeholder}
                      className="w-full bg-[#FAF7F0] border border-black/5 rounded-xl px-4 py-3 pr-12 text-sm focus:outline-none focus:border-black/20 font-mono transition-colors"
                    />
                    <button
                      type="button"
                      onClick={() => toggleShowKey(p.id)}
                      className="absolute right-4 text-[#888] hover:text-black transition-colors"
                    >
                      {isVisible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>

                  <div className="flex gap-2 justify-end">
                    {apiKeys[p.id] && (
                      <button
                        onClick={() => handleClearKey(p.id)}
                        className="px-4 py-2.5 text-xs font-semibold text-[#888] hover:text-red-600 transition-colors border border-transparent hover:border-red-100 rounded-xl"
                      >
                        Clear
                      </button>
                    )}
                    <button
                      onClick={() => handleVerifyAndSave(p.id, p.providerId)}
                      disabled={isKeyLoading}
                      className="btn-primary px-4 py-2.5 text-xs font-semibold rounded-xl flex items-center gap-2 hover:scale-[1.02] active:scale-98 transition-all disabled:opacity-50"
                    >
                      {isKeyLoading ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          Authenticating
                        </>
                      ) : (
                        <>
                          <Save className="w-3.5 h-3.5" />
                          Verify & Save
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </main>
    </div>
  )
}
