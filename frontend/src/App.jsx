import { useState, useEffect, useRef, Suspense, lazy } from 'react'
import { Link } from 'react-router-dom'
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import axios from 'axios'
import { X, Play, Sparkles, BookOpen, Code2, Award, Briefcase, ChevronRight, BarChart2, Settings } from 'lucide-react'

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
const EnvelopeVisual = ({ scrollProgress, user }) => {
  // Map scroll progress (between 0.80 and 0.95) to open the envelope
  // Flap opens first: progress 0.80 to 0.85
  const flapProgress = Math.min(1, Math.max(0, (scrollProgress - 0.80) / 0.05))
  const flapRotation = -140 * flapProgress

  // Letter slides up second: progress 0.82 to 0.88 (fully open before page end)
  const letterProgress = Math.min(1, Math.max(0, (scrollProgress - 0.82) / 0.06))
  const letterY = -80 * letterProgress
  const letterScale = 0.95 + 0.1 * letterProgress
  const letterOpacity = Math.min(1, Math.max(0, (scrollProgress - 0.82) / 0.02))

  // Extract display name from user's email if logged in
  const displayName = user && user.email 
    ? user.email.split('@')[0].split(/[._-]/).map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')
    : 'Candidate'

  return (
    <div className="relative w-full aspect-[4/3] max-w-md mx-auto perspective-1000 select-none">
      <motion.div 
        className="absolute inset-0 bg-[#EBE5D8] rounded-xl shadow-2xl border border-black/10 flex items-center justify-center overflow-hidden"
        style={{ transformStyle: "preserve-3d" }}
        animate={{ rotateY: letterProgress * 8, rotateX: letterProgress * 5 }}
        transition={{ type: "spring", stiffness: 60 }}
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
          className="absolute top-0 left-0 w-full h-1/2 bg-[#DFD9CB] origin-top z-20 flex justify-center items-end pb-4"
          animate={{ rotateX: flapRotation }}
          transition={{ type: "tween", ease: "linear" }}
        >
          {/* Wax Seal */}
          <div className="w-10 h-10 rounded-full bg-red-700 shadow-md border-2 border-red-800 flex items-center justify-center transform translate-y-9 z-30">
            <span className="text-white/60 font-serif text-xs font-bold">P</span>
          </div>
        </motion.div>

        {/* Front Cover / Bottom Half masking (Z-15) - Completely covers bottom of letter when closed */}
        <div className="absolute bottom-0 left-0 w-full h-1/2 bg-[#EBE5D8] rounded-b-xl border-t border-black/5 z-15" />

        {/* Letter pulling out of envelope (Opacity bound to scroll so it's fully hidden when closed) */}
        <motion.div 
          className="absolute w-[90%] h-[95%] bg-white shadow-xl rounded p-6 space-y-3 z-10 flex flex-col justify-between"
          style={{ y: letterY, scale: letterScale, opacity: letterOpacity }}
        >
          <div className="space-y-2">
            <div className="text-center font-serif text-xs tracking-widest text-[#111] uppercase font-bold">Offer of Employment</div>
            <div className="font-serif text-[10px] text-[#555] space-y-2 leading-relaxed">
              <p className="font-bold">Dear {displayName},</p>
              <p>We are thrilled to offer you the role of <span className="text-[#2563EB] font-bold">Software Engineer</span>.</p>
              <p>Your skills, experience, and performance stood out exceptionally during our cohort evaluations.</p>
            </div>
          </div>
          
          <div className="flex justify-between items-end pt-2">
            <div className="text-[8px] font-mono text-[#555]">Date: July 14, 2026</div>
            <div className="text-right">
              <div className="font-serif italic text-xs text-[#111]">Signature</div>
              <div className="text-[6px] text-gray-400">Placify Board</div>
            </div>
          </div>
        </motion.div>

      </motion.div>
    </div>
  )
}

const NotebookVisual = () => {
  const containerVariants = {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: 0.05
      }
    }
  }

  const letterVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 }
  }

  // Dynamically generate Fay's Butterfly Curve path points (Polar: r = e^sin(t) - 2cos(4t) + sin^5(t/12))
  const generateButterflyPath = () => {
    const points = []
    // 0 to 4*pi creates the dual layered wings beautifully
    for (let t = 0; t <= 4 * Math.PI; t += 0.05) {
      const r = Math.exp(Math.sin(t)) - 2 * Math.cos(4 * t) + Math.pow(Math.sin(t / 12), 5)
      // Polar to Cartesian
      const x = r * Math.cos(t)
      const y = r * Math.sin(t)
      // Center and scale to fit SVG viewport 100x80
      points.push(`${(50 + x * 6.5).toFixed(1)},${(40 - y * 6.5).toFixed(1)}`)
    }
    return `M ${points.join(' L ')}`
  }

  const butterflyPath = generateButterflyPath()

  return (
    <motion.div 
      whileHover={{ scale: 1.03 }}
      className="relative w-full aspect-[4/3] max-w-md mx-auto perspective-1000"
    >
      <div className="absolute inset-0 bg-white shadow-2xl rounded-sm transform rotate-y-[-10deg] rotate-x-[20deg] rotate-z-[5deg] flex divide-x divide-black/10 border border-black/5">
        
        {/* Left Page: Polar Equation Formula Writing */}
        <div className="w-1/2 h-full p-6 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="w-3/4 h-2 bg-black/10 rounded"></div>
            <div className="w-full h-2 bg-black/5 rounded"></div>
            <div className="w-5/6 h-2 bg-black/5 rounded"></div>
          </div>
          
          <div className="my-auto space-y-4">
            <div className="text-[10px] text-gray-400 uppercase tracking-widest font-mono">Polar Function</div>
            <motion.div 
              variants={containerVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: false, margin: "-50px" }}
              className="font-serif italic text-blue-600 text-xs select-none leading-relaxed"
            >
              {Array.from("r = e^sin(θ) - 2cos(4θ) + sin⁵(θ/12)").map((char, idx) => (
                <motion.span key={idx} variants={letterVariants}>
                  {char}
                </motion.span>
              ))}
            </motion.div>
          </div>
          
          <div className="w-full h-1 bg-black/5 rounded"></div>
        </div>

        {/* Right Page: Concentric Polar Grid & Butterfly Draw */}
        <div className="w-1/2 h-full p-4 relative flex flex-col justify-between">
          <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-black/5 to-transparent"></div>
          
          <div className="w-full h-2 bg-black/10 rounded"></div>
          
          {/* Polar Grid Container */}
          <div className="w-full h-36 border border-dashed border-black/10 rounded-lg flex items-center justify-center overflow-hidden bg-gray-50/30">
            <svg className="w-full h-full p-1" viewBox="0 0 100 80">
              {/* Concentric Polar Grid Circles */}
              <circle cx="50" cy="40" r="10" stroke="rgba(0,0,0,0.06)" strokeWidth="0.5" fill="none" />
              <circle cx="50" cy="40" r="20" stroke="rgba(0,0,0,0.06)" strokeWidth="0.5" fill="none" />
              <circle cx="50" cy="40" r="30" stroke="rgba(0,0,0,0.06)" strokeWidth="0.5" fill="none" />
              <circle cx="50" cy="40" r="38" stroke="rgba(0,0,0,0.06)" strokeWidth="0.5" fill="none" />
              
              {/* Polar Axis Lines */}
              <line x1="50" y1="2" x2="50" y2="78" stroke="rgba(0,0,0,0.08)" strokeWidth="0.5" />
              <line x1="12" y1="40" x2="88" y2="40" stroke="rgba(0,0,0,0.08)" strokeWidth="0.5" />
              
              {/* Diagonal Angle Guides */}
              <line x1="23.2" y1="13.2" x2="76.8" y2="66.8" stroke="rgba(0,0,0,0.04)" strokeWidth="0.5" />
              <line x1="23.2" y1="66.8" x2="76.8" y2="13.2" stroke="rgba(0,0,0,0.04)" strokeWidth="0.5" />

              {/* Animating Butterfly Curve */}
              <motion.path 
                d={butterflyPath} 
                stroke="#2563EB" 
                strokeWidth="1" 
                fill="none"
                initial={{ pathLength: 0 }}
                whileInView={{ pathLength: 1 }}
                viewport={{ once: false, margin: "-50px" }}
                transition={{ delay: 1.0, duration: 3.5, ease: "easeInOut" }}
              />
            </svg>
          </div>

          <div className="w-2/3 h-2 bg-black/5 rounded"></div>
        </div>

      </div>
    </motion.div>
  )
}

const LaptopVisual = () => {
  const codeLines = [
    '// Live Canvas Render',
    'const ctx = canvas.getContext("2d");',
    'ctx.beginPath();',
    'ctx.arc(50, 50, 30, 0, Math.PI * 2);',
    'ctx.strokeStyle = "#2563EB";',
    'ctx.stroke();'
  ]

  const containerVariants = {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: 0.15
      }
    }
  }

  const lineVariants = {
    hidden: { opacity: 0, x: -5 },
    visible: { opacity: 1, x: 0 }
  }

  return (
    <motion.div 
      whileHover={{ y: -5 }}
      className="relative w-full aspect-[16/10] max-w-lg mx-auto"
    >
      <div className="absolute inset-x-8 top-0 bottom-6 bg-[#111] rounded-t-2xl p-3 shadow-2xl border-4 border-[#333]">
        <div className="w-full h-full bg-[#1E1E1E] rounded-lg overflow-hidden flex flex-col font-mono text-xs select-none">
          {/* Header Bar */}
          <div className="h-6 bg-[#2D2D2D] flex items-center px-3 gap-2 border-b border-black/25">
            <div className="w-2 h-2 rounded-full bg-red-500"></div>
            <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
            <div className="w-2 h-2 rounded-full bg-green-500"></div>
            <span className="text-[10px] text-gray-400 ml-2">circle_render.js</span>
          </div>
          {/* Split IDE Panel */}
          <div className="grid grid-cols-12 h-[calc(100%-24px)]">
            {/* Code Panel */}
            <motion.div 
              variants={containerVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: false, margin: "-50px" }}
              className="col-span-7 p-3 text-green-400 space-y-1.5 border-r border-white/5 font-mono text-[9px] leading-normal"
            >
              {codeLines.map((line, idx) => (
                <motion.div key={idx} variants={lineVariants}>
                  {line.startsWith('//') ? (
                    <span className="text-gray-500">{line}</span>
                  ) : line.includes('const') ? (
                    <span><span className="text-purple-400">const</span> {line.replace('const', '')}</span>
                  ) : (
                    <span>{line}</span>
                  )}
                </motion.div>
              ))}
              <div className="animate-pulse w-1.5 h-3 bg-green-400 inline-block"></div>
            </motion.div>
            
            {/* Live Canvas Output Panel */}
            <div className="col-span-5 flex items-center justify-center bg-[#141414] p-4 relative">
              <div className="absolute top-2 left-2 text-[8px] text-gray-500 uppercase tracking-widest">Preview</div>
              
              <svg className="w-20 h-20" viewBox="0 0 100 100">
                {/* Backdrop design grid lines */}
                <circle cx="50" cy="50" r="45" stroke="rgba(255,255,255,0.02)" strokeWidth="1" fill="none" />
                <line x1="50" y1="5" x2="50" y2="95" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
                <line x1="5" y1="50" x2="95" y2="50" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />

                {/* Traced Circle */}
                <motion.circle 
                  cx="50"
                  cy="50"
                  r="30"
                  stroke="#2563EB"
                  strokeWidth="3"
                  fill="none"
                  initial={{ pathLength: 0 }}
                  whileInView={{ pathLength: 1 }}
                  viewport={{ once: false, margin: "-50px" }}
                  transition={{ delay: 1.2, duration: 1.8, ease: "easeInOut" }}
                />
              </svg>
            </div>
          </div>
        </div>
      </div>
      <div className="absolute inset-x-0 bottom-0 h-6 bg-gradient-to-b from-[#E0E0E0] to-[#B0B0B0] rounded-b-3xl shadow-xl border-t border-white/50 flex justify-center">
        <div className="w-1/4 h-1 bg-[#A0A0A0] mt-1 rounded-full"></div>
      </div>
    </motion.div>
  )
}

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
  const [batchData, setBatchData] = useState({ jdText: '', csvFile: null, csvText: '', results: null, isLoading: false, error: '' })

  const getApiKey = () => {
    try {
      const storedKeys = JSON.parse(localStorage.getItem('placify_api_keys') || '{}')
      return storedKeys.GEMINI_API_KEY || storedKeys.OPENAI_API_KEY || storedKeys.GROQ_API_KEY || storedKeys.ANTHROPIC_API_KEY || ''
    } catch (e) {
      return ''
    }
  }
  const currentApiKey = getApiKey()

  const { scrollYProgress } = useScroll({
    target: mainRef,
    offset: ["start start", "end end"]
  });

  const [scrollProgress, setScrollProgress] = useState(0)
  const [pencilPos, setPencilPos] = useState({ x: 0, y: 0 })
  const [scrollDirection, setScrollDirection] = useState('down')
  const [pathLength, setPathLength] = useState(2000)
  const lastScrollY = useRef(0)

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
    if (pathRef.current) {
      setPathLength(pathRef.current.getTotalLength())
    }
  }, [])

  useEffect(() => {
    const unsubscribe = scrollYProgress.onChange((v) => {
      setScrollProgress(v)
      
      // Calculate normalized X and Y for the pencil based exactly on the SVG path tip
      if (pathRef.current && mainRef.current) {
        const path = pathRef.current
        const totalLength = path.getTotalLength() || 2000
        const currentLength = v * totalLength
        const point = path.getPointAtLength(currentLength)
        
        // point.x is 0-100 in viewBox. Map to normalized screen (-0.5 to 0.5)
        const normalizedX = (point.x / 100) - 0.5
        
        // point.y is 0-100 in viewBox. Map to normalized screen Y
        const containerH = mainRef.current.clientHeight
        const pointYPixels = (point.y / 100) * containerH
        const screenYPixels = pointYPixels - window.scrollY
        const normalizedY = 0.5 - (screenYPixels / window.innerHeight)
        
        setPencilPos({ x: normalizedX, y: normalizedY })
      }
    })
    return () => unsubscribe()
  }, [scrollYProgress])

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
        <Scene3D scroll={scrollProgress} isScrolling={isScrolling} scrollDirection={scrollDirection} pathRef={pathRef} mainRef={mainRef} isMainPage={true} />

        {/* Global Pencil Path Background */}
        <div className="absolute inset-0 pointer-events-none z-0 opacity-20 md:opacity-100">
          <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
            <path 
              ref={pathRef}
              d="M 50,2 C 65,8 80,10 80,12 C 80,14 65,16 60,14 C 55,12 60,10 70,12 C 80,14 85,18 70,22 C 55,26 30,22 15,28 C 0,34 15,36 20,34 C 25,32 20,30 10,32 C 0,34 5,40 20,42 C 35,44 65,42 85,48 C 100,54 85,58 75,56 C 65,54 70,52 80,54 C 95,56 85,62 50,66 C 15,70 10,74 20,72 C 30,70 25,68 15,70 C 5,72 25,80 50,84 C 75,88 85,90 70,92 C 55,94 50,96 50,98"
              stroke="#333333" 
              strokeWidth="0.5" 
              fill="none" 
              className="opacity-70"
              strokeLinecap="round"
              style={{ 
                strokeDasharray: pathLength, 
                strokeDashoffset: pathLength - (scrollProgress * pathLength) 
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
            <div className="flex items-center gap-3">
              <Link 
                to="/settings" 
                className="p-2 hover:bg-black/5 rounded-full transition-colors flex items-center justify-center"
                title="API Configuration Settings"
              >
                <Settings className="w-5 h-5 text-[#555]" />
              </Link>
              {user ? <span className="text-sm font-medium">{user.email}</span> : <button onClick={() => setIsAuthOpen(true)} className="btn-secondary text-sm hover:scale-105 transition-transform">Sign In</button>}
            </div>
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
                {/* Card 1: Web Dev */}
                <motion.div 
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: false, margin: "-50px" }}
                  whileHover={{ rotateY: 0, scale: 1.05, y: -8 }}
                  transition={{ duration: 0.6 }}
                  className="w-40 h-56 bg-white rounded-xl shadow-xl border border-black/5 transform rotate-y-[-20deg] transition-all duration-300 p-4 flex flex-col justify-between"
                >
                  <div>
                    <div className="w-8 h-8 rounded bg-blue-50 flex items-center justify-center text-blue-600 font-bold text-xs">C1</div>
                    <div className="mt-3 font-bold text-xs text-[#111111]">Web Dev</div>
                    <div className="text-[10px] text-gray-400">Cohort 2026</div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-[10px]">
                      <span className="text-gray-500">Placements</span>
                      <span className="font-bold text-blue-600">92%</span>
                    </div>
                    {/* Animated Progress Bar */}
                    <div className="w-full h-1.5 bg-black/5 rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        whileInView={{ width: "92%" }}
                        transition={{ delay: 0.3, duration: 1, ease: "easeOut" }}
                        className="h-full bg-blue-600 rounded-full"
                      />
                    </div>
                  </div>
                </motion.div>

                {/* Card 2: AI & ML (Centered, slightly elevated) */}
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: -32 }}
                  viewport={{ once: false, margin: "-50px" }}
                  whileHover={{ rotateY: 0, scale: 1.05, y: -40 }}
                  transition={{ duration: 0.6 }}
                  className="w-40 h-56 bg-white rounded-xl shadow-2xl border border-black/5 transform rotate-y-[-20deg] transition-all duration-300 p-4 flex flex-col justify-between z-10"
                >
                  <div>
                    <div className="w-8 h-8 rounded bg-blue-50 flex items-center justify-center text-blue-600 font-bold text-xs">C2</div>
                    <div className="mt-3 font-bold text-xs text-[#111111]">AI & ML</div>
                    <div className="text-[10px] text-gray-400">Cohort 2026</div>
                  </div>
                  {/* Animated Column Bar Chart */}
                  <div className="h-16 flex items-end justify-between px-2 gap-1.5">
                    {[30, 55, 40, 65].map((height, idx) => (
                      <motion.div 
                        key={idx}
                        initial={{ height: 0 }}
                        whileInView={{ height: `${height}%` }}
                        transition={{ delay: 0.4 + idx * 0.15, duration: 0.8, ease: "backOut" }}
                        className="w-full bg-blue-500/80 hover:bg-blue-600 rounded-t-sm"
                      />
                    ))}
                  </div>
                </motion.div>

                {/* Card 3: DSA & Systems */}
                <motion.div 
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: false, margin: "-50px" }}
                  whileHover={{ rotateY: 0, scale: 1.05, y: -8 }}
                  transition={{ duration: 0.6 }}
                  className="w-40 h-56 bg-white rounded-xl shadow-xl border border-black/5 transform rotate-y-[-20deg] transition-all duration-300 p-4 flex flex-col justify-between"
                >
                  <div>
                    <div className="w-8 h-8 rounded bg-blue-50 flex items-center justify-center text-blue-600 font-bold text-xs">C3</div>
                    <div className="mt-3 font-bold text-xs text-[#111111]">DSA & Sys</div>
                    <div className="text-[10px] text-gray-400">Cohort 2026</div>
                  </div>
                  {/* Animated line chart */}
                  <div className="h-16 relative flex items-center justify-center overflow-hidden">
                    <svg className="w-full h-full" viewBox="0 0 100 40">
                      <motion.path 
                        d="M 5,35 Q 25,10 50,28 T 95,5"
                        stroke="#2563EB"
                        strokeWidth="2"
                        fill="none"
                        initial={{ pathLength: 0 }}
                        whileInView={{ pathLength: 1 }}
                        transition={{ delay: 0.3, duration: 1.2, ease: "easeInOut" }}
                      />
                    </svg>
                  </div>
                </motion.div>
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
                  <ResumeAnalyzer 
                    apiKey={currentApiKey} 
                    data={resumeData} 
                    updateData={(newData) => setResumeData(prev => ({ ...prev, ...newData }))} 
                    addToast={addToast} 
                  />
                ) : (
                  <BatchAnalysis 
                    apiKey={currentApiKey} 
                    data={batchData} 
                    updateData={(newData) => setBatchData(prev => ({ ...prev, ...newData }))} 
                    addToast={addToast} 
                  />
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
              <Link
                to="/interview-studio"
                className="inline-flex items-center gap-2 px-6 py-3 bg-[#2563EB] text-white rounded-xl font-semibold text-sm hover:bg-[#1D4ED8] transition-colors shadow-lg hover:shadow-xl mt-2"
              >
                <Sparkles className="w-4 h-4" />
                Launch AI Interview Studio
              </Link>
            </div>
            <motion.div 
              whileHover={{ scale: 1.01 }}
              className="md:col-span-8 bg-white rounded-2xl shadow-2xl border border-black/5 p-6 min-h-[400px]"
            >
              <Suspense fallback={<div>Loading Practice...</div>}>
                <InterviewModule apiKey={currentApiKey} addToast={addToast} />
              </Suspense>
            </motion.div>
          </section>

          {/* 06 PLACEMENT: Card Left, Text Right */}
          <section id="placement" className="max-w-7xl mx-auto px-6 grid md:grid-cols-12 gap-12 items-center content-reveal">
            <div className="md:col-span-8 order-2 md:order-1 flex justify-center pt-24 pb-24">
               <EnvelopeVisual scrollProgress={scrollProgress} user={user} />
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
