import { useState, useEffect, useRef, Suspense, lazy } from 'react'
import { motion } from 'framer-motion'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import axios from 'axios'
import { ArrowRight, Play, Settings, Lock, Sparkles, BookOpen, Code2, Award, Briefcase } from 'lucide-react'

import SmoothScroll from './components/SmoothScroll'
import Scene3D from './components/Scene3D'
import Toast from './components/Toast'
import AuthModal from './components/AuthModal'
import { useToast } from './hooks/useToast'

gsap.registerPlugin(ScrollTrigger)

// Lazy loaded modules
const BatchAnalysis = lazy(() => import('./components/BatchAnalysis'))
const ResumeAnalyzer = lazy(() => import('./components/ResumeAnalyzer'))
const InterviewModule = lazy(() => import('./components/InterviewModule'))

// Configure global axios
axios.defaults.baseURL = import.meta.env.PROD ? '' : 'http://localhost:8000';
axios.interceptors.request.use((config) => {
  const token = localStorage.getItem('placify_auth_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

export default function App() {
  const mainRef = useRef(null)
  
  // State
  const [user, setUser] = useState(null)
  const [isAuthOpen, setIsAuthOpen] = useState(false)
  const { toasts, addToast, removeToast } = useToast()
  
  // Data State for modules
  const [resumeData, setResumeData] = useState({ jdText: '', resumeFile: null, resumeBase64: '', results: null, isLoading: false, error: '' })

  useEffect(() => {
    // Auth Check
    const token = localStorage.getItem('placify_auth_token')
    const email = localStorage.getItem('placify_user_email')
    const role = localStorage.getItem('placify_user_role')
    if (token && email && role) setUser({ email, role, token })

    // Setup GSAP Animations
    const ctx = gsap.context(() => {
      // Fade in sections on scroll
      gsap.utils.toArray('.reveal-section').forEach((section) => {
        gsap.fromTo(section, 
          { opacity: 0, y: 50 },
          { 
            opacity: 1, 
            y: 0, 
            duration: 1, 
            ease: 'power3.out',
            scrollTrigger: {
              trigger: section,
              start: 'top 80%',
              end: 'top 50%',
              scrub: 1
            }
          }
        )
      })

      // The Narrative Pencil Line (Scroll Progress)
      gsap.to('.progress-line-fill', {
        height: '100%',
        ease: 'none',
        scrollTrigger: {
          trigger: '.narrative-container',
          start: 'top top',
          end: 'bottom bottom',
          scrub: 0.3
        }
      })
    }, mainRef)

    return () => ctx.revert()
  }, [])

  return (
    <SmoothScroll>
      <div ref={mainRef} className="min-h-screen relative font-display selection:bg-[#0F62FE] selection:text-white">
        <Toast toasts={toasts} onRemove={removeToast} />
        <AuthModal isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} onAuthSuccess={setUser} addToast={addToast} />

        {/* Global Progress Line connecting the story */}
        <div className="fixed left-8 md:left-16 top-0 bottom-0 w-[2px] bg-black/5 z-40 hidden md:block">
          <div className="progress-line-fill w-full bg-[#111111] h-0 origin-top"></div>
        </div>

        {/* Premium Header */}
        <header className="fixed top-0 w-full z-50 glass-panel border-b-0 border-white/10">
          <div className="max-w-7xl mx-auto px-6 md:px-16 h-20 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[#111111] rounded-2xl flex items-center justify-center">
                <span className="text-white font-medium text-lg">P</span>
              </div>
              <span className="font-semibold text-lg tracking-tight">Placify.</span>
            </div>
            
            <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-[#666666]">
              <a href="#journey" className="hover:text-[#111111] transition-colors">The Journey</a>
              <a href="#intelligence" className="hover:text-[#111111] transition-colors">Intelligence</a>
              <a href="#practice" className="hover:text-[#111111] transition-colors">Practice</a>
            </nav>

            <div className="flex items-center gap-4">
              {user ? (
                <span className="text-sm font-medium">{user.email}</span>
              ) : (
                <button onClick={() => setIsAuthOpen(true)} className="btn-secondary text-sm px-5 py-2.5">
                  Sign In
                </button>
              )}
            </div>
          </div>
        </header>

        {/* --- SECTION 1: HERO (The Beginning) --- */}
        <section className="relative h-screen flex items-center justify-center overflow-hidden">
          {/* 3D Scene Background */}
          <Scene3D type="hero" />
          
          <div className="relative z-10 text-center px-6 max-w-5xl mx-auto pt-20 pointer-events-none">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
              className="space-y-6"
            >
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/50 backdrop-blur-md border border-black/5 text-sm font-medium text-[#666666] shadow-sm">
                <Sparkles className="w-4 h-4 text-[#0F62FE]" />
                <span>The Journey From Classroom to Career.</span>
              </div>
              
              <h1 className="text-6xl md:text-8xl font-medium tracking-tight text-balance leading-[1.05]">
                Everything you need before your <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#111111] to-[#666666]">first offer letter.</span>
              </h1>
              
              <p className="text-xl text-[#666666] max-w-2xl mx-auto text-balance">
                Placify is not just a portal. It's an intelligent companion that guides you from writing your first line of code to signing your first contract.
              </p>
            </motion.div>
          </div>
          
          {/* Scroll Indicator */}
          <div className="absolute bottom-12 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 animate-bounce">
            <span className="text-xs font-mono uppercase tracking-widest text-[#666666]">Scroll to Begin</span>
            <div className="w-[1px] h-12 bg-gradient-to-b from-[#111111] to-transparent"></div>
          </div>
        </section>

        <div className="narrative-container pb-32">
          
          {/* --- SECTION 2: SCHOOL & BASICS --- */}
          <section id="journey" className="min-h-screen flex items-center py-24 relative z-10">
            <div className="max-w-7xl mx-auto px-6 md:px-32 w-full grid md:grid-cols-2 gap-16 items-center reveal-section">
              <div className="space-y-8">
                <div className="w-16 h-16 rounded-2xl bg-[#FAF9F7] border border-black/5 shadow-sm flex items-center justify-center">
                  <BookOpen className="w-8 h-8 text-[#111111] stroke-[1.5]" />
                </div>
                <div className="space-y-4">
                  <h2 className="text-4xl md:text-5xl font-medium tracking-tight">Every expert once struggled with the basics.</h2>
                  <p className="text-lg text-[#666666] leading-relaxed">
                    It starts with algorithms, data structures, and late nights trying to center a div. The foundation is built here.
                  </p>
                </div>
              </div>
              <div className="aspect-square bg-white premium-card relative overflow-hidden flex items-center justify-center">
                {/* Abstract visualization of learning */}
                <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, black 1px, transparent 0)', backgroundSize: '24px 24px' }}></div>
                <div className="text-center space-y-4 p-8 relative z-10">
                  <div className="font-mono text-sm text-[#666666]">O(N log N)</div>
                  <div className="w-32 h-1 bg-[#111111]/10 rounded-full mx-auto overflow-hidden">
                    <div className="w-2/3 h-full bg-[#111111]"></div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* --- SECTION 3: PROJECTS --- */}
          <section className="min-h-screen flex items-center py-24 relative z-10">
            <div className="max-w-7xl mx-auto px-6 md:px-32 w-full grid md:grid-cols-2 gap-16 items-center reveal-section flex-row-reverse">
              <div className="order-2 md:order-1 aspect-square bg-[#111111] premium-card relative overflow-hidden flex flex-col justify-end p-8 text-white">
                <div className="space-y-2 relative z-10">
                  <div className="font-mono text-xs text-white/50 uppercase">Project Commits</div>
                  <div className="text-4xl font-medium">847+</div>
                </div>
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-[#0F62FE] rounded-full blur-[100px] opacity-20"></div>
              </div>
              <div className="order-1 md:order-2 space-y-8">
                <div className="w-16 h-16 rounded-2xl bg-white border border-black/5 shadow-sm flex items-center justify-center">
                  <Code2 className="w-8 h-8 text-[#111111] stroke-[1.5]" />
                </div>
                <div className="space-y-4">
                  <h2 className="text-4xl md:text-5xl font-medium tracking-tight">Learning becomes building.</h2>
                  <p className="text-lg text-[#666666] leading-relaxed">
                    Notebooks turn into laptops. Theories turn into repositories. Your portfolio is the undeniable proof of your capabilities.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* --- SECTION 4: RESUME INTELLIGENCE --- */}
          <section id="intelligence" className="min-h-screen py-24 relative z-10 bg-white/50 backdrop-blur-3xl border-y border-black/5">
            <div className="max-w-5xl mx-auto px-6 md:px-32 w-full space-y-16 reveal-section">
              <div className="text-center space-y-6 max-w-2xl mx-auto">
                <div className="w-16 h-16 rounded-2xl bg-[#FAF9F7] border border-black/5 shadow-sm flex items-center justify-center mx-auto">
                  <Award className="w-8 h-8 text-[#111111] stroke-[1.5]" />
                </div>
                <h2 className="text-4xl md:text-5xl font-medium tracking-tight">Your resume deserves more than keywords.</h2>
                <p className="text-lg text-[#666666] leading-relaxed">
                  Our intelligence engine scans your experiences, identifies skill gaps, and provides actionable coaching to bypass ATS filters.
                </p>
              </div>
              
              <div className="premium-card p-2 md:p-8 bg-[#FAF9F7]/50">
                <Suspense fallback={<div className="h-64 flex items-center justify-center text-[#666666]">Loading Analyzer...</div>}>
                  <ResumeAnalyzer apiKey="" data={resumeData} updateData={setResumeData} addToast={addToast} />
                </Suspense>
              </div>
            </div>
          </section>

          {/* --- SECTION 5: INTERVIEW PRACTICE --- */}
          <section id="practice" className="min-h-screen flex items-center py-24 relative z-10">
            <div className="max-w-5xl mx-auto px-6 md:px-32 w-full space-y-16 reveal-section">
              <div className="space-y-6">
                <h2 className="text-4xl md:text-5xl font-medium tracking-tight">Confidence is practiced.</h2>
                <p className="text-lg text-[#666666] max-w-xl">
                  Analyze your sentiment, structure, and technical accuracy before facing real engineering managers.
                </p>
              </div>
              
              <div className="premium-card p-2 md:p-8">
                <Suspense fallback={<div className="h-64 flex items-center justify-center">Loading Practice...</div>}>
                  <InterviewModule addToast={addToast} />
                </Suspense>
              </div>
            </div>
          </section>

          {/* --- SECTION 6: PLACEMENT & CTA --- */}
          <section className="min-h-[80vh] flex items-center justify-center py-24 relative z-10">
            <div className="text-center space-y-12 max-w-3xl px-6 reveal-section">
              <div className="w-24 h-24 rounded-full bg-[#0BA360]/10 border border-[#0BA360]/20 flex items-center justify-center mx-auto relative">
                <Briefcase className="w-10 h-10 text-[#0BA360] stroke-[1.5]" />
                <div className="absolute inset-0 rounded-full border border-[#0BA360] animate-ping opacity-20"></div>
              </div>
              
              <div className="space-y-6">
                <h2 className="text-5xl md:text-7xl font-medium tracking-tight">Your future begins here.</h2>
                <p className="text-xl text-[#666666]">The future isn't written. You write it.</p>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <button onClick={() => {
                    if(!user) setIsAuthOpen(true)
                    else window.scrollTo({top: 0, behavior: 'smooth'})
                }} className="btn-primary text-lg px-8 py-4 w-full sm:w-auto">
                  Start Your Journey <ArrowRight className="ml-2 w-5 h-5" />
                </button>
              </div>
            </div>
          </section>

        </div>
      </div>
    </SmoothScroll>
  )
}
