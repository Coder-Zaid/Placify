import { useState, useEffect, Suspense, lazy } from 'react'
import Toast from './components/Toast'
import AuthModal from './components/AuthModal'
import DrawingCanvas3D from './components/DrawingCanvas3D'
import { useToast } from './hooks/useToast'
import { Award, Layers, ShieldCheck, ArrowRight, Settings, X, Lock, CheckSquare, Sparkles } from 'lucide-react'
import axios from 'axios'
import { gsap } from 'gsap'

// Configure global axios base URL
axios.defaults.baseURL = import.meta.env.PROD ? '' : 'http://localhost:8000';

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
const CohortAnalytics = lazy(() => import('./components/CohortAnalytics'))
const InterviewModule = lazy(() => import('./components/InterviewModule'))

export default function App() {
  const [activeTab, setActiveTab] = useState('home')
  const [apiKey, setApiKey] = useState('')
  const [isApiActive, setIsApiActive] = useState(false)
  const [tempKey, setTempKey] = useState('')
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  
  // Auth state
  const [isAuthOpen, setIsAuthOpen] = useState(false)
  const [user, setUser] = useState(null)

  // Saved results state for Cohort Dashboard mapping
  const [cohortResults, setCohortResults] = useState([])

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
  
  const { toasts, addToast, removeToast } = useToast()

  // Initialize from localStorage
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
        if (parsed.results && parsed.results.results) {
          setCohortResults(parsed.results.results)
        }
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

  // GSAP scroll anim for floating pencils morphing into CTA
  useEffect(() => {
    if (activeTab !== 'home') return

    // Setup animated scroll triggers
    const handleScroll = () => {
      const scrollY = window.scrollY
      const maxScroll = 400
      const progress = Math.min(1, scrollY / maxScroll)

      // Move pencil 1 and 2 to merge into the CTA wrapper
      gsap.to('.floating-pencil-1', {
        x: progress * 180,
        y: progress * 320,
        rotation: progress * 360,
        opacity: 1 - progress * 0.7,
        scale: 1 - progress * 0.4,
        duration: 0.1
      })

      gsap.to('.floating-pencil-2', {
        x: -progress * 180,
        y: progress * 320,
        rotation: -progress * 360,
        opacity: 1 - progress * 0.7,
        scale: 1 - progress * 0.4,
        duration: 0.1
      })

      // Morphing target highlight pulse
      if (progress >= 0.95) {
        gsap.to('.cta-button-target', {
          scale: 1.05,
          borderColor: '#0F0F11',
          backgroundColor: '#0F0F11',
          color: '#FAFAF8',
          duration: 0.2
        })
      } else {
        gsap.to('.cta-button-target', {
          scale: 1,
          borderColor: 'rgba(15, 15, 17, 0.16)',
          backgroundColor: 'transparent',
          color: '#0F0F11',
          duration: 0.2
        })
      }
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [activeTab])

  // Persist batch data and update local cohort results
  useEffect(() => {
    try {
      const dataToPersist = {
        jdText: batchData.jdText,
        csvText: batchData.csvText,
        results: batchData.results
      }
      localStorage.setItem('placify_batch_data', JSON.stringify(dataToPersist))
      if (batchData.results && batchData.results.results) {
        setCohortResults(batchData.results.results)
      }
    } catch (err) {
      console.error('Error saving batch data:', err)
    }
  }, [batchData.jdText, batchData.csvText, batchData.results])

  // Persist resume data
  useEffect(() => {
    try {
      const dataToPersist = {
        jdText: resumeData.jdText,
        resumeBase64: resumeData.resumeBase64,
        results: resumeData.results
      }
      localStorage.setItem('placify_resume_data', JSON.stringify(dataToPersist))
    } catch (err) {
      console.error('Error saving resume data:', err)
    }
  }, [resumeData.jdText, resumeData.resumeBase64, resumeData.results])

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

  const updateBatchData = (updates) => {
    setBatchData(prev => ({ ...prev, ...updates }))
  }

  const updateResumeData = (updates) => {
    setResumeData(prev => ({ ...prev, ...updates }))
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
            <button 
              onClick={() => handleTabChange('cohort')}
              className={`text-sm font-medium transition-colors flex items-center gap-1 ${activeTab === 'cohort' ? 'text-[#0F0F11]' : 'text-[#6F6F75] hover:text-[#0F0F11]'}`}
            >
              {!user && <Lock className="h-3 w-3 text-[#A8A8AE]" />}
              Cohort Dashboard
            </button>
            <button 
              onClick={() => handleTabChange('interview')}
              className={`text-sm font-medium transition-colors flex items-center gap-1 ${activeTab === 'interview' ? 'text-[#0F0F11]' : 'text-[#6F6F75] hover:text-[#0F0F11]'}`}
            >
              {!user && <Lock className="h-3 w-3 text-[#A8A8AE]" />}
              Mock Practice
            </button>
            
            {user ? (
              <div className="flex items-center gap-4 border-l border-[#0F0F11]/10 pl-6">
                <span className="text-xs font-mono text-[#6F6F75]">{user.email}</span>
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

            <button 
              onClick={() => setIsSettingsOpen(true)}
              className="text-[#6F6F75] hover:text-[#0F0F11] transition-colors p-1.5 focus:outline-none rounded-full hover:bg-[#0F0F11]/5"
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
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-8 py-16">
        {activeTab === 'home' ? (
          /* Landing Page with GSAP Pencil Morph CTA and 3D Canvas Elements */
          <div className="space-y-32 relative">
            
            {/* Absolute positioning pencils for scroll CTA alignment */}
            <div className="hidden lg:block absolute left-[-60px] top-[140px] floating-pencil-1 z-10 pointer-events-none">
              <DrawingCanvas3D type="pencil" width={100} height={100} isInteractive={false} />
            </div>
            <div className="hidden lg:block absolute right-[-60px] top-[140px] floating-pencil-2 z-10 pointer-events-none">
              <DrawingCanvas3D type="pencil" width={100} height={100} isInteractive={false} />
            </div>

            {/* Hero Section */}
            <div className="max-w-4xl space-y-8 pt-8">
              <span className="font-mono text-xs uppercase tracking-widest text-[#6F6F75] flex items-center gap-1.5">
                <Sparkles className="h-3 w-3 stroke-[1.5] animate-pulse-soft" />
                Next Generation 3D Student Platform
              </span>
              <h1 className="text-6xl font-medium tracking-tight leading-[1.1] text-[#0F0F11]">
                Redefining candidate vetting with unified intelligence models.
              </h1>
              <p className="text-lg text-[#6F6F75] leading-relaxed max-w-2xl">
                Placify applies mathematical criteria weightings and deep semantic matching to place candidates against rigorous job requirements. Scroll down to assemble your pencil tools.
              </p>
              
              {/* Morph Target Scroll Action */}
              <div className="pt-8">
                <button 
                  onClick={() => handleTabChange('resume')}
                  className="btn-outline text-lg font-medium px-8 py-4 border-2 cta-button-target hover-scale"
                >
                  Configure My Placement Tools
                </button>
              </div>
            </div>

            {/* Interactive 3D School & College Stuff Grid */}
            <div className="space-y-8 pt-12">
              <div className="space-y-2">
                <h3 className="text-sm font-mono uppercase tracking-widest text-[#A8A8AE]">3D Wireframe Desk Tools</h3>
                <h2 className="text-3xl font-medium tracking-tight text-[#0F0F11]">Hover to rotate your college gear</h2>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="q-card hover-scale flex flex-col items-center p-8 space-y-4">
                  <DrawingCanvas3D type="pencil" width={140} height={140} isInteractive={true} />
                  <div className="text-center">
                    <h4 className="font-medium text-base">Architect Pencil</h4>
                    <p className="text-xs text-[#6F6F75] mt-1">Represents writing code logic algorithms</p>
                  </div>
                </div>

                <div className="q-card hover-scale flex flex-col items-center p-8 space-y-4">
                  <DrawingCanvas3D type="book" width={140} height={140} isInteractive={true} />
                  <div className="text-center">
                    <h4 className="font-medium text-base">Design Notebook</h4>
                    <p className="text-xs text-[#6F6F75] mt-1">Database normalization guidelines</p>
                  </div>
                </div>

                <div className="q-card hover-scale flex flex-col items-center p-8 space-y-4">
                  <DrawingCanvas3D type="cap" width={140} height={140} isInteractive={true} />
                  <div className="text-center">
                    <h4 className="font-medium text-base">Graduation Cap</h4>
                    <p className="text-xs text-[#6F6F75] mt-1">Cohort readiness criteria gates</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Services Cards */}
            <div className="space-y-8">
              <div className="space-y-2">
                <h2 className="text-3xl font-medium tracking-tight">Our Core Evaluation Modules</h2>
                <p className="text-sm text-[#6F6F75]">Perform high-throughput batch criteria sorting or evaluate deep semantic matches.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
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
              {activeTab === 'cohort' && (
                <CohortAnalytics 
                  results={cohortResults}
                />
              )}
              {activeTab === 'interview' && (
                <InterviewModule 
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
