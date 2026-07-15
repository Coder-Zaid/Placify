/* eslint-disable react/prop-types */
import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Brain, Eye, Shield, BookOpen, Mic2, FileText, Sparkles } from 'lucide-react'

const ANALYSIS_STEPS = [
  { id: 'speech', label: 'Processing Speech Data', icon: Mic2, duration: 1200 },
  { id: 'eye', label: 'Analyzing Eye Contact', icon: Eye, duration: 800 },
  { id: 'confidence', label: 'Measuring Confidence', icon: Shield, duration: 1000 },
  { id: 'grammar', label: 'Evaluating Grammar & Vocabulary', icon: BookOpen, duration: 900 },
  { id: 'content', label: 'Scoring Content Quality', icon: Brain, duration: 1100 },
  { id: 'resume', label: 'Matching Against Resume', icon: FileText, duration: 700 }
]

const AnalysisStep = ({ onComplete, answers }) => {
  const [currentStep, setCurrentStep] = useState(0)
  const [progress, setProgress] = useState(0)
  const [stepProgress, setStepProgress] = useState({})

  useEffect(() => {
    if (currentStep >= ANALYSIS_STEPS.length) {
      // All done
      setTimeout(() => onComplete(), 800)
      return
    }

    const step = ANALYSIS_STEPS[currentStep]
    const startTime = Date.now()
    
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime
      const p = Math.min(100, (elapsed / step.duration) * 100)
      setStepProgress(prev => ({ ...prev, [step.id]: p }))
      setProgress(((currentStep + p / 100) / ANALYSIS_STEPS.length) * 100)

      if (elapsed >= step.duration) {
        clearInterval(interval)
        setStepProgress(prev => ({ ...prev, [step.id]: 100 }))
        setTimeout(() => setCurrentStep(prev => prev + 1), 200)
      }
    }, 30)

    return () => clearInterval(interval)
  }, [currentStep, onComplete])

  return (
    <motion.div
      className="flex items-center justify-center min-h-screen p-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
    >
      <div className="w-full max-w-lg space-y-8 text-center">
        {/* Animated brain icon */}
        <motion.div
          className="w-20 h-20 mx-auto rounded-full bg-[#2563EB]/5 border border-[#2563EB]/10 flex items-center justify-center"
          animate={{ rotate: [0, 5, -5, 0], scale: [1, 1.05, 1] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
        >
          <Sparkles className="w-8 h-8 text-[#2563EB]" />
        </motion.div>

        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-[#111] tracking-tight">Analyzing Your Interview</h1>
          <p className="text-[#666]">Our AI is processing {answers?.length || 0} responses for deep evaluation.</p>
        </div>

        {/* Overall progress ring */}
        <div className="relative w-32 h-32 mx-auto">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="42" fill="none" stroke="#F3F4F6" strokeWidth="6" />
            <motion.circle
              cx="50" cy="50" r="42" fill="none" stroke="#2563EB" strokeWidth="6"
              strokeLinecap="round"
              strokeDasharray={`${2 * Math.PI * 42}`}
              strokeDashoffset={`${2 * Math.PI * 42 * (1 - progress / 100)}`}
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-2xl font-bold text-[#111]">{Math.round(progress)}%</span>
          </div>
        </div>

        {/* Step list */}
        <div className="space-y-2 text-left">
          {ANALYSIS_STEPS.map((step, index) => {
            const Icon = step.icon
            const p = stepProgress[step.id] || 0
            const isDone = p >= 100
            const isActive = index === currentStep

            return (
              <motion.div
                key={step.id}
                className={`flex items-center gap-3 p-3 rounded-xl transition-all ${
                  isDone ? 'bg-green-50/50' : isActive ? 'bg-[#2563EB]/5' : 'bg-white'
                }`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                  isDone ? 'bg-green-100' : isActive ? 'bg-[#2563EB]/10' : 'bg-black/5'
                }`}>
                  <Icon className={`w-4 h-4 ${
                    isDone ? 'text-green-600' : isActive ? 'text-[#2563EB]' : 'text-[#CCC]'
                  }`} />
                </div>
                <div className="flex-1">
                  <div className="text-sm font-medium text-[#111]">{step.label}</div>
                  {isActive && (
                    <div className="w-full h-1 mt-1 bg-black/5 rounded-full overflow-hidden">
                      <motion.div
                        className="h-full bg-[#2563EB] rounded-full"
                        style={{ width: `${p}%` }}
                      />
                    </div>
                  )}
                </div>
                {isDone && <span className="text-green-500 text-xs font-mono">✓</span>}
              </motion.div>
            )
          })}
        </div>
      </div>
    </motion.div>
  )
}

export default AnalysisStep
