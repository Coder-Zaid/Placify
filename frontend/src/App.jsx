import { useState, useEffect, Suspense, lazy } from 'react'
import Toast from './components/Toast'
import AuthModal from './components/AuthModal'
import { useToast } from './hooks/useToast'
import { Award, Layers, ShieldCheck, ArrowRight, Settings, X, Lock } from 'lucide-react'
import axios from 'axios'

// Configure global axios base URL to relative or localhost backup
axios.defaults.baseURL = import.meta.env.PROD ? '' : 'http://localhost:8000';

// Configure axios interceptor to attach Bearer token automatically if available
axios.interceptors.request.use((config) => {
  const token = localStorage.getItem('placify_auth_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
}, (error) => {
  return Promise.reject(error)
})

// Lazy loaded modules
const BatchAnalysis = lazy(() => import('./components/BatchAnalysis'))
const ResumeAnalyzer = lazy(() => import('./components/ResumeAnalyzer'))

export default function App() {
  const [activeTab, setActiveTab] = useState('home')
  const [apiKey, setApiKey] = useState('')
  const [isApiActive, setIsApiActive] = useState(false)
  const [tempKey, setTempKey] = useState('')
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  
  // Auth state
  const [isAuthOpen, setIsAuthOpen] = useState(false)
  const [user, setUser] = useState(null)

  // Batch Analysis State
  const [batchData, setBatchData] = useState({
    jdText: '',
    csvFile: null,
    csvText: '',
    results: null,
    isLoading: false,
    error: ''
  })
  
  // Resume Analyzer State
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
      
      const token = localStorage.getItem('placify_auth_token')
      const email = localStorage.getItem('placify_user_email')
      const role = localStorage.getItem('placify_user_role')
      
      if (token && email && role) {
        setUser({ email, role, token })
      }
      
      if (savedBatchData) {
        const parsed = JSON.parse(savedBatchData)
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
        setTempKey(savedApiKey)
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

  // ... rest of useeffects ...
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

  useEffect(() => {
    if (isApiActive && apiKey) {
      localStorage.setItem('placify_api_key', apiKey)
    }
  }, [apiKey, isApiActive])

  const handleVerifyApiKey = () => {
    const cleanKey = tempKey.trim()
    if (cleanKey.startsWith('AIza') || cleanKey.startsWith('sk-') || cleanKey.startsWith('gsk_')) {
      setApiKey(cleanKey)
      setIsApiActive(true)
      setIsSettingsOpen(false)
      addToast('API Key configuration loaded successfully!', {
        type: 'success',
        title: 'Authentication Loaded',
        duration: 3000
      })
    } else {
      addToast('Please enter a valid key (starts with "AIza", "sk-", or "gsk_")', {
        type: 'error',
        title: 'Authentication Error',
        duration: 4000
      })
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('placify_auth_token')
    localStorage.removeItem('placify_user_email')
    localStorage.removeItem('placify_user_role')
    setUser(null)
    setActiveTab('home')
    addToast('Successfully signed out of the platform.', {
      type: 'info',
      title: 'Signed Out'
    })
  }

  const updateBatchData = (updates) => {
    setBatchData(prev => ({ ...prev, ...updates }))
  }

  const updateResumeData = (updates) => {
    setResumeData(prev => ({ ...prev, ...updates }))
  }

  // Helper check for tabs
  const handleTabChange = (tabName) => {
    if (tabName === 'home') {
      setActiveTab('home')
      return
    }

    if (!user) {
      setIsAuthOpen(true)
      addToast('Authentication required to access analysis modules.', {
        type: 'info',
        title: 'Access Restricted'
      })
      return
    }

    if (tabName === 'batch' && user.role !== 'admin') {
      addToast('Institution role required to access Batch Eligibility scoring.', {
        type: 'error',
        title: 'Unauthorized Action'
      })
      return
    }

    setActiveTab(tabName)
  }

  return (
    <div className="min-h-screen bg-[#FAFAF8] text-[#0F0F11] font-display antialiased">
      {/* Toast Container */}
      <Toast toasts={toasts} onRemove={removeToast} />

      {/* Auth Modal */}
      <AuthModal 
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onAuthSuccess={setUser}
        addToast={addToast}
      />

      {/* Header */}
      <header className="border-b border-[#0F0F11]/10 bg-white sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-8 py-5 flex items-center justify-between">
          <button 
            onClick={() => handleTabChange('home')}
            className="flex items-center gap-4 text-left focus:outline-none"
          >
            <div className="w-10 h-10 bg-[#0F0F11] rounded-[10px] flex items-center justify-center hover-scale">
              <span className="text-[#FAFAF8] text-lg font-medium">P</span>
            </div>
            <div>
              <h1 className="text-xl font-medium tracking-tight text-[#0F0F11]">Placify</h1>
              <p className="text-xs text-[#6F6F75]">Placement intelligence system</p>
            </div>
          </button>
          
          <div className="flex items-center gap-6">
            <button 
              onClick={() => handleTabChange('home')}
              className={`text-sm font-medium transition-colors ${activeTab === 'home' ? 'text-[#0F0F11]' : 'text-[#6F6F75] hover:text-[#0F0F11]'}`}
            >
              Home
            </button>
            <button 
              onClick={() => handleTabChange('batch')}
              className={`text-sm font-medium transition-colors flex items-center gap-1 ${activeTab === 'batch' ? 'text-[#0F0F11]' : 'text-[#6F6F75] hover:text-[#0F0F11]'}`}
            >
              {!user && <Lock className="h-3 w-3 text-[#A8A8AE]" />}
              Batch Analysis
            </button>
            <button 
              onClick={() => handleTabChange('resume')}
              className={`text-sm font-medium transition-colors flex items-center gap-1 ${activeTab === 'resume' ? 'text-[#0F0F11]' : 'text-[#6F6F75] hover:text-[#0F0F11]'}`}
            >
              {!user && <Lock className="h-3 w-3 text-[#A8A8AE]" />}
              Resume Screening
            </button>
            
            {user ? (
              <div className="flex items-center gap-4 border-l border-[#0F0F11]/10 pl-6">
                <span className="text-xs font-mono text-[#6F6F75]">{user.email} ({user.role})</span>
                <button 
                  onClick={handleLogout}
                  className="text-xs font-medium text-[#0F0F11] hover:underline"
                >
                  Logout
                </button>
              </div>
            ) : (
              <button 
                onClick={() => setIsAuthOpen(true)}
                className="btn-outline py-2 px-4 text-xs hover-scale"
              >
                Sign In
              </button>
            )}

            {/* Cogwheel Settings Toggle */}
            <button 
              onClick={() => setIsSettingsOpen(true)}
              className="text-[#6F6F75] hover:text-[#0F0F11] transition-colors p-1.5 focus:outline-none rounded-full hover:bg-[#0F0F11]/5"
              title="API Key Configuration"
            >
              <Settings className="h-5 w-5 stroke-[1.5] animate-spin-hover" />
            </button>
          </div>
        </div>
      </header>

      {/* Settings Modal */}
      {isSettingsOpen && (
        <div className="fixed inset-0 bg-[#0F0F11]/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div 
            className="bg-white border border-[#0F0F11]/10 rounded-[16px] max-w-lg w-full p-8 space-y-6 shadow-2xl relative"
            style={{ animation: 'slideIn 0.24s cubic-bezier(0.4, 0, 0.2, 1)' }}
          >
            <button 
              onClick={() => setIsSettingsOpen(false)}
              className="absolute top-6 right-6 text-[#6F6F75] hover:text-[#0F0F11] transition-colors"
            >
              <X className="h-5 w-5 stroke-[1.5]" />
            </button>
            
            <div className="space-y-1">
              <h3 className="text-xl font-medium tracking-tight">API Key Configuration</h3>
              <p className="text-sm text-[#6F6F75]">Select your engine key provider context below.</p>
            </div>

            <div className="space-y-4">
              <label className="block text-xs font-mono text-[#A8A8AE] uppercase tracking-wider">Configure Provider Credentials</label>
              <input
                type="password"
                value={tempKey}
                onChange={(e) => setTempKey(e.target.value)}
                placeholder="Enter Groq (gsk_...), Gemini (AIza...), or OpenAI (sk-...) API key"
                className="w-full bg-[#FAFAF8] border border-[#A8A8AE] rounded-[10px] px-4 py-3 text-sm focus:outline-none focus:border-[#0F0F11] font-mono"
              />
              <button
                onClick={handleVerifyApiKey}
                className="btn-primary w-full py-3"
              >
                Apply Configuration
              </button>
            </div>

            {isApiActive && (
              <div className="flex items-center justify-center gap-2 border border-[#0F0F11]/10 bg-[#FAFAF8] rounded-[10px] py-3">
                <ShieldCheck className="h-4 w-4 text-[#0F0F11]" />
                <span className="text-xs font-mono">Loaded key prefix: {apiKey.substring(0, 8)}...</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-8 py-16">
        {activeTab === 'home' ? (
          /* Premium Monochrome Landing Page */
          <div className="space-y-24">
            {/* Hero Section */}
            <div className="max-w-4xl space-y-8 pt-8">
              <span className="font-mono text-xs uppercase tracking-widest text-[#6F6F75]">Omni-Provider Framework</span>
              <h1 className="text-6xl font-medium tracking-tight leading-[1.1] text-[#0F0F11]">
                Redefining candidate vetting with unified intelligence models.
              </h1>
              <p className="text-lg text-[#6F6F75] leading-relaxed max-w-2xl">
                Placify applies mathematical criteria weightings and deep semantic matching to place candidates against rigorous job requirements. Now compatible with Groq, Gemini, and OpenAI.
              </p>
              
              <div className="flex flex-wrap gap-4 pt-4">
                <button 
                  onClick={() => handleTabChange('batch')}
                  className="btn-primary hover-scale"
                >
                  Analyze Student Batch
                </button>
                <button 
                  onClick={() => handleTabChange('resume')}
                  className="btn-secondary hover-scale"
                >
                  Screen Single Resume
                </button>
              </div>
            </div>

            {/* Providers Ribbon */}
            <div className="border-y border-[#0F0F11]/10 py-8 flex flex-wrap justify-between items-center gap-6">
              <span className="font-mono text-xs text-[#A8A8AE] uppercase tracking-widest">Supported Engines</span>
              <div className="flex flex-wrap gap-8 items-center font-mono text-sm text-[#6F6F75]">
                <span>Groq LLaMA</span>
                <span className="text-[#A8A8AE]">/</span>
                <span>Google Gemini</span>
                <span className="text-[#A8A8AE]">/</span>
                <span>OpenAI GPT</span>
                <span className="text-[#A8A8AE]">/</span>
                <span>Anthropic Claude</span>
              </div>
            </div>

            {/* Service Advertising Cards */}
            <div className="space-y-8">
              <div className="space-y-2">
                <h2 className="text-3xl font-medium tracking-tight">Our Core Evaluation Modules</h2>
                <p className="text-sm text-[#6F6F75]">Perform high-throughput batch criteria sorting or evaluate deep semantic matches.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Module 1: Batch Analysis */}
                <div className="q-card flex flex-col justify-between h-[320px] hover:border-[#0F0F11]/30 transition-all cursor-pointer hover-scale" onClick={() => handleTabChange('batch')}>
                  <div className="space-y-6">
                    <div className="w-12 h-12 rounded-[10px] border border-[#0F0F11]/15 flex items-center justify-center">
                      <Layers className="h-5 w-5 text-[#0F0F11] stroke-[1.5]" />
                    </div>
                    <div className="space-y-2">
                      <h3 className="text-xl font-medium">Batch Placement Eligibility</h3>
                      <p className="text-sm text-[#6F6F75] leading-relaxed">
                        Import institutional CSV matrices containing student scores, CGPA, and portfolio statistics. Instantly process gate criteria constraints and rank portfolios mathematically.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-sm font-medium">
                    Open Batch Dashboard <ArrowRight className="h-4 w-4 stroke-[1.5]" />
                  </div>
                </div>

                {/* Module 2: Single Resume Analysis */}
                <div className="q-card flex flex-col justify-between h-[320px] hover:border-[#0F0F11]/30 transition-all cursor-pointer hover-scale" onClick={() => handleTabChange('resume')}>
                  <div className="space-y-6">
                    <div className="w-12 h-12 rounded-[10px] border border-[#0F0F11]/15 flex items-center justify-center">
                      <Award className="h-5 w-5 text-[#0F0F11] stroke-[1.5]" />
                    </div>
                    <div className="space-y-2">
                      <h3 className="text-xl font-medium">Single Candidate Screening</h3>
                      <p className="text-sm text-[#6F6F75] leading-relaxed">
                        Upload standard candidate PDFs to extract skill sets. Analyze strengths, domain suitability, missing requirements, and growth trajectory with precise recruiter narratives.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-sm font-medium">
                    Open Screening Console <ArrowRight className="h-4 w-4 stroke-[1.5]" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Lazy Loaded Services Context */
          <div className="space-y-8">
            <Suspense fallback={
              <div className="h-96 flex flex-col items-center justify-center space-y-4">
                <div className="w-12 h-12 rounded-[10px] border border-[#0F0F11]/20 flex items-center justify-center animate-pulse-soft">
                  <div className="w-6 h-6 border-2 border-[#0F0F11] border-t-transparent rounded-full animate-spin"></div>
                </div>
                <p className="text-xs font-mono text-[#6F6F75] uppercase tracking-wider animate-pulse-soft">Loading module components...</p>
              </div>
            }>
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
            </Suspense>
          </div>
        )}
      </main>
    </div>
  )
}
