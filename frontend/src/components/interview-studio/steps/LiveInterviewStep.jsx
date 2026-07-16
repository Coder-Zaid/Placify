/* eslint-disable react/prop-types */
import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Mic, MicOff, SkipForward, StopCircle, Clock, ChevronRight, Info } from 'lucide-react'
import AIAvatar from '../AIAvatar'
import Waveform from '../Waveform'

const LiveInterviewStep = ({
  questions,
  videoRef,
  streamRef,
  transcript,
  interimTranscript,
  isListening,
  isSpeaking,
  volume,
  frequencyData,
  eyeContactScore,
  faceDetected,
  speechStart,
  speechStop,
  onAnswer,
  onEnd,
  isMuted,
  setIsMuted,
  startTime,
  speechError
}) => {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [timer, setTimer] = useState(0)
  const [questionTimer, setQuestionTimer] = useState(0)
  const [aiState, setAiState] = useState('speaking')
  const [answers, setAnswers] = useState([])
  const [showTransition, setShowTransition] = useState(false)
  const [isRecordingPaused, setIsRecordingPaused] = useState(false)
  
  const transcriptRef = useRef(null)
  const prevTranscriptRef = useRef('')

  // Bind active stream to videoRef when mounted
  useEffect(() => {
    if (videoRef.current && streamRef?.current) {
      videoRef.current.srcObject = streamRef.current
    }
  }, [videoRef, streamRef])

  const togglePauseRecording = () => {
    if (isRecordingPaused) {
      speechStart()
      setIsRecordingPaused(false)
    } else {
      speechStop()
      setIsRecordingPaused(true)
    }
  }

  const currentQuestion = questions[currentIndex]
  const totalQuestions = questions.length

  // Global timer
  useEffect(() => {
    const interval = setInterval(() => setTimer(prev => prev + 1), 1000)
    return () => clearInterval(interval)
  }, [])

  // Per-question timer
  useEffect(() => {
    setQuestionTimer(0)
    const interval = setInterval(() => setQuestionTimer(prev => prev + 1), 1000)
    return () => clearInterval(interval)
  }, [currentIndex])

  // AI speaks the question, then listens
  useEffect(() => {
    setAiState('speaking')
    
    // Speak question aloud using Web Speech API
    if (window.speechSynthesis && currentQuestion) {
      window.speechSynthesis.cancel()
      const utterance = new SpeechSynthesisUtterance(currentQuestion.question)
      window.activeUtterance = utterance // Prevent GC
      utterance.rate = 0.95
      utterance.pitch = 1.0
      utterance.onend = () => {
        setAiState('listening')
        speechStart()
      }
      // Slight delay before speaking
      setTimeout(() => window.speechSynthesis.speak(utterance), 800)
    } else {
      // Fallback: just start listening after 2s
      setTimeout(() => {
        setAiState('listening')
        speechStart()
      }, 2000)
    }

    return () => {
      window.speechSynthesis?.cancel()
    }
  }, [currentIndex, currentQuestion, speechStart])

  const [typedAnswer, setTypedAnswer] = useState('')

  // Reset typed response for new question
  useEffect(() => {
    setTypedAnswer('')
  }, [currentIndex])

  // Sync speech transcript into typed response field
  useEffect(() => {
    if (transcript) {
      setTypedAnswer(transcript)
    }
  }, [transcript])

  // AI reacts to user speaking
  useEffect(() => {
    if (aiState === 'listening' && isSpeaking) {
      // AI is listening and user is talking — show attentive state
    } else if (aiState === 'listening' && !isSpeaking && transcript !== prevTranscriptRef.current) {
      // User stopped speaking with new content — AI thinks
      setAiState('thinking')
      setTimeout(() => setAiState('listening'), 1500)
    }
    prevTranscriptRef.current = transcript
  }, [isSpeaking, transcript, aiState])

  // Auto-scroll transcript
  useEffect(() => {
    if (transcriptRef.current) {
      transcriptRef.current.scrollTop = transcriptRef.current.scrollHeight
    }
  }, [transcript, interimTranscript])

  const handleNext = useCallback(() => {
    speechStop()
    const answer = {
      questionIndex: currentIndex,
      question: currentQuestion.question,
      answer: transcript,
      duration: questionTimer,
      eyeContact: eyeContactScore
    }
    const newAnswers = [...answers, answer]
    setAnswers(newAnswers)
    onAnswer(answer)

    if (currentIndex < totalQuestions - 1) {
      setShowTransition(true)
      setTimeout(() => {
        setCurrentIndex(prev => prev + 1)
        setShowTransition(false)
      }, 800)
    } else {
      onEnd(newAnswers)
    }
  }, [currentIndex, totalQuestions, transcript, questionTimer, eyeContactScore, answers, onAnswer, onEnd, speechStop, currentQuestion])

  const handleEndEarly = useCallback(() => {
    speechStop()
    const answer = {
      questionIndex: currentIndex,
      question: currentQuestion.question,
      answer: transcript,
      duration: questionTimer,
      eyeContact: eyeContactScore
    }
    onEnd([...answers, answer])
  }, [currentIndex, transcript, questionTimer, eyeContactScore, answers, onEnd, speechStop, currentQuestion])

  const formatTime = (s) => `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`

  return (
    <motion.div
      className="flex flex-col h-screen bg-[#FAFAFA]"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {/* Top bar */}
      <div className="h-14 bg-white border-b border-black/5 flex items-center justify-between px-6 shrink-0">
        <div className="flex items-center gap-4">
          <div className="w-6 h-6 bg-[#111] rounded flex items-center justify-center text-white text-xs font-bold">P</div>
          <span className="font-semibold text-sm text-[#111]">Interview Session</span>
          <motion.div
            className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-red-50 border border-red-200"
            animate={{ opacity: [0.7, 1, 0.7] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <div className="w-2 h-2 rounded-full bg-red-500" />
            <span className="text-[10px] font-mono text-red-600 uppercase">Recording</span>
          </motion.div>
        </div>
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2 text-sm text-[#666]">
            <Clock className="w-4 h-4" />
            <span className="font-mono">{formatTime(timer)}</span>
          </div>
          <span className="text-xs font-mono text-[#999]">
            Q{currentIndex + 1} / {totalQuestions}
          </span>
        </div>
      </div>

      {/* Main content - 3 columns */}
      <div className="flex-1 grid grid-cols-12 gap-4 p-4 min-h-0">
        
        {/* LEFT: Camera Feed */}
        <div className="col-span-3 flex flex-col gap-3">
          <div className="relative aspect-[4/3] rounded-2xl overflow-hidden bg-[#111] shadow-lg border border-white/10">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
              style={{ transform: 'scaleX(-1)' }}
            />
            {/* Camera glow when speaking */}
            <motion.div
              className="absolute inset-0 rounded-2xl pointer-events-none"
              style={{ boxShadow: isSpeaking ? 'inset 0 0 0 3px #2563EB' : 'inset 0 0 0 0px transparent' }}
              animate={{ opacity: isSpeaking ? [0.5, 1, 0.5] : 0 }}
              transition={{ duration: 1, repeat: Infinity }}
            />
            {/* Mic indicator */}
            <div className="absolute bottom-3 right-3">
              <button
                onClick={() => setIsMuted(!isMuted)}
                className={`w-8 h-8 rounded-full flex items-center justify-center ${isMuted ? 'bg-red-500' : 'bg-white/20 backdrop-blur-sm'}`}
              >
                {isMuted ? <MicOff className="w-4 h-4 text-white" /> : <Mic className="w-4 h-4 text-white" />}
              </button>
            </div>
            {/* Face detection */}
            {!faceDetected && (
              <div className="absolute top-3 left-3 px-2 py-1 rounded-full bg-yellow-500/90 text-white text-[10px] font-mono">
                Face not detected
              </div>
            )}
          </div>

          {/* Session Status / Tips */}
          <div className="flex-1 bg-white rounded-2xl border border-black/5 p-5 flex flex-col justify-between">
            <div>
              <h4 className="text-xs font-mono uppercase tracking-wider text-[#999] mb-2">Session Info</h4>
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-[#666]">Eye Contact Tracker:</span>
                  <span className="font-semibold text-[#111]">{faceDetected ? 'Active' : 'Searching...'}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-[#666]">Audio Speech Engine:</span>
                  <span className="font-semibold text-green-600">
                    {(() => {
                      try {
                        const keys = JSON.parse(localStorage.getItem('placify_api_keys') || '{}')
                        if (keys.GROQ_API_KEY) return 'Groq Whisper API'
                        if (keys.OPENAI_API_KEY) return 'OpenAI Whisper API'
                        if (keys.GEMINI_API_KEY) return 'Gemini Voice API'
                      } catch (e) {}
                      return 'Groq Whisper API'
                    })()}
                  </span>
                </div>
              </div>
            </div>
            <div className="p-3 bg-blue-50/50 rounded-xl border border-blue-100/50 text-[11px] text-blue-700 leading-relaxed flex items-start gap-2">
              <Info className="w-3.5 h-3.5 text-blue-500 mt-0.5 shrink-0" />
              <span><strong>Tip:</strong> Speak clearly and look straight into your camera to maintain eye contact scores.</span>
            </div>
          </div>
        </div>

        {/* CENTER: Question */}
        <div className="col-span-5 flex flex-col gap-3">
          <AnimatePresence mode="wait">
            {showTransition ? (
              <motion.div
                key="transition"
                className="flex-1 flex items-center justify-center bg-white rounded-2xl border border-black/5"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
              >
                <div className="text-center">
                  <motion.div
                    className="text-5xl mb-3"
                    animate={{ rotate: [0, 10, -10, 0] }}
                    transition={{ duration: 0.6 }}
                  >
                    💭
                  </motion.div>
                  <p className="text-[#666] font-medium">Preparing next question...</p>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key={currentIndex}
                className="flex-1 bg-white rounded-2xl border border-black/5 p-6 flex flex-col"
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -50 }}
                transition={{ duration: 0.4 }}
              >
                {/* Question type badge */}
                <div className="flex items-center justify-between mb-4">
                  <span className="px-3 py-1 rounded-full bg-[#2563EB]/5 text-[#2563EB] text-[10px] font-mono uppercase tracking-wider">
                    {currentQuestion?.type || 'Technical'}
                  </span>
                  <span className="text-xs font-mono text-[#999]">
                    {formatTime(questionTimer)}
                  </span>
                </div>

                {/* Question text */}
                <div className="flex-1 flex items-center">
                  <h2 className="text-xl font-semibold text-[#111] leading-relaxed">
                    {currentQuestion?.question || 'Loading question...'}
                  </h2>
                </div>

                {/* Progress bar */}
                <div className="mt-4">
                  <div className="flex justify-between text-[10px] font-mono text-[#999] mb-1">
                    <span>Progress</span>
                    <span>{currentIndex + 1}/{totalQuestions}</span>
                  </div>
                  <div className="w-full h-1.5 bg-black/5 rounded-full overflow-hidden">
                    <motion.div
                      className="h-full bg-[#2563EB] rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${((currentIndex + 1) / totalQuestions) * 100}%` }}
                      transition={{ duration: 0.5 }}
                    />
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Controls */}
          <div className="flex gap-3">
            <motion.button
              onClick={handleNext}
              className="flex-1 py-3 rounded-xl bg-[#111] text-white font-medium text-sm flex items-center justify-center gap-2 hover:bg-[#222] transition-colors"
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
            >
              {currentIndex < totalQuestions - 1 ? (
                <><SkipForward className="w-4 h-4" /> Next Question</>
              ) : (
                <><StopCircle className="w-4 h-4" /> Finish Interview</>
              )}
            </motion.button>
            <motion.button
              onClick={togglePauseRecording}
              className={`px-4 py-3 rounded-xl font-medium text-sm transition-colors flex items-center gap-2 ${
                isRecordingPaused 
                  ? 'bg-green-600 text-white hover:bg-green-700 shadow-md' 
                  : 'bg-yellow-500 text-white hover:bg-yellow-600 shadow-md'
              }`}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
            >
              {isRecordingPaused ? '▶ Resume' : '⏸ Pause'}
            </motion.button>
            <motion.button
              onClick={handleEndEarly}
              className="px-4 py-3 rounded-xl border border-red-200 text-red-500 font-medium text-sm hover:bg-red-50 transition-colors"
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
            >
              End Early
            </motion.button>
          </div>
        </div>

        {/* RIGHT: Transcript + Waveform */}
        <div className="col-span-4 flex flex-col gap-3">
          {/* Live transcript */}
          <div className="flex-1 bg-white rounded-2xl border border-black/5 p-4 flex flex-col min-h-0">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-mono text-[#999] uppercase tracking-wider">Live Transcript</span>
              <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full ${
                isListening ? 'bg-green-50 text-green-600' : 'bg-gray-100 text-[#999]'
              }`}>
                {isListening ? '● Active' : '○ Paused'}
              </span>
            </div>
            <div
              ref={transcriptRef}
              className="flex-1 overflow-y-auto text-sm text-[#333] leading-relaxed pr-2 custom-scrollbar"
            >
              {transcript && <p>{transcript}</p>}
              {interimTranscript && (
                <span className="text-[#999] italic">{interimTranscript}</span>
              )}
              {!transcript && !interimTranscript && (
                <p className="text-[#CCC] italic">Start speaking to see your transcript here...</p>
              )}
            </div>

            {speechError && (
              <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-xl text-left">
                <p className="text-[10px] font-mono text-amber-800 leading-normal">
                  ⚠️ <strong>Transcription Error ({speechError})</strong>: Chrome cannot connect to Google's translation services. Please check your network, VPN, DNS, or Ad Blocker settings.
                </p>
              </div>
            )}
          </div>

          {/* Waveform */}
          <div className="bg-white rounded-2xl border border-black/5 p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-mono text-[#999] uppercase tracking-wider">Audio Level</span>
              <span className="text-[10px] font-mono text-[#999]">
                Eye Contact: {Math.round(eyeContactScore)}%
              </span>
            </div>
            <Waveform frequencyData={frequencyData} isSpeaking={isSpeaking} />
          </div>
        </div>
      </div>
    </motion.div>
  )
}

export default LiveInterviewStep
