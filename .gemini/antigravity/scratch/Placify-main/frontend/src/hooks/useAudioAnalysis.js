import { useState, useRef, useCallback, useEffect } from 'react'

const FILLER_WORDS = ['um', 'uh', 'like', 'you know', 'basically', 'actually', 'literally', 'so', 'well', 'right', 'okay']

/**
 * Hook for real-time audio analysis: volume, waveform, speech detection, WPM, filler words.
 */
export function useAudioAnalysis(audioStream) {
  const [volume, setVolume] = useState(0)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [frequencyData, setFrequencyData] = useState(new Uint8Array(64))
  const analyserRef = useRef(null)
  const audioContextRef = useRef(null)
  const animFrameRef = useRef(null)
  const speakingTimeoutRef = useRef(null)

  // Speech statistics
  const [stats, setStats] = useState({
    wpm: 0,
    totalWords: 0,
    fillerWords: 0,
    fillerList: [],
    totalPauses: 0,
    longestPause: 0,
    avgPause: 0
  })

  const updateStats = useCallback((transcript) => {
    if (!transcript) return
    const words = transcript.trim().split(/\s+/).filter(Boolean)
    const totalWords = words.length

    // Count fillers
    const lower = transcript.toLowerCase()
    let fillerCount = 0
    const foundFillers = []
    FILLER_WORDS.forEach(f => {
      const regex = new RegExp(`\\b${f}\\b`, 'gi')
      const matches = lower.match(regex)
      if (matches) {
        fillerCount += matches.length
        foundFillers.push({ word: f, count: matches.length })
      }
    })

    setStats(prev => ({
      ...prev,
      totalWords,
      fillerWords: fillerCount,
      fillerList: foundFillers
    }))
  }, [])

  useEffect(() => {
    if (!audioStream) return

    const audioContext = new (window.AudioContext || window.webkitAudioContext)()
    const analyser = audioContext.createAnalyser()
    analyser.fftSize = 128
    analyser.smoothingTimeConstant = 0.8

    const source = audioContext.createMediaStreamSource(audioStream)
    source.connect(analyser)

    audioContextRef.current = audioContext
    analyserRef.current = analyser

    const bufferLength = analyser.frequencyBinCount
    const dataArray = new Uint8Array(bufferLength)

    let lastSpeakingTime = Date.now()
    let pauseStart = null
    let pauseDurations = []

    const tick = () => {
      analyser.getByteFrequencyData(dataArray)
      setFrequencyData(new Uint8Array(dataArray))

      // Calculate RMS volume
      let sum = 0
      for (let i = 0; i < bufferLength; i++) {
        sum += dataArray[i] * dataArray[i]
      }
      const rms = Math.sqrt(sum / bufferLength) / 255
      setVolume(rms)

      // Speech detection (threshold-based)
      const speaking = rms > 0.08
      if (speaking) {
        lastSpeakingTime = Date.now()
        if (pauseStart) {
          const pauseDur = (Date.now() - pauseStart) / 1000
          if (pauseDur > 0.5) pauseDurations.push(pauseDur)
          pauseStart = null
        }
        clearTimeout(speakingTimeoutRef.current)
        setIsSpeaking(true)
      } else {
        if (!pauseStart && Date.now() - lastSpeakingTime > 300) {
          pauseStart = Date.now()
        }
        speakingTimeoutRef.current = setTimeout(() => setIsSpeaking(false), 500)
      }

      animFrameRef.current = requestAnimationFrame(tick)
    }

    tick()

    return () => {
      cancelAnimationFrame(animFrameRef.current)
      clearTimeout(speakingTimeoutRef.current)
      source.disconnect()
      audioContext.close()
    }
  }, [audioStream])

  return { volume, isSpeaking, frequencyData, stats, updateStats }
}
