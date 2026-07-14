import { useState, useEffect, useRef, Suspense, lazy } from 'react'
import { motion, useScroll, useTransform } from 'framer-motion'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import axios from 'axios'

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

// CSS-based UI Visuals for the right side
const NotebookVisual = () => (
  <div className="relative w-full aspect-[4/3] max-w-md mx-auto perspective-1000">
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
  </div>
)

const LaptopVisual = () => (
  <div className="relative w-full aspect-[16/10] max-w-lg mx-auto">
    <div className="absolute inset-x-8 top-0 bottom-6 bg-[#111] rounded-t-2xl p-3 shadow-2xl border-4 border-[#333]">
      {/* Screen */}
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
    {/* Keyboard base */}
    <div className="absolute inset-x-0 bottom-0 h-6 bg-gradient-to-b from-[#E0E0E0] to-[#B0B0B0] rounded-b-3xl shadow-xl border-t border-white/50 flex justify-center">
      <div className="w-1/4 h-1 bg-[#A0A0A0] mt-1 rounded-full"></div>
    </div>
  </div>
)

const EnvelopeVisual = () => (
  <div className="relative w-full aspect-[4/3] max-w-md mx-auto perspective-1000">
    <div className="absolute inset-0 bg-[#F4F0E6] shadow-2xl rounded-sm transform rotate-y-[10deg] rotate-x-[10deg] flex items-center justify-center border border-black/5 overflow-hidden">
      {/* Flap */}
      <div className="absolute top-0 left-0 w-full h-1/2 bg-[#EBE5D8] origin-top transform rotate-x-[20deg] border-b border-black/10 z-20 flex justify-center items-end pb-4">
        <div className="w-12 h-12 rounded-full bg-red-700/80 shadow-inner flex items-center justify-center">
           <span className="text-white/50 text-xs font-serif">SEAL</span>
        </div>
      </div>
      {/* Letter pulling out */}
      <div className="absolute w-3/4 h-3/4 bg-white shadow-md top-4 z-10 p-6 space-y-4">
        <div className="text-center font-serif text-xl tracking-widest text-black/80">OFFER LETTER</div>
        <div className="w-full h-px bg-black/10"></div>
        <div className="w-full h-2 bg-black/10 rounded"></div>
        <div className="w-5/6 h-2 bg-black/10 rounded"></div>
        <div className="text-blue-600 font-medium text-lg pt-4">Congratulations!</div>
      </div>
    </div>
  </div>
)


export default function App() {
  const mainRef = useRef(null)
  const pathRef = useRef(null)
  const [user, setUser] = useState(null)
  const [isAuthOpen, setIsAuthOpen] = useState(false)
  const { toasts, addToast, removeToast } = useToast()
  
  const [resumeData, setResumeData] = useState({ jdText: '', resumeFile: null, resumeBase64: '', results: null, isLoading: false, error: '' })

  const { scrollYProgress } = useScroll({
    target: mainRef,
    offset: ["start start", "end end"]
  });

  // Calculate the ball's Y position based on overall scroll
  const ballY = useTransform(scrollYProgress, [0, 1], ["0%", "100%"]);

  useEffect(() => {
    const token = localStorage.getItem('placify_auth_token')
    const email = localStorage.getItem('placify_user_email')
    const role = localStorage.getItem('placify_user_role')
    if (token && email && role) setUser({ email, role, token })

    const ctx = gsap.context(() => {
      // Draw the dashed line as we scroll
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

      // Fade up content
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
      <div ref={mainRef} className="relative min-h-screen font-display overflow-hidden selection:bg-[#2563EB] selection:text-white">
        <Toast toasts={toasts} onRemove={removeToast} />
        <AuthModal isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} onAuthSuccess={setUser} addToast={addToast} />

        <Scene3D />

        {/* Global Dotted Path Background */}
        <div className="absolute inset-0 pointer-events-none z-0 hidden md:block">
          <svg className="w-full h-full" preserveAspectRatio="none">
            <path 
              ref={pathRef}
              d="M 50% 10% C 70% 30%, 30% 50%, 50% 90%" 
              stroke="#2563EB" 
              strokeWidth="2.5" 
              fill="none" 
              className="opacity-60"
              style={{ strokeDasharray: 2000, strokeDashoffset: 2000 }} // Controlled dynamically via GSAP
            />
          </svg>
        </div>

        {/* The Traveling Pencil leaving behind a path */}
        <div className="fixed top-0 bottom-0 left-1/2 -translate-x-1/2 w-[1px] pointer-events-none z-50 hidden md:block">
           <motion.div 
             className="absolute w-12 h-12 -ml-6 -mt-6 origin-bottom-left"
             style={{ 
               top: ballY,
               rotate: -35
             }}
           >
             <svg className="w-full h-full drop-shadow-md" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
               <path d="M18 2L22 6L9 19H5V15L18 2Z" fill="#E0A96D" stroke="#111" strokeWidth="1.5"/>
               <path d="M5 15L9 19L3 21L5 15Z" fill="#E8DCC4" stroke="#111" strokeWidth="1.5"/>
               <path d="M3 21L4.5 19.5" stroke="#111" strokeWidth="1.5"/>
               <path d="M16 4L20 8" stroke="#111" strokeWidth="1.5"/>
             </svg>
           </motion.div>
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
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="inline-block transform -rotate-3 mb-6"
            >
              <span className="font-serif italic text-3xl text-[#2563EB]">The Journey From</span>
            </motion.div>
            <h1 className="text-6xl md:text-8xl font-bold tracking-tighter text-[#111111] mb-6">
              Classroom <br/> to Career.
            </h1>
            <p className="text-xl text-[#555555] max-w-lg mx-auto mb-12">
              Everything you need before your first offer letter.
            </p>
            <div className="flex gap-4">
              <button className="btn-primary px-8 py-4 text-lg hover:scale-105 transition-transform active:scale-98">Start Your Journey</button>
              <button className="btn-secondary px-8 py-4 text-lg hover:scale-105 transition-transform active:scale-98">Watch the Story</button>
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
            <div className="md:col-span-8 flex justify-center hover:scale-102 transition-transform duration-300">
              <NotebookVisual />
            </div>
          </section>

          {/* 02 COLLEGE: Card Left, Text Right */}
          <section className="max-w-7xl mx-auto px-6 grid md:grid-cols-12 gap-12 items-center content-reveal">
            <div className="md:col-span-8 order-2 md:order-1 flex justify-center hover:scale-102 transition-transform duration-300">
              <LaptopVisual />
            </div>
            <div className="md:col-span-4 order-1 md:order-2 space-y-6 md:pl-8">
              <div className="font-mono text-sm text-[#555555]">02</div>
              <h2 className="text-4xl font-bold">College</h2>
              <p className="text-[#555555] text-lg">Learning becomes building.</p>
            </div>
          </section>

          {/* 03 LEARNING & BUILDING: Text Left, Card Right */}
          <section className="max-w-7xl mx-auto px-6 grid md:grid-cols-12 gap-12 items-center content-reveal">
            <div className="md:col-span-4 space-y-6">
              <div className="font-mono text-sm text-[#555555]">03</div>
              <h2 className="text-4xl font-bold text-balance">Learning & Building</h2>
              <p className="text-[#555555] text-lg">Skills, projects and consistency shape your future.</p>
            </div>
            <div className="md:col-span-8 flex justify-center gap-4 perspective-1000">
              {[1, 2, 3].map(i => (
                <div key={i} className={`w-40 h-56 bg-white rounded-xl shadow-xl border border-black/5 transform rotate-y-[-20deg] hover:rotate-y-[0deg] transition-transform duration-500 ${i===2 ? '-translate-y-8 z-10' : ''} p-4 flex flex-col justify-between`}>
                  <div className="w-8 h-8 rounded bg-blue-100 flex items-center justify-center text-blue-600 font-bold">C{i}</div>
                  <div className="space-y-2">
                    <div className="w-full h-2 bg-black/10 rounded"></div>
                    <div className="w-2/3 h-2 bg-black/5 rounded"></div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* 04 RESUME INTELLIGENCE: Card Left, Text Right */}
          <section id="resume" className="max-w-7xl mx-auto px-6 grid md:grid-cols-12 gap-12 items-center content-reveal">
            <div className="md:col-span-8 order-2 md:order-1 bg-white rounded-2xl shadow-2xl border border-black/5 p-6 overflow-hidden max-h-[600px] overflow-y-auto">
              <Suspense fallback={<div>Loading Analyzer...</div>}>
                <ResumeAnalyzer apiKey="" data={resumeData} updateData={setResumeData} addToast={addToast} />
              </Suspense>
            </div>
            <div className="md:col-span-4 order-1 md:order-2 space-y-6 md:pl-8">
              <div className="font-mono text-sm text-[#555555]">04</div>
              <h2 className="text-4xl font-bold text-balance">Resume Intelligence</h2>
              <p className="text-[#555555] text-lg">AI that understands you better than words.</p>
            </div>
          </section>

          {/* 05 INTERVIEW PRACTICE: Text Left, Card Right */}
          <section id="interview" className="max-w-7xl mx-auto px-6 grid md:grid-cols-12 gap-12 items-center content-reveal">
            <div className="md:col-span-4 space-y-6">
              <div className="font-mono text-sm text-[#555555]">05</div>
              <h2 className="text-4xl font-bold text-balance">Interview Practice</h2>
              <p className="text-[#555555] text-lg">Practice until confidence becomes natural.</p>
            </div>
            <div className="md:col-span-8 bg-white rounded-2xl shadow-2xl border border-black/5 p-6 min-h-[400px]">
              <Suspense fallback={<div>Loading Practice...</div>}>
                <InterviewModule addToast={addToast} />
              </Suspense>
            </div>
          </section>

          {/* 06 PLACEMENT: Card Left, Text Right */}
          <section className="max-w-7xl mx-auto px-6 grid md:grid-cols-12 gap-12 items-center content-reveal">
            <div className="md:col-span-8 order-2 md:order-1 flex justify-center hover:scale-102 transition-transform duration-300">
               <EnvelopeVisual />
            </div>
            <div className="md:col-span-4 order-1 md:order-2 space-y-6 md:pl-8">
              <div className="font-mono text-sm text-[#555555]">06</div>
              <h2 className="text-4xl font-bold">Placement</h2>
              <p className="text-[#555555] text-lg">Your hard work. Their offer. Your moment.</p>
            </div>
          </section>

          {/* FOOTER */}
          <footer className="text-center pt-32 pb-16 space-y-16 content-reveal">
            <div className="inline-block transform -rotate-3 text-5xl md:text-7xl relative px-4">
              <span className="font-serif italic text-[#2563EB]">Y</span>ou Write <br/> the{' '}
              <span className="relative inline-block">
                future.
                <svg className="absolute -bottom-2 left-0 w-full h-3 text-[#2563EB]" viewBox="0 0 100 10" preserveAspectRatio="none">
                  <motion.path 
                    d="M0,5 Q50,0 100,5" 
                    stroke="currentColor" 
                    strokeWidth="3" 
                    fill="none"
                    initial={{ pathLength: 0 }}
                    whileInView={{ pathLength: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 1.2, ease: "easeOut" }}
                  />
                </svg>
              </span>
            </div>
            
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
