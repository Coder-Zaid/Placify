import { useState, useRef, useCallback, useEffect } from 'react'

/**
 * Hybrid Speech Recognition Hook.
 * - IF API keys are configured (Groq, OpenAI, Gemini): Uses high-accuracy 
 *   Cumulative Cloud Whisper Transcription.
 * - IF NO API key is configured: Falls back to browser-native Web Speech API 
 *   (webkitSpeechRecognition) running 100% locally with zero latency.
 */
export function useSpeechRecognition() {
  const [transcript, setTranscript] = useState('')
  const [interimTranscript, setInterimTranscript] = useState('')
  const [isListening, setIsListening] = useState(false)
  const [isSupported, setIsSupported] = useState(true)
  const [speechError, setSpeechError] = useState(null)
  
  // MediaRecorder states (Whisper)
  const mediaRecorderRef = useRef(null)
  const isStartedRef = useRef(false)
  const streamRef = useRef(null)
  const cumulativeChunksRef = useRef([])
  const intervalRef = useRef(null)
  const lastRequestTimeRef = useRef(0)

  // Native SpeechRecognition states
  const nativeRecognitionRef = useRef(null)

  // Check browser support for native speech
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SpeechRecognition) {
      setIsSupported(false)
    }
  }, [])

  const start = useCallback(async () => {
    if (isStartedRef.current) return
    isStartedRef.current = true
    setIsListening(true)
    setSpeechError(null)
    setTranscript('')
    setInterimTranscript('')

    // Check if we have an API Key saved in localStorage
    let hasKey = false
    let apiKey = ''
    try {
      const keys = JSON.parse(localStorage.getItem('placify_api_keys') || '{}')
      apiKey = keys.GROQ_API_KEY || keys.GEMINI_API_KEY || keys.OPENAI_API_KEY || keys.ANTHROPIC_API_KEY
      if (apiKey) hasKey = true
    } catch (e) {}

    // =========================================================================
    // OPTION A: BROWSER NATIVE WEB SPEECH API (NO KEY - 100% LOCAL)
    // =========================================================================
    if (!hasKey) {
      console.log("[STT] No API Key detected. Using local Browser Web Speech API...")
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
      if (!SpeechRecognition) {
        setSpeechError("Browser does not support native speech recognition.")
        setIsListening(false)
        isStartedRef.current = false
        return
      }

      const recognition = new SpeechRecognition()
      recognition.continuous = true
      recognition.interimResults = true
      recognition.lang = 'en-US'

      recognition.onresult = (event) => {
        let finalText = ''
        let interimText = ''

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const result = event.results[i]
          if (result.isFinal) {
            finalText += result[0].transcript + ' '
          } else {
            interimText += result[0].transcript
          }
        }

        if (finalText) {
          setTranscript(prev => prev + finalText)
        }
        setInterimTranscript(interimText)
      }

      recognition.onerror = (event) => {
        console.error("[STT] Local Speech Error:", event.error)
        setSpeechError(event.error)
      }

      recognition.onend = () => {
        // Auto-restart if we are still supposed to be listening
        if (isStartedRef.current) {
          try {
            recognition.start()
          } catch (e) {}
        }
      }

      nativeRecognitionRef.current = recognition
      try {
        recognition.start()
      } catch (err) {
        setSpeechError(err.message)
        setIsListening(false)
        isStartedRef.current = false
      }
      return
    }

    // =========================================================================
    // OPTION B: CUMULATIVE CLOUD WHISPER API (API KEY INSTALLED)
    // =========================================================================
    console.log("[STT] API Key detected. Using cumulative Groq/Cloud Whisper transcription...")
    cumulativeChunksRef.current = []

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream
      
      const mimeType = window.MediaRecorder && MediaRecorder.isTypeSupported('audio/webm') 
        ? 'audio/webm' 
        : 'audio/mp4'

      const mediaRecorder = new MediaRecorder(stream, { mimeType })
      mediaRecorderRef.current = mediaRecorder

      mediaRecorder.ondataavailable = async (event) => {
        if (event.data && event.data.size > 0) {
          cumulativeChunksRef.current.push(event.data)
          
          const extension = mimeType.split('/')[1]?.split(';')[0] || 'webm'
          const blob = new Blob(cumulativeChunksRef.current, { type: mimeType })
          
          const formData = new FormData()
          formData.append('file', blob, `chunk.${extension}`)
          if (apiKey) formData.append('api_key', apiKey)

          const requestTime = Date.now()
          lastRequestTimeRef.current = requestTime

          try {
            const baseUrl = import.meta.env.PROD ? '' : 'http://localhost:8000';
            const res = await fetch(`${baseUrl}/analyze/interview-studio/transcribe`, {
              method: 'POST',
              body: formData
            })
            const data = await res.json()
            
            if (requestTime >= lastRequestTimeRef.current && data.text) {
              setTranscript(data.text.trim())
            }
          } catch (err) {
            console.error('[SpeechRecognition] Transcribe error:', err)
          }
        }
      }

      mediaRecorder.start()

      // Request data slices every 4 seconds
      intervalRef.current = setInterval(() => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
          mediaRecorderRef.current.requestData()
        }
      }, 4000)
      
    } catch (err) {
      console.error('[SpeechRecognition] Mic access error:', err)
      setSpeechError(err.message || 'Microphone access denied')
      setIsListening(false)
      isStartedRef.current = false
    }
  }, [])
  
  const stop = useCallback(() => {
    isStartedRef.current = false
    setIsListening(false)
    setInterimTranscript('')

    // Stop Option A (Local Native)
    if (nativeRecognitionRef.current) {
      try {
        nativeRecognitionRef.current.stop()
      } catch (e) {}
      nativeRecognitionRef.current = null
    }

    // Stop Option B (Cloud Whisper)
    if (intervalRef.current) clearInterval(intervalRef.current)
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop()
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop())
    }
  }, [])
  
  const resetTranscript = useCallback(() => {
    setTranscript('')
    setInterimTranscript('')
    cumulativeChunksRef.current = []
  }, [])

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
      if (nativeRecognitionRef.current) {
        try {
          nativeRecognitionRef.current.stop()
        } catch (e) {}
      }
    }
  }, [])
  
  return {
    transcript,
    interimTranscript,
    isListening,
    start,
    stop,
    reset: resetTranscript,
    isSupported,
    speechError
  }
}
