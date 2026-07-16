/* eslint-disable react/prop-types */
import { useState, useCallback, useEffect } from 'react'
import { AnimatePresence } from 'framer-motion'
import axios from 'axios'

import { useMediaStream } from '../../hooks/useMediaStream'
import { useSpeechRecognition } from '../../hooks/useSpeechRecognition'
import { useAudioAnalysis } from '../../hooks/useAudioAnalysis'
import { useFaceTracking } from '../../hooks/useFaceTracking'

import SetupStep from './steps/SetupStep'
import PermissionsStep from './steps/PermissionsStep'
import LobbyStep from './steps/LobbyStep'
import LiveInterviewStep from './steps/LiveInterviewStep'
import AnalysisStep from './steps/AnalysisStep'
import DashboardStep from './steps/DashboardStep'
import RoadmapStep from './steps/RoadmapStep'

const STEPS = ['setup', 'permissions', 'lobby', 'interview', 'analysis', 'dashboard', 'roadmap']

// Fallback questions when backend is unavailable
const FALLBACK_QUESTIONS = [
  { question: 'Tell me about yourself and your background.', type: 'HR', difficulty: 'Easy' },
  { question: 'What are your key strengths and how have they helped you in your career?', type: 'Behavioral', difficulty: 'Easy' },
  { question: 'Describe a challenging project you worked on. What was your role and how did you handle it?', type: 'Behavioral', difficulty: 'Medium' },
  { question: 'How do you handle tight deadlines and pressure at work?', type: 'Situational', difficulty: 'Medium' },
  { question: 'Where do you see yourself in 5 years?', type: 'HR', difficulty: 'Easy' },
  { question: 'Why are you interested in this role?', type: 'HR', difficulty: 'Easy' }
]

const InterviewStudio = () => {
  const [step, setStep] = useState('setup')
  const [config, setConfig] = useState({ role: '', experience: '', company: '', resumeFile: null, resumeBase64: null })
  const [questions, setQuestions] = useState([])
  const [answers, setAnswers] = useState([])
  const [results, setResults] = useState(null)
  const [plan, setPlan] = useState(null)
  const [isMuted, setIsMuted] = useState(false)

  // Hooks
  const { videoRef, audioStream, startMedia, stopMedia, streamRef } = useMediaStream()
  const { transcript, interimTranscript, isListening, start: speechStart, stop: speechStop, reset: speechReset, speechError } = useSpeechRecognition()
  const { volume, isSpeaking, frequencyData, stats, updateStats, micGain, setMicGain, pitch, pitchLabel } = useAudioAnalysis(audioStream)
  const { eyeContactScore, faceDetected, startTracking, stopTracking } = useFaceTracking(videoRef)

  // Update speech stats when transcript changes
  useEffect(() => {
    updateStats(transcript)
  }, [transcript, updateStats])

  // Generate questions from backend or use fallback
  const generateQuestions = useCallback(async () => {
    try {
      const apiKeys = JSON.parse(localStorage.getItem('placify_api_keys') || '{}')
      const apiKey = apiKeys.GROQ_API_KEY || apiKeys.GEMINI_API_KEY || apiKeys.OPENAI_API_KEY || apiKeys.ANTHROPIC_API_KEY

      const res = await axios.post('/analyze/interview-studio/generate-questions', {
        role: config.role,
        experience: config.experience,
        company: config.company || undefined,
        resume_base64: config.resumeBase64 || undefined,
        api_key: apiKey || undefined
      })
      if (res.data?.questions?.length > 0) {
        setQuestions(res.data.questions)
        return
      }
    } catch (err) {
      console.warn('[InterviewStudio] Backend unavailable, using fallback questions:', err.message)
    }
    // Fallback
    setQuestions(FALLBACK_QUESTIONS)
  }, [config])

  // Generate dashboard results
  const generateResults = useCallback(async (allAnswers) => {
    // Calculate stats from answers
    const totalWords = allAnswers.reduce((sum, a) => sum + (a.answer?.split(/\s+/).filter(Boolean).length || 0), 0)
    const totalDuration = allAnswers.reduce((sum, a) => sum + (a.duration || 30), 0)
    const avgEyeContact = allAnswers.reduce((sum, a) => sum + (a.eyeContact || 60), 0) / (allAnswers.length || 1)

    try {
      const res = await axios.post('/analyze/interview-studio/generate-dashboard', {
        role: config.role,
        experience: config.experience,
        answers: allAnswers
      })
      if (res.data) {
        setResults({
          ...res.data,
          speechStats: {
            wpm: totalDuration > 0 ? Math.round(totalWords / (totalDuration / 60)) : 0,
            totalWords,
            fillerWords: stats.fillerWords || 0,
            avgEyeContact: Math.round(avgEyeContact)
          }
        })
        return
      }
    } catch (err) {
      console.warn('[InterviewStudio] Backend unavailable for dashboard, generating locally:', err.message)
    }

    // Local fallback results
    const questionResults = allAnswers.map((a, i) => {
      const wordCount = a.answer?.split(/\s+/).filter(Boolean).length || 0
      const score = Math.min(100, Math.max(20, 40 + wordCount * 2 + (a.eyeContact || 50) * 0.3))
      return {
        question: a.question,
        answer: a.answer || '',
        score: Math.round(score),
        type: questions[i]?.type || 'General',
        duration: a.duration || 0,
        feedback: wordCount > 20
          ? 'Good response with reasonable depth. Try to include more specific examples.'
          : wordCount > 5
            ? 'Brief response. Expand with concrete examples and structured reasoning.'
            : 'Very short response. Practice the STAR method for comprehensive answers.'
      }
    })

    const avgScore = Math.round(questionResults.reduce((s, q) => s + q.score, 0) / (questionResults.length || 1))

    setResults({
      overallScore: avgScore,
      categories: [
        { name: 'Communication', score: Math.min(100, avgScore + Math.floor(Math.random() * 15 - 5)) },
        { name: 'Confidence', score: Math.min(100, Math.round(avgEyeContact * 0.8 + avgScore * 0.2)) },
        { name: 'Technical Knowledge', score: Math.min(100, avgScore + Math.floor(Math.random() * 10 - 5)) },
        { name: 'Professionalism', score: Math.min(100, avgScore + Math.floor(Math.random() * 10)) },
        { name: 'Content Delivery', score: Math.min(100, avgScore + Math.floor(Math.random() * 10 - 3)) }
      ],
      questionResults,
      strengths: [
        'Maintained steady pace throughout the interview',
        'Demonstrated willingness to engage with questions',
        avgEyeContact > 60 ? 'Good eye contact and camera presence' : 'Attempted to maintain camera focus'
      ],
      weaknesses: [
        totalWords < 100 ? 'Responses could be more detailed and comprehensive' : 'Consider using more specific technical examples',
        'Practice the STAR method for behavioral questions',
        'Work on reducing filler words for smoother delivery'
      ],
      speechStats: {
        wpm: totalDuration > 0 ? Math.round(totalWords / (totalDuration / 60)) : 0,
        totalWords,
        fillerWords: stats.fillerWords || 0,
        avgEyeContact: Math.round(avgEyeContact)
      }
    })
  }, [config, questions, stats])

  // Generate improvement plan
  const generatePlan = useCallback(async () => {
    try {
      const res = await axios.post('/analyze/interview-studio/improvement-plan', {
        role: config.role,
        overallScore: results?.overallScore || 50,
        weaknesses: results?.weaknesses || []
      })
      if (res.data) {
        setPlan(res.data)
        return
      }
    } catch (err) {
      console.warn('[InterviewStudio] Backend unavailable for plan, generating locally:', err.message)
    }

    // Fallback plan
    setPlan({
      weeks: [
        {
          focus: 'Foundation Building',
          tasks: [
            'Record yourself answering 3 questions daily and review',
            'Practice the STAR method with 5 past experiences',
            'Read articles about your target role for 20 min/day'
          ]
        },
        {
          focus: 'Communication Skills',
          tasks: [
            'Practice speaking without filler words for 5 minutes',
            'Record a 2-minute elevator pitch and refine',
            'Do mock interviews with a friend or family member'
          ]
        },
        {
          focus: 'Technical Depth',
          tasks: [
            'Prepare detailed explanations for 10 key technical concepts',
            'Practice whiteboard/system design explanations',
            'Review common technical interview patterns'
          ]
        },
        {
          focus: 'Interview Mastery',
          tasks: [
            'Complete 3 full mock interviews',
            'Practice handling curveball questions',
            'Refine your personal narrative and closing statements'
          ]
        }
      ],
      dailyTips: [
        { category: 'Communication', exercise: 'Practice explaining a complex concept in 60 seconds' },
        { category: 'Confidence', exercise: 'Power posing for 2 minutes before practice sessions' },
        { category: 'Technical Skills', exercise: 'Solve one coding/technical problem with verbal explanation' },
        { category: 'Interview Skills', exercise: 'Research one target company and prepare 3 tailored questions' },
        { category: 'Behavioral Questions', exercise: 'Write one STAR-formatted story from your experience' }
      ]
    })
  }, [config, results])

  // Step transitions
  const goToStep = useCallback((nextStep) => {
    setStep(nextStep)
  }, [])

  const handleSetupComplete = useCallback(async () => {
    await generateQuestions()
    goToStep('permissions')
  }, [generateQuestions, goToStep])

  const handlePermissionsComplete = useCallback(() => {
    goToStep('lobby')
  }, [goToStep])

  const handleLobbyComplete = useCallback(() => {
    speechReset()
    startTracking()
    goToStep('interview')
  }, [goToStep, speechReset, startTracking])

  const handleAnswer = useCallback((answer) => {
    setAnswers(prev => [...prev, answer])
    speechReset()
  }, [speechReset])

  const handleInterviewEnd = useCallback((allAnswers) => {
    speechStop()
    stopTracking()
    stopMedia()
    setAnswers(allAnswers)
    goToStep('analysis')
  }, [goToStep, speechStop, stopTracking, stopMedia])

  const handleAnalysisComplete = useCallback(async () => {
    await generateResults(answers)
    goToStep('dashboard')
  }, [answers, generateResults, goToStep])

  const handleDashboardNext = useCallback(async () => {
    await generatePlan()
    goToStep('roadmap')
  }, [generatePlan, goToStep])

  const handleRetake = useCallback(() => {
    setStep('setup')
    setConfig({ role: '', experience: '', company: '', resumeFile: null, resumeBase64: null })
    setQuestions([])
    setAnswers([])
    setResults(null)
    setPlan(null)
    setIsMuted(false)
    speechReset()
  }, [speechReset])

  return (
    <div className="min-h-screen bg-[#FAFAFA] font-display selection:bg-[#2563EB] selection:text-white">
      <AnimatePresence mode="wait">
        {step === 'setup' && (
          <SetupStep key="setup" config={config} setConfig={setConfig} onNext={handleSetupComplete} />
        )}
        {step === 'permissions' && (
          <PermissionsStep key="permissions" onNext={handlePermissionsComplete} startMedia={startMedia} />
        )}
        {step === 'lobby' && (
          <LobbyStep 
            key="lobby" 
            onNext={handleLobbyComplete} 
            videoRef={videoRef} 
            startMedia={startMedia} 
            transcript={transcript}
            interimTranscript={interimTranscript}
            speechStart={speechStart}
            speechStop={speechStop}
            speechError={speechError}
          />
        )}
        {step === 'interview' && (
          <LiveInterviewStep
            key="interview"
            questions={questions}
            videoRef={videoRef}
            streamRef={streamRef}
            transcript={transcript}
            interimTranscript={interimTranscript}
            isListening={isListening}
            isSpeaking={isSpeaking}
            volume={volume}
            frequencyData={frequencyData}
            eyeContactScore={eyeContactScore}
            faceDetected={faceDetected}
            speechStart={speechStart}
            speechStop={speechStop}
            onAnswer={handleAnswer}
            onEnd={handleInterviewEnd}
            isMuted={isMuted}
            setIsMuted={setIsMuted}
            speechError={speechError}
            micGain={micGain}
            setMicGain={setMicGain}
            pitch={pitch}
            pitchLabel={pitchLabel}
          />
        )}
        {step === 'analysis' && (
          <AnalysisStep key="analysis" onComplete={handleAnalysisComplete} answers={answers} />
        )}
        {step === 'dashboard' && (
          <DashboardStep key="dashboard" results={results} onNext={handleDashboardNext} />
        )}
        {step === 'roadmap' && (
          <RoadmapStep key="roadmap" plan={plan} onRetake={handleRetake} />
        )}
      </AnimatePresence>
    </div>
  )
}

export default InterviewStudio
