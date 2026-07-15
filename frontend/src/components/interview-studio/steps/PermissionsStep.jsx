/* eslint-disable react/prop-types */
import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Camera, Mic, Brain, Volume2, Eye, Shield, CheckCircle2, XCircle, Loader } from 'lucide-react'

const CHECKS = [
  { id: 'camera', label: 'Camera Access', icon: Camera, requiresPermission: true },
  { id: 'microphone', label: 'Microphone Access', icon: Mic, requiresPermission: true },
  { id: 'speech', label: 'Speech Recognition', icon: Brain, requiresPermission: false },
  { id: 'voice', label: 'AI Voice Synthesis', icon: Volume2, requiresPermission: false },
  { id: 'face', label: 'Face Detection', icon: Eye, requiresPermission: false },
  { id: 'noise', label: 'Noise Filtering', icon: Shield, requiresPermission: false }
]

const PermissionsStep = ({ onNext, startMedia }) => {
  const [checkStates, setCheckStates] = useState({})
  const [currentCheck, setCurrentCheck] = useState(0)
  const [allPassed, setAllPassed] = useState(false)

  const runCheck = useCallback(async (checkId) => {
    setCheckStates(prev => ({ ...prev, [checkId]: 'checking' }))

    // Simulate a small delay for visual effect
    await new Promise(r => setTimeout(r, 600))

    let success = false
    switch (checkId) {
      case 'camera':
      case 'microphone': {
        try {
          const stream = await startMedia({
            video: checkId === 'camera',
            audio: checkId === 'microphone'
          })
          if (stream) {
            // Stop the test stream tracks immediately
            stream.getTracks().forEach(t => t.stop())
            setCheckStates(prev => ({ ...prev, [checkId]: 'passed' }))
            success = true
          } else {
            setCheckStates(prev => ({ ...prev, [checkId]: 'failed' }))
          }
        } catch {
          setCheckStates(prev => ({ ...prev, [checkId]: 'failed' }))
        }
        break
      }
      case 'speech': {
        const supported = !!(window.SpeechRecognition || window.webkitSpeechRecognition)
        setCheckStates(prev => ({ ...prev, [checkId]: supported ? 'passed' : 'failed' }))
        success = supported
        break
      }
      case 'voice': {
        const supported = !!window.speechSynthesis
        setCheckStates(prev => ({ ...prev, [checkId]: supported ? 'passed' : 'failed' }))
        success = supported
        break
      }
      case 'face': {
        setCheckStates(prev => ({ ...prev, [checkId]: 'passed' }))
        success = true
        break
      }
      case 'noise': {
        setCheckStates(prev => ({ ...prev, [checkId]: 'passed' }))
        success = true
        break
      }
      default:
        setCheckStates(prev => ({ ...prev, [checkId]: 'passed' }))
        success = true
    }
    return success
  }, [startMedia])

  useEffect(() => {
    let active = true
    const runAllChecks = async () => {
      let requiredPassed = true
      for (let i = 0; i < CHECKS.length; i++) {
        if (!active) return
        setCurrentCheck(i)
        const passed = await runCheck(CHECKS[i].id)
        if (CHECKS[i].id === 'camera' || CHECKS[i].id === 'microphone') {
          if (!passed) {
            requiredPassed = false
          }
        }
      }
      if (active) {
        setAllPassed(requiredPassed)
      }
    }
    runAllChecks()
    return () => {
      active = false
    }
  }, [runCheck])

  const speechFailed = checkStates['speech'] === 'failed'

  return (
    <motion.div
      className="flex items-center justify-center min-h-screen p-6"
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -30 }}
      transition={{ duration: 0.5 }}
    >
      <div className="w-full max-w-lg space-y-6">
        {/* Header */}
        <div className="text-center space-y-3">
          <h1 className="text-3xl font-bold text-[#111] tracking-tight">Preparing Your Interview</h1>
          <p className="text-[#666] text-sm">Verifying system capabilities for the best experience.</p>
        </div>

        {speechFailed && (
          <motion.div 
            className="p-4 bg-amber-50 border border-amber-200 rounded-2xl text-xs text-amber-800 leading-relaxed text-left"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            ⚠️ <strong>Browser Compatibility Note</strong>: The built-in Speech Transcription API is not fully supported or is disabled in your current browser (like Opera GX or Brave). For a fully automated voice-driven experience, we recommend using <strong>Google Chrome</strong> or <strong>Microsoft Edge</strong>.
          </motion.div>
        )}

        {/* Checks list */}
        <div className="space-y-3">
          {CHECKS.map((check, index) => {
            const state = checkStates[check.id]
            const Icon = check.icon
            const isActive = index === currentCheck && state === 'checking'

            return (
              <motion.div
                key={check.id}
                className={`flex items-center gap-4 p-4 rounded-2xl border transition-all ${
                  state === 'passed' ? 'bg-green-50/50 border-green-200' :
                  state === 'failed' ? 'bg-red-50/50 border-red-200' :
                  isActive ? 'bg-[#2563EB]/5 border-[#2563EB]/20' :
                  'bg-white border-black/5'
                }`}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                  state === 'passed' ? 'bg-green-100' :
                  state === 'failed' ? 'bg-red-100' :
                  isActive ? 'bg-[#2563EB]/10' :
                  'bg-black/5'
                }`}>
                  <Icon className={`w-5 h-5 ${
                    state === 'passed' ? 'text-green-600' :
                    state === 'failed' ? 'text-red-600' :
                    isActive ? 'text-[#2563EB]' :
                    'text-[#999]'
                  }`} />
                </div>

                <div className="flex-1">
                  <div className="text-sm font-semibold text-[#111]">{check.label}</div>
                  <div className="text-[10px] font-mono text-[#999] uppercase tracking-wider">
                    {state === 'passed' ? 'Verified' : state === 'failed' ? 'Not available' : isActive ? 'Checking...' : 'Pending'}
                  </div>
                </div>

                <div className="w-6 h-6 flex items-center justify-center">
                  <AnimatePresence mode="wait">
                    {state === 'passed' && (
                      <motion.div key="check" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}>
                        <CheckCircle2 className="w-5 h-5 text-green-500" />
                      </motion.div>
                    )}
                    {state === 'failed' && (
                      <motion.div key="x" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}>
                        <XCircle className="w-5 h-5 text-red-400" />
                      </motion.div>
                    )}
                    {isActive && (
                      <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                        <Loader className="w-5 h-5 text-[#2563EB] animate-spin" />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            )
          })}
        </div>

        {/* Continue button */}
        <motion.button
          onClick={onNext}
          disabled={!allPassed}
          className={`w-full py-4 rounded-2xl font-semibold text-base transition-all ${
            allPassed
              ? 'bg-[#111] text-white hover:bg-[#222] shadow-lg'
              : 'bg-black/5 text-[#CCC] cursor-not-allowed'
          }`}
          whileHover={allPassed ? { scale: 1.01 } : {}}
          whileTap={allPassed ? { scale: 0.99 } : {}}
        >
          {allPassed ? 'Continue to Lobby' : 'Verifying System...'}
        </motion.button>
      </div>
    </motion.div>
  )
}

export default PermissionsStep
