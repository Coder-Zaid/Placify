import { useState, useEffect, useRef, Suspense, lazy } from 'react'
import { motion, useScroll, useTransform } from 'framer-motion'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import axios from 'axios'
import { ArrowRight, Sparkles, BookOpen, Code2, Award, Briefcase } from 'lucide-react'

import SmoothScroll from './components/SmoothScroll'
import Scene3D from './components/Scene3D'
import Toast from './components/Toast'
import AuthModal from './components/AuthModal'
import CustomCursor from './components/CustomCursor'
import MagneticButton from './components/MagneticButton'
import TiltCard from './components/TiltCard'
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
  const { scrollYProgress } = useScroll()
  
  // State
  const [user, setUser] = useState(null)
  const [isAuthOpen, setIsAuthOpen] = useState(false)
  const { toasts, addToast, removeToast } = useToast()
  
  // 3D Scene State
  const [currentSection, setCurrentSection] = useState('hero')

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
      // 1. Reveal Animations for sections (Staggered fade/slide up)
      gsap.utils.toArray('.reveal-section').forEach((section) => {
        gsap.fromTo(section, 
          { opacity: 0, y: 80, rotate: 2 },
          { 
            opacity: 1, 
            y: 0, 
            rotate: 0,
            duration: 1.2, 
            ease: 'expo.out',
            scrollTrigger: {
              trigger: section,
              start: 'top 85%',
              end: 'top 50%',
              scrub: 1
            }
          }
        )
      })

      // 2. The Narrative Pencil Line (Scroll Progress)
      gsap.to('.progress-line-fill', {
        height: '100%',
        ease: 'none',
        scrollTrigger: {
          trigger: '.narrative-container',
          start: 'top top',
          end: 'bottom bottom',
          scrub: 0.1
        }
      })

      // 3. Update 3D scene state based on scroll position
      const sections = ['hero', 'school', 'college', 'projects', 'resume', 'interview', 'placement']
      sections.forEach((id) => {
        const el = document.getElementById(id)
        if (el) {
          ScrollTrigger.create({
            trigger: el,
            start: 'top center',
            end: 'bottom center',
            onEnter: () => setCurrentSection(id),
            onEnterBack: () => setCurrentSection(id),
          })
        }
      })

      // 4. Hero Pinning
      ScrollTrigger.create({
        trigger: '#hero',
        start: 'top top',
        end: '+=100%',
        pin: '.hero-content',
        pinSpacing: false,
        scrub: true
      })

    }, mainRef)

    return () => ctx.revert()
  }, [])

  // Dynamic Background Color Shift for Placement
  const bgShift = useTransform(scrollYProgress, [0.8, 1], ['#FAF9F7', '#111111'])
  const textShift = useTransform(scrollYProgress, [0.8, 1], ['#111111', '#FFFFFF'])

  return (
    <SmoothScroll>
      <CustomCursor />
      
      {/* FIXED 3D BACKGROUND LAYER */}
      <Scene3D currentSection={currentSection} scrollProgress={scrollYProgress} />
      
      <motion.div 
        ref={mainRef} 
        style={{ backgroundColor: bgShift, color: textShift }}
        className="min-h-screen relative font-display selection:bg-[#0F62FE] selection:text-white transition-colors duration-700"
      >
        <Toast toasts={toasts} onRemove={removeToast} />
        <AuthModal isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} onAuthSuccess={setUser} addToast={addToast} />

        {/* Global Progress Line connecting the story */}
        <div className="fixed left-8 md:left-16 top-0 bottom-0 w-[2px] bg-black/5 z-40 hidden md:block mix-blend-difference">
          <div className="progress-line-fill w-full bg-current h-0 origin-top"></div>
        </div>

        {/* Premium Header */}
        <header className="fixed top-0 w-full z-50 glass-panel border-b-0 border-white/10 mix-blend-difference text-white">
          <div className="max-w-7xl mx-auto px-6 md:px-16 h-20 flex items-center justify-between">
            <div className="flex items-center gap-3 interactive">
              <div className="w-10 h-10 bg-white rounded-2xl flex items-center justify-center">
                <span className="text-black font-bold text-lg">P</span>
              </div>
              <span className="font-semibold text-lg tracking-tight">Placify.</span>
            </div>
            
            <nav className="hidden md:flex items-center gap-8 text-sm font-medium interactive">
              <a href="#school" className="hover:opacity-60 transition-opacity">The Journey</a>
              <a href="#resume" className="hover:opacity-60 transition-opacity">Intelligence</a>
              <a href="#interview" className="hover:opacity-60 transition-opacity">Practice</a>
            </nav>

            <div className="flex items-center gap-4">
              {user ? (
                <span className="text-sm font-medium opacity-80">{user.email}</span>
              ) : (
                <MagneticButton onClick={() => setIsAuthOpen(true)}>
                  <span className="bg-white text-black text-sm px-5 py-2.5 rounded-full font-medium inline-block">Sign In</span>
                </MagneticButton>
              )}
            </div>
          </div>
        </header>

        {/* --- SECTION 1: HERO (The Beginning) --- */}
        <section id="hero" className="relative h-screen flex items-center justify-center">
          <div className="hero-content relative z-10 text-center px-6 max-w-5xl mx-auto pt-20 pointer-events-none">
            <motion.div 
              initial="hidden"
              animate="visible"
              variants={{
                hidden: { opacity: 0 },
                visible: {
                  opacity: 1,
                  transition: { staggerChildren: 0.15, delayChildren: 0.2 }
                }
              }}
              className="space-y-8"
            >
              <motion.div variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 1, ease: 'easeOut' } } }} className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-panel border border-black/5 text-sm font-medium text-current shadow-sm">
                <Sparkles className="w-4 h-4 text-[#0F62FE]" />
                <span>An Interactive Documentary.</span>
              </motion.div>
              
              <h1 className="text-6xl md:text-[7rem] font-medium tracking-tight text-balance leading-[1.05] overflow-hidden">
                {"From Classroom to Career.".split(" ").map((word, i) => (
                  <motion.span
                    key={i}
                    className={`inline-block mr-[2vw] ${i >= 3 ? 'text-transparent bg-clip-text bg-gradient-to-r from-current to-gray-400' : ''}`}
                    variants={{
                      hidden: { opacity: 0, y: 100, rotate: 5 },
                      visible: { opacity: 1, y: 0, rotate: 0, transition: { duration: 1.2, ease: [0.16, 1, 0.3, 1] } }
                    }}
                  >
                    {word}
                  </motion.span>
                ))}
              </h1>
              
              <motion.p variants={{ hidden: { opacity: 0 }, visible: { opacity: 0.7, transition: { duration: 1.5, delay: 1 } } }} className="text-xl md:text-2xl max-w-2xl mx-auto text-balance">
                Scroll to experience the journey.
              </motion.p>
            </motion.div>
          </div>
        </section>

        <div className="narrative-container pb-32">
          
          {/* --- SECTION 2: SCHOOL & BASICS --- */}
          <section id="school" className="min-h-screen flex items-center py-24 relative z-10">
            <div className="max-w-7xl mx-auto px-6 md:px-32 w-full grid md:grid-cols-2 gap-16 items-center reveal-section">
              <div className="space-y-8">
                <div className="w-16 h-16 rounded-2xl glass-panel shadow-sm flex items-center justify-center">
                  <BookOpen className="w-8 h-8 text-current stroke-[1.5]" />
                </div>
                <div className="space-y-4">
                  <h2 className="text-4xl md:text-6xl font-medium tracking-tight">Every expert once struggled with the basics.</h2>
                  <p className="text-lg opacity-70 leading-relaxed">
                    It starts with algorithms, data structures, and late nights trying to center a div. The foundation is built here.
                  </p>
                </div>
              </div>
              <TiltCard className="aspect-square bg-white premium-card relative overflow-hidden flex items-center justify-center">
                <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, black 1px, transparent 0)', backgroundSize: '24px 24px' }}></div>
                <div className="text-center space-y-4 p-8 relative z-10 text-black">
                  <div className="font-mono text-sm opacity-60">System.out.println("Hello World");</div>
                  <div className="w-48 h-1 bg-black/10 rounded-full mx-auto overflow-hidden">
                    <motion.div 
                      className="w-full h-full bg-black origin-left"
                      initial={{ scaleX: 0 }}
                      whileInView={{ scaleX: 1 }}
                      viewport={{ once: true }}
                      transition={{ duration: 1.5, ease: "easeInOut" }}
                    />
                  </div>
                </div>
              </TiltCard>
            </div>
          </section>

          {/* --- SECTION 3: COLLEGE & PROJECTS --- */}
          <section id="college" className="min-h-screen flex items-center py-24 relative z-10">
            <div className="max-w-7xl mx-auto px-6 md:px-32 w-full grid md:grid-cols-2 gap-16 items-center reveal-section flex-row-reverse">
              <TiltCard className="order-2 md:order-1 aspect-square bg-[#111111] premium-card relative overflow-hidden flex flex-col justify-end p-8 text-white">
                <div className="space-y-2 relative z-10">
                  <div className="font-mono text-xs text-white/50 uppercase">Project Commits</div>
                  <div className="text-5xl font-medium">847+</div>
                </div>
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-[#0F62FE] rounded-full blur-[100px] opacity-20"></div>
              </TiltCard>
              <div className="order-1 md:order-2 space-y-8">
                <div className="w-16 h-16 rounded-2xl glass-panel shadow-sm flex items-center justify-center">
                  <Code2 className="w-8 h-8 text-current stroke-[1.5]" />
                </div>
                <div className="space-y-4">
                  <h2 className="text-4xl md:text-6xl font-medium tracking-tight">Learning becomes building.</h2>
                  <p className="text-lg opacity-70 leading-relaxed">
                    Notebooks turn into laptops. Theories turn into repositories. Your portfolio is the undeniable proof of your capabilities.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* --- SECTION 4: RESUME INTELLIGENCE --- */}
          <section id="resume" className="min-h-screen py-24 relative z-10 glass-panel border-y border-current/5">
            <div className="max-w-5xl mx-auto px-6 md:px-32 w-full space-y-16 reveal-section">
              <div className="text-center space-y-6 max-w-2xl mx-auto">
                <div className="w-16 h-16 rounded-2xl glass-panel shadow-sm flex items-center justify-center mx-auto">
                  <Award className="w-8 h-8 text-current stroke-[1.5]" />
                </div>
                <h2 className="text-4xl md:text-6xl font-medium tracking-tight">Your resume deserves more than keywords.</h2>
                <p className="text-lg opacity-70 leading-relaxed">
                  Our intelligence engine scans your experiences, identifies skill gaps, and provides actionable coaching to bypass ATS filters.
                </p>
              </div>
              
              <div className="premium-card p-2 md:p-8 bg-white/50 text-black">
                <Suspense fallback={<div className="h-64 flex items-center justify-center text-[#666666]">Loading Analyzer...</div>}>
                  <ResumeAnalyzer apiKey="" data={resumeData} updateData={setResumeData} addToast={addToast} />
                </Suspense>
              </div>
            </div>
          </section>

          {/* --- SECTION 5: INTERVIEW PRACTICE --- */}
          <section id="interview" className="min-h-screen flex items-center py-24 relative z-10">
            <div className="max-w-5xl mx-auto px-6 md:px-32 w-full space-y-16 reveal-section">
              <div className="space-y-6">
                <h2 className="text-4xl md:text-6xl font-medium tracking-tight">Confidence is practiced.</h2>
                <p className="text-lg opacity-70 max-w-xl">
                  Analyze your sentiment, structure, and technical accuracy before facing real engineering managers.
                </p>
              </div>
              
              <TiltCard className="premium-card p-2 md:p-8 bg-white text-black">
                <Suspense fallback={<div className="h-64 flex items-center justify-center">Loading Practice...</div>}>
                  <InterviewModule addToast={addToast} />
                </Suspense>
              </TiltCard>
            </div>
          </section>

          {/* --- SECTION 6: PLACEMENT & CTA --- */}
          <section id="placement" className="min-h-[100vh] flex items-center justify-center py-24 relative z-10 overflow-hidden">
            
            <div className="text-center space-y-12 max-w-3xl px-6 reveal-section relative z-10">
              <div className="w-24 h-24 rounded-full bg-white/10 border border-white/20 flex items-center justify-center mx-auto relative">
                <Briefcase className="w-10 h-10 text-white stroke-[1.5]" />
                <div className="absolute inset-0 rounded-full border border-white/50 animate-ping opacity-20"></div>
              </div>
              
              <div className="space-y-6">
                <h2 className="text-6xl md:text-8xl font-medium tracking-tight">Your future begins here.</h2>
                <p className="text-xl md:text-2xl opacity-70">The future isn't written. You write it.</p>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <MagneticButton onClick={() => {
                    if(!user) setIsAuthOpen(true)
                    else window.scrollTo({top: 0, behavior: 'smooth'})
                }}>
                  <div className="inline-flex items-center justify-center bg-white text-black font-medium rounded-full px-8 py-4 transition-transform hover:scale-105 active:scale-95 text-lg">
                    Start Your Journey <ArrowRight className="ml-2 w-5 h-5" />
                  </div>
                </MagneticButton>
              </div>
            </div>
          </section>

        </div>
      </motion.div>
    </SmoothScroll>
  )
}
