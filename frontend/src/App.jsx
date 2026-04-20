import { useState, useEffect } from 'react'
import BatchAnalysis from './components/BatchAnalysis'
import ResumeAnalyzer from './components/ResumeAnalyzer'
import Toast from './components/Toast'
import { useToast } from './hooks/useToast'

export default function App() {
  const [activeTab, setActiveTab] = useState('batch')
  const [apiKey, setApiKey] = useState('')
  const [isApiActive, setIsApiActive] = useState(false)
  const [tempKey, setTempKey] = useState('')
  
  // Batch Analysis State (Persisted)
  const [batchData, setBatchData] = useState({
    jdText: '',
    csvFile: null,
    csvText: '',
    results: null,
    isLoading: false,
    error: ''
  })
  
  // Resume Analyzer State (Persisted)
  const [resumeData, setResumeData] = useState({
    jdText: '',
    resumeFile: null,
    resumeBase64: '',
    results: null,
    isLoading: false,
    error: ''
  })
  
  // Toast Management
  const { toasts, addToast, removeToast } = useToast()

  // Initialize from localStorage on mount
  useEffect(() => {
    try {
      const savedBatchData = localStorage.getItem('placify_batch_data')
      const savedResumeData = localStorage.getItem('placify_resume_data')
      const savedApiKey = localStorage.getItem('placify_api_key')
      
      if (savedBatchData) {
        const parsed = JSON.parse(savedBatchData)
        // Don't restore loading/error state
        setBatchData(prev => ({
          ...prev,
          jdText: parsed.jdText || '',
          csvText: parsed.csvText || '',
          results: parsed.results,
          isLoading: false,
          error: ''
        }))
      }
      
      if (savedResumeData) {
        const parsed = JSON.parse(savedResumeData)
        setResumeData(prev => ({
          ...prev,
          jdText: parsed.jdText || '',
          resumeBase64: parsed.resumeBase64 || '',
          results: parsed.results,
          isLoading: false,
          error: ''
        }))
      }
      
      if (savedApiKey) {
        setApiKey(savedApiKey)
        setIsApiActive(true)
      }
    } catch (err) {
      console.error('Error loading from localStorage:', err)
    }
  }, [])

  // Persist batch data to localStorage
  useEffect(() => {
    try {
      const dataToPersist = {
        jdText: batchData.jdText,
        csvText: batchData.csvText,
        results: batchData.results
      }
      localStorage.setItem('placify_batch_data', JSON.stringify(dataToPersist))
    } catch (err) {
      console.error('Error saving batch data to localStorage:', err)
    }
  }, [batchData.jdText, batchData.csvText, batchData.results])

  // Persist resume data to localStorage
  useEffect(() => {
    try {
      const dataToPersist = {
        jdText: resumeData.jdText,
        resumeBase64: resumeData.resumeBase64,
        results: resumeData.results
      }
      localStorage.setItem('placify_resume_data', JSON.stringify(dataToPersist))
    } catch (err) {
      console.error('Error saving resume data to localStorage:', err)
    }
  }, [resumeData.jdText, resumeData.resumeBase64, resumeData.results])

  // Persist API key
  useEffect(() => {
    if (isApiActive && apiKey) {
      localStorage.setItem('placify_api_key', apiKey)
    }
  }, [apiKey, isApiActive])

  const handleVerifyApiKey = () => {
    if (tempKey.startsWith('AIza') || tempKey.startsWith('sk-')) {
      setApiKey(tempKey)
      setIsApiActive(true)
      addToast('API Key verified successfully!', {
        type: 'success',
        title: 'Connected',
        duration: 3000
      })
    } else {
      addToast('Please enter a valid API key (starts with "AIza", "sk-ant", or "sk-")', {
        type: 'error',
        title: 'Invalid Key',
        duration: 4000
      })
    }
  }

  const updateBatchData = (updates) => {
    setBatchData(prev => ({ ...prev, ...updates }))
  }

  const updateResumeData = (updates) => {
    setResumeData(prev => ({ ...prev, ...updates }))
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Toast Container */}
      <Toast toasts={toasts} onRemove={removeToast} />

      {/* Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-600 rounded flex items-center justify-center">
                <span className="text-white text-lg font-bold">P</span>
              </div>
              <h1 className="text-2xl font-bold text-gray-900">Placify Intelligence Platform</h1>
            </div>
            <div className="text-sm text-gray-500">v1.0.0</div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar */}
          <aside className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow p-6 space-y-6">
              {/* Logo Section */}
              <div className="border-b pb-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center">
                    <span className="text-white text-sm font-bold">P</span>
                  </div>
                  <span className="font-bold text-lg text-gray-900">Placify</span>
                </div>
                <div className="text-xs text-gray-500">v1.0.0</div>
              </div>

              {/* Authentication Section */}
              <div className="space-y-3">
                <h3 className="font-semibold text-gray-900 text-sm">Authentication</h3>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    API Key (Gemini / OpenAI / Anthropic)
                  </label>
                  <input
                    type="password"
                    value={tempKey}
                    onChange={(e) => setTempKey(e.target.value)}
                    placeholder="Enter API key"
                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <button
                  onClick={handleVerifyApiKey}
                  className="w-full bg-blue-600 text-white px-3 py-2 rounded text-sm font-medium hover:bg-blue-700 transition"
                >
                  Verify API Key
                </button>
                {isApiActive && (
                  <div className="bg-green-50 border border-green-200 rounded p-2 text-center">
                    <span className="text-green-700 text-sm font-medium">✓ API Key Active</span>
                  </div>
                )}
              </div>

              {/* Navigation Section */}
              <div className="border-t pt-4 space-y-2">
                <p className="text-xs font-semibold text-gray-500 uppercase">Navigation</p>
                <button
                  onClick={() => setActiveTab('batch')}
                  className={`w-full text-left px-3 py-2 rounded text-sm font-medium transition ${
                    activeTab === 'batch'
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  📊 Batch Intelligence
                </button>
                <button
                  onClick={() => setActiveTab('resume')}
                  className={`w-full text-left px-3 py-2 rounded text-sm font-medium transition ${
                    activeTab === 'resume'
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  📄 Resume Analyzer
                </button>
              </div>
            </div>
          </aside>

          {/* Content Area */}
          <div className="lg:col-span-3">
            {activeTab === 'batch' && (
              <BatchAnalysis 
                apiKey={apiKey} 
                data={batchData}
                updateData={updateBatchData}
                addToast={addToast}
              />
            )}
            {activeTab === 'resume' && (
              <ResumeAnalyzer 
                apiKey={apiKey} 
                data={resumeData}
                updateData={updateResumeData}
                addToast={addToast}
              />
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
