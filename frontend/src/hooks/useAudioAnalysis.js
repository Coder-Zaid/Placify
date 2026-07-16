import { useState, useRef, useCallback, useEffect } from 'react'

const FILLER_WORDS = ['um', 'uh', 'like', 'you know', 'basically', 'actually', 'literally', 'so', 'well', 'right', 'okay']

/**
 * Hook for real-time audio analysis: volume, waveform, speech detection, WPM, filler words,
 * mic level gain boosting, and pitch tracking.
 */
export function useAudioAnalysis(audioStream) {
  const [volume, setVolume] = useState(0)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [frequencyData, setFrequencyData] = useState(new Uint8Array(64))
  const [micGain, setMicGain] = useState(1.5) // Default boost factor (1.5x)
  const [pitch, setPitch] = useState(0)
  const [pitchLabel, setPitchLabel] = useState('Silent')
  
  const analyserRef = useRef(null)
  const gainNodeRef = useRef(null)
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

  // Dynamically update gain when state changes
  useEffect(() => {
    if (gainNodeRef.current) {
      gainNodeRef.current.gain.value = micGain
    }
  }, [micGain])

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

  // Autocorrelation pitch detection algorithm
  const detectPitch = (timeDomainData, sampleRate) => {
    const bufferSize = timeDomainData.length
    
    // Find absolute signal sum to check for silence
    let sumOfSquares = 0
    for (let i = 0; i < bufferSize; i++) {
      const val = (timeDomainData[i] - 128) / 128 // Normalize from [0, 255] to [-1, 1]
      sumOfSquares += val * val
    }
    
    const rms = Math.sqrt(sumOfSquares / bufferSize)
    if (rms < 0.02) {
      return -1 // Too quiet
    }

    // Autocorrelation search limits
    let r1 = 0
    let r2 = bufferSize / 2
    let bestOffset = -1
    let bestCorrelation = -1
    
    // Check correlation at offsets corresponding to 70Hz - 400Hz
    const minOffset = Math.floor(sampleRate / 400) // ~110 samples
    const maxOffset = Math.floor(sampleRate / 70)  // ~630 samples

    for (let offset = minOffset; offset < Math.min(maxOffset, bufferSize / 2); offset++) {
      let correlation = 0
      for (let i = 0; i < bufferSize / 2; i++) {
        const val1 = (timeDomainData[i] - 128) / 128
        const val2 = (timeDomainData[i + offset] - 128) / 128
        correlation += val1 * val2
      }
      
      if (correlation > bestCorrelation) {
        bestCorrelation = correlation
        bestOffset = offset
      }
    }

    if (bestCorrelation > 0.1 && bestOffset !== -1) {
      return sampleRate / bestOffset
    }
    return -1
  }

  useEffect(() => {
    if (!audioStream) return

    const audioContext = new (window.AudioContext || window.webkitAudioContext)()
    const analyser = audioContext.createAnalyser()
    analyser.fftSize = 256 // Larger size for better time-domain resolution
    analyser.smoothingTimeConstant = 0.6

    // Create a GainNode to boost input levels
    const gainNode = audioContext.createGain()
    gainNode.gain.value = micGain
    gainNodeRef.current = gainNode

    const source = audioContext.createMediaStreamSource(audioStream)
    source.connect(gainNode)
    gainNode.connect(analyser)

    audioContextRef.current = audioContext
    analyserRef.current = analyser

    const bufferLength = analyser.frequencyBinCount
    const dataArray = new Uint8Array(bufferLength)
    const timeDomainArray = new Uint8Array(analyser.fftSize)

    let lastSpeakingTime = Date.now()
    let pauseStart = null
    let pauseDurations = []

    const tick = () => {
      analyser.getByteFrequencyData(dataArray)
      setFrequencyData(new Uint8Array(dataArray.slice(0, 64)))

      analyser.getByteTimeDomainData(timeDomainArray)

      // Calculate RMS volume
      let sum = 0
      for (let i = 0; i < bufferLength; i++) {
        sum += dataArray[i] * dataArray[i]
      }
      const rms = Math.sqrt(sum / bufferLength) / 255
      setVolume(rms)

      // Pitch Detection
      const currentPitch = detectPitch(timeDomainArray, audioContext.sampleRate)
      if (currentPitch > 0) {
        const hz = Math.round(currentPitch)
        setPitch(hz)
        
        // Categorize Pitch
        if (hz < 85) {
          setPitchLabel('Too Low / Whispering')
        } else if (hz <= 250) {
          setPitchLabel('Ideal Conversational')
        } else {
          setPitchLabel('Too High / Loud')
        }
      } else {
        if (rms < 0.02) {
          setPitch(0)
          setPitchLabel('Silent')
        }
      }

      // Speech detection (threshold-based)
      const speaking = rms > 0.05
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
      gainNode.disconnect()
      audioContext.close()
    }
  }, [audioStream])

  return { 
    volume, 
    isSpeaking, 
    frequencyData, 
    stats, 
    updateStats,
    micGain,
    setMicGain,
    pitch,
    pitchLabel
  }
}
