import { useState, useEffect, useRef, Suspense, lazy } from 'react'
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import axios from 'axios'
import { X, Play, Sparkles, BookOpen, Code2, Award, Briefcase, ChevronRight, BarChart2 } from 'lucide-react'

import SmoothScroll from './components/SmoothScroll'
import Scene3D from './components/Scene3D'
import Toast from './components/Toast'
import AuthModal from './components/AuthModal'
import { useToast } from './hooks/useToast'

gsap.registerPlugin(ScrollTrigger)

const BatchAnalysis = lazy(() => import('./components/BatchAnalysis'))
const ResumeAnalyzer = lazy(() => import('./components/ResumeAnalyzer'))
const InterviewModule = lazy(() => import('./components/InterviewModule'))
const CohortAnalytics = lazy(() => import('./components/CohortAnalytics'))

axios.defaults.baseURL = import.meta.env.PROD ? '' : 'http://localhost:8000';
axios.interceptors.request.use((config) => {
  const token = localStorage.getItem('placify_auth_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Highly Realistic Envelope and Letter Visual
const EnvelopeVisual = () => {
  const [isOpen, setIsOpen] = useState(false)
  return (
    <div 
      className="relative w-full aspect-[4/3] max-w-md mx-auto perspective-1000 cursor-pointer"
      onClick={() => setIsOpen(!isOpen)}
    >
      <motion.div 
        className="absolute inset-0 bg-[#EBE5D8] rounded-xl shadow-2xl border border-black/10 flex items-center justify-center overflow-hidden"
        animate={{ rotateY: isOpen ? 15 : 0, rotateX: isOpen ? 10 : 0 }}
        transition={{ type: "spring", stiffness: 100 }}
      >
        {/* Decorative stamp in corner */}
        <div className="absolute top-4 right-4 w-12 h-16 border-2 border-dashed border-red-800/40 p-1 flex items-center justify-center">
          <div className="w-full h-full border border-red-800/20 bg-red-50/50 flex flex-col items-center justify-center font-serif text-[8px] text-red-800/60">
            <span>OFFICIAL</span>
            <span>STAMP</span>
          </div>
        </div>

        {/* Outer Flap */}
        <motion.div 
          className="absolute top-0 left-0 w-full h-1/2 bg-[#DFD9CB] origin-top border-b border-black/10 z-20 flex justify-center items-end pb-4"
          animate={{ rotateX: isOpen ? -140 : 0 }}
          transition={{ duration: 0.6 }}
        >
          {/* Wax Seal */}
          <div className="w-10 h-10 rounded-full bg-red-700 shadow-md border-2 border-red-800 flex items-center justify-center transform translate-y-9 z-30">
            <span className="text-white/60 font-serif text-xs font-bold">P</span>
          </div>
        </motion.div>

        {/* Letter pulling out of envelope */}
        <motion.div 
          className="absolute w-[90%] h-[95%] bg-white shadow-xl rounded p-6 space-y-3 z-10 flex flex-col justify-between"
          animate={{ y: isOpen ? -80 : 0, scale: isOpen ? 1.05 : 0.95 }}
          transition={{ type: "spring", stiffness: 80, delay: isOpen ? 0.2 : 0 }}
        >
          <div className="space-y-2">
            <div className="text-center font-serif text-xs tracking-widest text-[#111] uppercase font-bold">Offer of Employment</div>
            <div className="w-full h-px bg-black/10"></div>
            <div className="font-serif text-[10px] text-[#555] space-y-1">
              <p className="font-bold">Dear Candidate,</p>
              <p>We are thrilled to offer you the role of <span className="text-[#2563EB] font-bold">Software Engineer</span>.</p>
              <p>Your skills, experience, and performance stood out exceptionally during our cohort evaluations.</p>
            </div>
          </div>
          
          <div className="flex justify-between items-end border-t border-black/5 pt-2">
            <div className="text-[8px] font-mono text-[#555]">Date: July 14, 2026</div>
            <div className="text-right">
              <div className="font-serif italic text-xs text-[#111]">Signature</div>
              <div className="w-16 h-px bg-black/40 ml-auto mt-1"></div>
              <div className="text-[6px] text-gray-400">Placify Board</div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </div>
  )
}

const NotebookVisual = () => (
  <motion.div 
    whileHover={{ scale: 1.03 }}
    className="relative w-full aspect-[4/3] max-w-md mx-auto perspective-1000"
  >
    <div className="absolute inset-0 bg-white shadow-2xl rounded-sm transform rotate-y-[-10deg] rotate-x-[20deg] rotate-z-[5deg] flex divide-x divide-black/10 border border-black/5">
      <div className="w-1/2 h-full p-6 space-y-4">
        <div className="w-3/4 h-2 bg-black/10 rounded"></div>
        <div className="w-full h-2 bg-black/5 rounded"></div>
        <div className="w-5/6 h-2 bg-black/5 rounded"></div>
        <div className="font-serif italic text-blue-600/40 text-xl mt-8">f(x) = ax² + bx + c</div>
      </div>
      <div className="w-1/2 h-full p-6 space-y-4 relative">
        <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-black/5 to-transparent"></div>
        <div className="w-full h-2 bg-black/10 rounded"></div>
        <div className="w-4/5 h-2 bg-black/5 rounded"></div>
        <div className="w-full h-32 border-2 border-dashed border-black/10 rounded-xl mt-4 flex items-center justify-center">
          <svg className="w-12 h-12 text-black/10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg>
        </div>
      </div>
    </div>
  </motion.div>
)

const LaptopVisual = () => (
  <motion.div 
    whileHover={{ y: -5 }}
    className="relative w-full aspect-[16/10] max-w-lg mx-auto"
  >
    <div className="absolute inset-x-8 top-0 bottom-6 bg-[#111] rounded-t-2xl p-3 shadow-2xl border-4 border-[#333]">
      <div className="w-full h-full bg-[#1E1E1E] rounded-lg overflow-hidden flex flex-col font-mono text-xs">
        <div className="h-6 bg-[#2D2D2D] flex items-center px-3 gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-red-500"></div>
          <div className="w-2.5 h-2.5 rounded-full bg-yellow-500"></div>
          <div className="w-2.5 h-2.5 rounded-full bg-green-500"></div>
        </div>
        <div className="p-4 text-green-400 space-y-2">
          <div><span className="text-blue-400">const</span> future = <span className="text-yellow-300">new</span> Career();</div>
          <div>future.<span className="text-blue-300">build</span>();</div>
          <div className="animate-pulse">_</div>
        </div>
      </div>
    </div>
    <div className="absolute inset-x-0 bottom-0 h-6 bg-gradient-to-b from-[#E0E0E0] to-[#B0B0B0] rounded-b-3xl shadow-xl border-t border-white/50 flex justify-center">
      <div className="w-1/4 h-1 bg-[#A0A0A0] mt-1 rounded-full"></div>
    </div>
  </motion.div>
)

export default function App() {
  const mainRef = useRef(null)
  const pathRef = useRef(null)
  const [user, setUser] = useState(null)
  const [isAuthOpen, setIsAuthOpen] = useState(false)
  const [isStoryOpen, setIsStoryOpen] = useState(false)
  const [resumeMode, setResumeMode] = useState('single') // single or batch
  const [isScrolling, setIsScrolling] = useState(false)
  const scrollTimeout = useRef(null)
  const { toasts, addToast, removeToast } = useToast()
  
  const [resumeData, setResumeData] = useState({ jdText: '', resumeFile: null, resumeBase64: '', results: null, isLoading: false, error: '' })

  const { scrollYProgress } = useScroll({
    target: mainRef,
    offset: ["start start", "end end"]
  });

  const [scrollProgress, setScrollProgress] = useState(0)

  // Cinematic autoscrolling sequence
  const startCinematicScroll = () => {
    const targetIds = ['school', 'college', 'projects', 'resume', 'interview', 'placement', 'footer']
    let currentDelay = 0
    targetIds.forEach((id) => {
      setTimeout(() => {
        const el = document.getElementById(id)
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }, currentDelay)
      currentDelay += 3500
    })
  }

  useEffect(() => {
    const unsubscribe = scrollYProgress.onChange((v) => {
      setScrollProgress(v)
    })
    return () => unsubscribe()
  }, [scrollYProgress])

  const [scrollDirection, setScrollDirection] = useState('down')
  const lastScrollY = useRef(0)

  // Scroll active/idle state and direction listener
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolling(true)
      
      const currentScrollY = window.scrollY
      if (currentScrollY > lastScrollY.current) {
        setScrollDirection('down')
      } else if (currentScrollY < lastScrollY.current) {
        setScrollDirection('up')
      }
      lastScrollY.current = currentScrollY

      clearTimeout(scrollTimeout.current)
      scrollTimeout.current = setTimeout(() => {
        setIsScrolling(false)
      }, 200)
    }
    window.addEventListener('scroll', handleScroll)
    return () => {
      window.removeEventListener('scroll', handleScroll)
      clearTimeout(scrollTimeout.current)
    }
  }, [])

  useEffect(() => {
    const token = localStorage.getItem('placify_auth_token')
    const email = localStorage.getItem('placify_user_email')
    const role = localStorage.getItem('placify_user_role')
    if (token && email && role) setUser({ email, role, token })

    const ctx = gsap.context(() => {
      gsap.to(pathRef.current, {
        strokeDashoffset: 0,
        ease: "none",
        scrollTrigger: {
          trigger: mainRef.current,
          start: "top top",
          end: "bottom bottom",
          scrub: 0.5,
        }
      })

      gsap.utils.toArray('.content-reveal').forEach(el => {
        gsap.fromTo(el, 
          { opacity: 0, y: 40 },
          { opacity: 1, y: 0, duration: 1, ease: 'power3.out', scrollTrigger: { trigger: el, start: 'top 80%' } }
        )
      })
    }, mainRef)

    return () => ctx.revert()
  }, [])

  return (
    <SmoothScroll>
      <div ref={mainRef} className="relative min-h-screen font-display overflow-hidden selection:bg-[#2563EB] selection:text-white bg-transparent">
        
        {/* Soft engineering grid paper pattern */}
        <div className="fixed inset-0 z-[-150] pointer-events-none opacity-60 bg-[radial-gradient(circle_at_center,_transparent_0%,_#FAF7F0_80%)] bg-[#FAF7F0]" 
             style={{
               backgroundImage: `
                 linear-gradient(to right, rgba(17, 17, 17, 0.03) 1px, transparent 1px),
                 linear-gradient(to bottom, rgba(17, 17, 17, 0.03) 1px, transparent 1px)
               `,
               backgroundSize: '30px 30px'
             }}
        />
        <div className="fixed inset-0 z-[-140] pointer-events-none opacity-5 mix-blend-multiply" 
             style={{ 
               backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 500 500\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noiseFilter\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.8\' numOctaves=\'3\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noiseFilter)\'/%3E%3C/svg%3E")' 
             }} 
        />

        <Toast toasts={toasts} onRemove={removeToast} />
        <AuthModal isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} onAuthSuccess={setUser} addToast={addToast} />

        {/* 3D background elements canvas */}
        <Scene3D scroll={scrollProgress} isScrolling={isScrolling} scrollDirection={scrollDirection} isMainPage={true} />

        {/* Global Pencil Path Background */}
        <div className="absolute inset-0 pointer-events-none z-0 hidden md:block">
          <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
            <path 
              ref={pathRef}
              d="M 50,2 C 65,8 80,10 80,12 C 80,14 65,16 60,14 C 55,12 60,10 70,12 C 80,14 85,18 70,22 C 55,26 30,22 15,28 C 0,34 15,36 20,34 C 25,32 20,30 10,32 C 0,34 5,40 20,42 C 35,44 65,42 85,48 C 100,54 85,58 75,56 C 65,54 70,52 80,54 C 95,56 85,62 50,66 C 15,70 10,74 20,72 C 30,70 25,68 15,70 C 5,72 25,80 50,84 C 75,88 85,90 70,92 C 55,94 50,96 50,98"
              stroke="#333333" 
              strokeWidth="0.5" 
              fill="none" 
              className="opacity-70"
              style={{ 
                strokeDasharray: "2000", 
                strokeDashoffset: 2000 - (scrollProgress * 2000) 
              }}
            />
          </svg>
        </div>

        {/* Header */}
        <header className="fixed top-0 w-full z-50 bg-[#FAF7F0]/80 backdrop-blur-md border-b border-black/5">
          <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-[#111111] rounded flex items-center justify-center text-white font-bold">P</div>
              <span className="font-bold text-xl tracking-tight">Placify.</span>
            </div>
            <nav className="hidden md:flex gap-8 text-sm font-medium text-[#555555]">
              <a href="#school" className="hover:text-black transition-colors">The Journey</a>
              <a href="#resume" className="hover:text-black transition-colors">Intelligence</a>
              <a href="#interview" className="hover:text-black transition-colors">Practice</a>
            </nav>
            {user ? <span className="text-sm font-medium">{user.email}</span> : <button onClick={() => setIsAuthOpen(true)} className="btn-secondary text-sm hover:scale-105 transition-transform">Sign In</button>}
          </div>
        </header>

        {/* Layout Container */}
        <div className="relative z-10 pt-32 pb-32 space-y-48">
          
          {/* HERO */}
          <section className="min-h-[80vh] flex flex-col items-center justify-center text-center px-6 content-reveal">
            <h1 className="text-6xl md:text-8xl font-bold tracking-tighter text-[#111111] mb-6">
              Classroom <br/> to Career.
            </h1>
            <p className="text-xl text-[#555555] max-w-lg mx-auto mb-12">
              Everything you need before your first offer letter.
            </p>
            <div className="flex gap-4">
              <button 
                onClick={() => {
                  const el = document.getElementById('school')
                  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' })
                }}
                className="btn-primary px-8 py-4 text-lg hover:scale-105 transition-transform active:scale-98"
              >
                Start Your Journey
              </button>
              <button 
                onClick={startCinematicScroll}
                className="btn-secondary px-8 py-4 text-lg hover:scale-105 transition-transform active:scale-98 flex items-center gap-2"
              >
                <Play className="w-4 h-4 fill-current" /> Watch the Story
              </button>
            </div>
            
            <div className="mt-24 grid grid-cols-2 md:grid-cols-4 gap-12 text-[#555555]">
              <div className="space-y-2"><div className="text-3xl font-bold text-[#111111]">1000+</div><div className="text-sm">Students Backed</div></div>
              <div className="space-y-2"><div className="text-3xl font-bold text-[#111111]">95%</div><div className="text-sm">Resume Improved</div></div>
              <div className="space-y-2"><div className="text-3xl font-bold text-[#111111]">4x</div><div className="text-sm">Faster Placement</div></div>
              <div className="space-y-2"><div className="text-3xl font-bold text-[#111111]">24/7</div><div className="text-sm">AI Support</div></div>
            </div>
          </section>

          {/* 01 SCHOOL: Text Left, Card Right */}
          <section id="school" className="max-w-7xl mx-auto px-6 grid md:grid-cols-12 gap-12 items-center content-reveal">
            <div className="md:col-span-4 space-y-6">
              <div className="font-mono text-sm text-[#555555]">01</div>
              <h2 className="text-4xl font-bold">School</h2>
              <p className="text-[#555555] text-lg">Every expert once struggled with the basics.</p>
            </div>
            <div className="md:col-span-8 flex justify-center">
              <NotebookVisual />
            </div>
          </section>

          {/* 02 COLLEGE: Card Left, Text Right */}
          <section id="college" className="max-w-7xl mx-auto px-6 grid md:grid-cols-12 gap-12 items-center content-reveal">
            <div className="md:col-span-8 order-2 md:order-1 flex justify-center">
              <LaptopVisual />
            </div>
            <div className="md:col-span-4 order-1 md:order-2 space-y-6 md:pl-8">
              <div className="font-mono text-sm text-[#555555]">02</div>
              <h2 className="text-4xl font-bold">College</h2>
              <p className="text-[#555555] text-lg">Learning becomes building.</p>
            </div>
          </section>

          {/* 03 LEARNING & BUILDING: Text Left, Dashboard Right */}
          <section id="projects" className="max-w-7xl mx-auto px-6 space-y-12 content-reveal">
            <div className="grid md:grid-cols-12 gap-12 items-center">
              <div className="md:col-span-4 space-y-6">
                <div className="font-mono text-sm text-[#555555]">03</div>
                <h2 className="text-4xl font-bold text-balance">Learning & Building</h2>
                <p className="text-[#555555] text-lg">Skills, projects, and cohort analytics define candidate standings.</p>
              </div>
              <div className="md:col-span-8 flex justify-center gap-4 perspective-1000">
                {[1, 2, 3].map(i => (
                  <motion.div 
                    key={i} 
                    whileHover={{ rotateY: 0, scale: 1.05, y: -8 }}
                    className={`w-40 h-56 bg-white rounded-xl shadow-xl border border-black/5 transform rotate-y-[-20deg] transition-all duration-300 ${i===2 ? '-translate-y-8 z-10' : ''} p-4 flex flex-col justify-between`}
                  >
                    <div className="w-8 h-8 rounded bg-blue-100 flex items-center justify-center text-blue-600 font-bold">C{i}</div>
                    <div className="space-y-2">
                      <div className="w-full h-2 bg-black/10 rounded"></div>
                      <div className="w-2/3 h-2 bg-black/5 rounded"></div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
            
            {/* Cohort Analytics Embedded */}
            <div className="bg-white rounded-2xl shadow-xl border border-black/5 p-6 md:p-8">
              <div className="flex items-center gap-2 mb-6">
                <BarChart2 className="w-5 h-5 text-[#2563EB]" />
                <h3 className="font-bold text-lg">Cohort analytics dashboard</h3>
              </div>
              <Suspense fallback={<div>Loading Cohort Analytics...</div>}>
                <CohortAnalytics results={[]} />
              </Suspense>
            </div>
          </section>

          {/* 04 RESUME INTELLIGENCE: Card Left, Text Right */}
          <section id="resume" className="max-w-7xl mx-auto px-6 grid md:grid-cols-12 gap-12 items-center content-reveal">
            <div className="md:col-span-8 order-2 md:order-1 bg-white rounded-2xl shadow-2xl border border-black/5 p-6 overflow-hidden min-h-[500px]">
              {/* Single / Batch Selection Toggle */}
              <div className="flex gap-4 mb-6 border-b border-black/5 pb-4">
                <button 
                  onClick={() => setResumeMode('single')}
                  className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${resumeMode === 'single' ? 'bg-[#111] text-white' : 'text-gray-500 hover:bg-black/5'}`}
                >
                  Single Resume Analyzer
                </button>
                <button 
                  onClick={() => setResumeMode('batch')}
                  className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${resumeMode === 'batch' ? 'bg-[#111] text-white' : 'text-gray-500 hover:bg-black/5'}`}
                >
                  Batch screening (CSV)
                </button>
              </div>

              <Suspense fallback={<div>Loading Module...</div>}>
                {resumeMode === 'single' ? (
                  <ResumeAnalyzer apiKey="" data={resumeData} updateData={setResumeData} addToast={addToast} />
                ) : (
                  <BatchAnalysis addToast={addToast} />
                )}
              </Suspense>
            </div>
            
            <div className="md:col-span-4 order-1 md:order-2 space-y-6 md:pl-8">
              <div className="font-mono text-sm text-[#555555]">04</div>
              <h2 className="text-4xl font-bold text-balance">Resume Intelligence</h2>
              <p className="text-[#555555] text-lg">AI that understands single resumes and handles batch analysis pipelines.</p>
            </div>
          </section>

          {/* 05 INTERVIEW PRACTICE: Text Left, Card Right */}
          <section id="interview" className="max-w-7xl mx-auto px-6 grid md:grid-cols-12 gap-12 items-center content-reveal">
            <div className="md:col-span-4 space-y-6">
              <div className="font-mono text-sm text-[#555555]">05</div>
              <h2 className="text-4xl font-bold text-balance">Interview Practice</h2>
              <p className="text-[#555555] text-lg">Practice until confidence becomes natural.</p>
            </div>
            <motion.div 
              whileHover={{ scale: 1.01 }}
              className="md:col-span-8 bg-white rounded-2xl shadow-2xl border border-black/5 p-6 min-h-[400px]"
            >
              <Suspense fallback={<div>Loading Practice...</div>}>
                <InterviewModule addToast={addToast} />
              </Suspense>
            </motion.div>
          </section>

          {/* 06 PLACEMENT: Card Left, Text Right */}
          <section id="placement" className="max-w-7xl mx-auto px-6 grid md:grid-cols-12 gap-12 items-center content-reveal">
            <div className="md:col-span-8 order-2 md:order-1 flex justify-center">
               <EnvelopeVisual />
            </div>
            <div className="md:col-span-4 order-1 md:order-2 space-y-6 md:pl-8">
              <div className="font-mono text-sm text-[#555555]">06</div>
              <h2 className="text-4xl font-bold">Placement</h2>
              <p className="text-[#555555] text-lg">Your hard work. Their offer. Your moment.</p>
            </div>
          </section>

          {/* FOOTER */}
          <footer id="footer" className="text-center pt-32 pb-32 space-y-16 content-reveal">
            <motion.div 
              variants={{
                hidden: {},
                visible: { transition: { staggerChildren: 0.06 } }
              }}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-100px" }}
              className="inline-block transform -rotate-3 text-5xl md:text-7xl relative px-4 select-none font-bold"
            >
              {/* "You Write" word animation */}
              <div className="block">
                {Array.from("You Write").map((char, index) => (
                  <motion.span
                    key={index}
                    variants={{
                      hidden: { opacity: 0, y: 10 },
                      visible: { opacity: 1, y: 0 }
                    }}
                    className={char === "Y" ? "font-serif italic text-[#2563EB]" : ""}
                  >
                    {char}
                  </motion.span>
                ))}
              </div>
              
              {/* "the future." word animation */}
              <div className="block">
                {Array.from("the ").map((char, index) => (
                  <motion.span
                    key={index}
                    variants={{
                      hidden: { opacity: 0, y: 10 },
                      visible: { opacity: 1, y: 0 }
                    }}
                  >
                    {char}
                  </motion.span>
                ))}
                
                <span className="relative inline-block">
                  {Array.from("future.").map((char, index) => (
                    <motion.span
                      key={index}
                      variants={{
                        hidden: { opacity: 0, y: 10 },
                        visible: { opacity: 1, y: 0 }
                      }}
                    >
                      {char}
                    </motion.span>
                  ))}
                  
                  {/* Underline drawn after text letters appear */}
                  <svg className="absolute -bottom-2 left-0 w-full h-3 text-[#2563EB]" viewBox="0 0 100 10" preserveAspectRatio="none">
                    <motion.path 
                      d="M0,5 Q50,0 100,5" 
                      stroke="currentColor" 
                      strokeWidth="3" 
                      fill="none"
                      initial={{ pathLength: 0 }}
                      whileInView={{ pathLength: 1 }}
                      viewport={{ once: true }}
                      transition={{ delay: 0.8, duration: 1.0, ease: "easeOut" }}
                    />
                  </svg>
                </span>
              </div>
            </motion.div>
            
            <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-start text-left border-t border-black/10 pt-16 gap-12 text-[#555555]">
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 bg-[#111111] rounded flex items-center justify-center text-white font-bold text-xs">P</div>
                  <span className="font-bold text-[#111111]">Placify.</span>
                </div>
                <p className="text-sm">From Classroom to Career.</p>
              </div>
              <div className="flex gap-16 text-sm">
                <div className="space-y-4">
                  <div className="font-bold text-[#111111]">Platform</div>
                  <ul className="space-y-2"><li>The Journey</li><li>Intelligence</li><li>Practice</li></ul>
                </div>
                <div className="space-y-4">
                  <div className="font-bold text-[#111111]">Resources</div>
                  <ul className="space-y-2"><li>Blog</li><li>Guides</li><li>Help Center</li></ul>
                </div>
                <div className="space-y-4">
                  <div className="font-bold text-[#111111]">Company</div>
                  <ul className="space-y-2"><li>About Us</li><li>Careers</li><li>Contact</li></ul>
                </div>
              </div>
            </div>
          </footer>
        </div>
      </div>
    </SmoothScroll>
  )
}
