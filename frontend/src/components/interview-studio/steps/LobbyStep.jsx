/* eslint-disable react/prop-types */
import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { Camera, Mic, Sun, User, Volume2, Wifi, Clock } from 'lucide-react'

const READINESS_CHECKS = [
  { id: 'camera', label: 'Camera Preview', icon: Camera },
  { id: 'mic', label: 'Microphone Active', icon: Mic },
  { id: 'lighting', label: 'Good Lighting', icon: Sun },
  { id: 'face', label: 'Face Visible', icon: User },
  { id: 'noise', label: 'Low Background Noise', icon: Volume2 },
  { id: 'internet', label: 'Stable Connection', icon: Wifi }
]

const LobbyStep = ({ onNext, videoRef, startMedia, transcript, interimTranscript, speechStart, speechStop }) => {
  const [countdown, setCountdown] = useState(null)
  const [checks, setChecks] = useState({})
  const [isReady, setIsReady] = useState(false)

  // Start camera for preview & activate speech for lobby preview test
  useEffect(() => {
    startMedia({ video: true, audio: true })
    speechStart()

    // Simulate readiness checks
    const timers = READINESS_CHECKS.map((check, i) => {
      return setTimeout(() => {
        setChecks(prev => ({ ...prev, [check.id]: true }))
      }, 800 + i * 500)
    })

    return () => {
      timers.forEach(clearTimeout)
      speechStop()
    }
  }, [startMedia, speechStart, speechStop])

  // Check if all ready
  useEffect(() => {
    const allReady = READINESS_CHECKS.every(c => checks[c.id])
    if (allReady && !isReady) {
      setIsReady(true)
    }
  }, [checks, isReady])

  // Countdown
  const startCountdown = useCallback(() => {
    setCountdown(10)
  }, [])

  useEffect(() => {
    if (countdown === null) return
    if (countdown === 0) {
      onNext()
      return
    }
    const timer = setTimeout(() => setCountdown(prev => prev - 1), 1000)
    return () => clearTimeout(timer)
  }, [countdown, onNext])

  return (
    <motion.div
      className="flex items-center justify-center min-h-screen p-6"
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -30 }}
      transition={{ duration: 0.5 }}
    >
      <div className="w-full max-w-4xl grid md:grid-cols-2 gap-8 items-center">
        {/* Camera Preview */}
        <div className="space-y-4">
          <div className="relative aspect-video rounded-3xl overflow-hidden bg-[#111] shadow-2xl border border-white/10">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover mirror"
              style={{ transform: 'scaleX(-1)' }}
            />

            {/* Camera overlay elements */}
            <div className="absolute inset-0 pointer-events-none">
              {/* Face frame guide */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-40 border-2 border-white/20 rounded-[50%]" />
              
              {/* Recording indicator */}
              <div className="absolute top-4 left-4 flex items-center gap-2">
                <motion.div
                  className="w-2.5 h-2.5 rounded-full bg-red-500"
                  animate={{ opacity: [1, 0.3, 1] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                />
                <span className="text-white/80 text-xs font-mono">PREVIEW</span>
              </div>
            </div>

            {/* Countdown overlay */}
            {countdown !== null && (
              <motion.div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <div className="text-center">
                  <motion.div
                    key={countdown}
                    className="text-7xl font-bold text-white"
                    initial={{ scale: 1.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: 'spring', stiffness: 200 }}
                  >
                    {countdown}
                  </motion.div>
                  <p className="text-white/60 text-sm mt-2 font-mono">Starting interview...</p>
                </div>
              </motion.div>
            )}
          </div>

          {/* Live audio test box */}
          <div className="p-4 bg-white rounded-2xl border border-black/5 space-y-2 mt-4 shadow-sm text-left">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono uppercase tracking-wider text-[#999]">Microphone & Speech Test</span>
              <span className="text-[10px] font-mono text-green-500 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" /> Live Preview
              </span>
            </div>
            <p className="text-xs text-[#333] italic leading-relaxed min-h-[32px]">
              {transcript || interimTranscript || 'Say something to test transcription...'}
            </p>
          </div>
        </div>

        {/* Readiness Panel */}
        <div className="space-y-6">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold text-[#111] tracking-tight">Interview Lobby</h1>
            <p className="text-[#666]">Position yourself comfortably. Your interview is about to begin.</p>
          </div>

          {/* Estimated duration */}
          <div className="flex items-center gap-3 p-3 rounded-xl bg-[#2563EB]/5 border border-[#2563EB]/10">
            <Clock className="w-4 h-4 text-[#2563EB]" />
            <span className="text-sm text-[#2563EB] font-medium">Estimated Duration: 10-15 Minutes</span>
          </div>

          {/* Readiness checks */}
          <div className="space-y-2">
            {READINESS_CHECKS.map((check) => {
              const Icon = check.icon
              const passed = checks[check.id]
              return (
                <motion.div
                  key={check.id}
                  className={`flex items-center gap-3 p-3 rounded-xl transition-all ${
                    passed ? 'bg-green-50/60' : 'bg-white'
                  }`}
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                >
                  <Icon className={`w-4 h-4 ${passed ? 'text-green-500' : 'text-[#CCC]'}`} />
                  <span className={`text-sm ${passed ? 'text-[#111]' : 'text-[#999]'}`}>{check.label}</span>
                  {passed && <span className="ml-auto text-green-500 text-xs font-mono">✓</span>}
                </motion.div>
              )
            })}
          </div>

          {/* Start button */}
          {countdown === null && (
            <motion.button
              onClick={startCountdown}
              disabled={!isReady}
              className={`w-full py-4 rounded-2xl font-semibold text-base transition-all ${
                isReady
                  ? 'bg-[#111] text-white hover:bg-[#222] shadow-lg'
                  : 'bg-black/5 text-[#CCC] cursor-not-allowed'
              }`}
              whileHover={isReady ? { scale: 1.01 } : {}}
              whileTap={isReady ? { scale: 0.99 } : {}}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              {isReady ? 'Begin Interview' : 'Running Checks...'}
            </motion.button>
          )}

          {countdown !== null && (
            <motion.div
              className="text-center p-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <motion.p
                className="text-lg text-[#111] font-medium"
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                Your interview is about to begin...
              </motion.p>
            </motion.div>
          )}
        </div>
      </div>
    </motion.div>
  )
}

export default LobbyStep
