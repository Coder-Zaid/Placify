import { useState, useRef, useCallback, useEffect } from 'react'

/**
 * Hook wrapping a custom WebAssembly / Backend-proxied STT engine (Whisper via Groq)
 * with a dynamic fallback to the browser's native Web Speech API if no API keys are entered.
 */
export function useSpeechRecognition() {
  const [transcript, setTranscript] = useState('')
  const [interimTranscript, setInterimTranscript] = useState('')
  const [isListening, setIsListening] = useState(false)
  const [isSupported] = useState(true)
  const [speechError, setSpeechError] = useState(null)
  
  const mediaRecorderRef = useRef(null)
  const isStartedRef = useRef(false)
  const streamRef = useRef(null)
  const currentChunksRef = useRef([])
  const intervalRef = useRef(null)
  const fullTextRef = useRef('')
  
  // Native fallback recognition reference
  const nativeRecognitionRef = useRef(null)

  const start = useCallback(async () => {
    if (isStartedRef.current) return
    isStartedRef.current = true
    setIsListening(true)
    setSpeechError(null)

    // Check if an API key is available in LocalStorage
    let hasApiKey = false
    try {
      const keys = JSON.parse(localStorage.getItem('placify_api_keys') || '{}')
      hasApiKey = !!(keys.GROQ_API_KEY || keys.GEMINI_API_KEY || keys.OPENAI_API_KEY || keys.ANTHROPIC_API_KEY)
    } catch(e) {}

    // OPTION A: If no key is found, fall back to Browser's free native Web Speech API
    if (!hasApiKey) {
      console.log("[SpeechRecognition] No API key detected. Using native Web Speech API...");
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
      if (SpeechRecognition) {
        try {
          const rec = new SpeechRecognition()
          rec.continuous = true
          rec.interimResults = true
          rec.lang = 'en-US'

          rec.onresult = (event) => {
            let interim = ''
            let final = ''
            for (let i = event.resultIndex; i < event.results.length; ++i) {
              if (event.results[i].isFinal) {
                final += event.results[i][0].transcript
              } else {
                interim += event.results[i][0].transcript
              }
            }
            if (final) {
              fullTextRef.current += (fullTextRef.current ? ' ' : '') + final
              setTranscript(fullTextRef.current)
            }
            setInterimTranscript(interim)
          }

          rec.onerror = (e) => {
            if (e.error === 'no-speech') return
            console.error('[SpeechRecognition] Native Web Speech error:', e.error)
          }

          rec.onend = () => {
            if (isStartedRef.current && nativeRecognitionRef.current) {
              try {
                nativeRecognitionRef.current.start()
              } catch (err) {}
            }
          }

          nativeRecognitionRef.current = rec
          rec.start()
          return
        } catch (nativeErr) {
          console.error('[SpeechRecognition] Native start error, trying mic recorder:', nativeErr)
        }
      }
    }

    // OPTION B: Use high-accuracy backend Groq/OpenAI Whisper
    console.log("[SpeechRecognition] API key active. Recording chunk streams for Whisper STT...");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream
      
      const mimeType = window.MediaRecorder && MediaRecorder.isTypeSupported('audio/webm') 
        ? 'audio/webm' 
        : 'audio/mp4'

      const initRecorder = () => {
        const mediaRecorder = new MediaRecorder(stream, { mimeType })
        mediaRecorderRef.current = mediaRecorder
        currentChunksRef.current = []

        mediaRecorder.ondataavailable = (event) => {
          if (event.data && event.data.size > 0) {
            currentChunksRef.current.push(event.data)
          }
        }

        mediaRecorder.onstop = async () => {
          if (currentChunksRef.current.length === 0) return

          const extension = mimeType.split('/')[1]?.split(';')[0] || 'webm'
          const blob = new Blob(currentChunksRef.current, { type: mimeType })
          const formData = new FormData()
          formData.append('file', blob, `chunk.${extension}`)
          
          try {
            const keys = JSON.parse(localStorage.getItem('placify_api_keys') || '{}')
            const apiKey = keys.GROQ_API_KEY || keys.GEMINI_API_KEY || keys.OPENAI_API_KEY || keys.ANTHROPIC_API_KEY
            if (apiKey) formData.append('api_key', apiKey)
          } catch(e) {}

          try {
            const baseUrl = import.meta.env.PROD ? '' : 'http://localhost:8000';
            const res = await fetch(`${baseUrl}/analyze/interview-studio/transcribe`, {
              method: 'POST',
              body: formData
            })
            const data = await res.json()
            if (data.text) {
              const cleaned = data.text.trim()
              if (cleaned) {
                fullTextRef.current += (fullTextRef.current ? ' ' : '') + cleaned
                setTranscript(fullTextRef.current)
              }
            }
          } catch (err) {
            console.error('[SpeechRecognition] Transcribe chunk error:', err)
          }

          // If still listening, start a fresh segment
          if (isStartedRef.current) {
            initRecorder()
            mediaRecorderRef.current.start()
          }
        };
      };

      initRecorder()
      mediaRecorderRef.current.start()

      // Stop & save recorder chunk every 4 seconds
      intervalRef.current = setInterval(() => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
          mediaRecorderRef.current.stop()
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
    
    // Stop native recognition if active
    if (nativeRecognitionRef.current) {
      try {
        nativeRecognitionRef.current.stop()
      } catch (e) {}
      nativeRecognitionRef.current = null
    }

    if (intervalRef.current) clearInterval(intervalRef.current)
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try {
        mediaRecorderRef.current.stop()
      } catch(e) {}
    }
    if (streamRef.current) {
      try {
        streamRef.current.getTracks().forEach(t => t.stop())
      } catch(e) {}
    }
  }, [])
  
  const resetTranscript = useCallback(() => {
    fullTextRef.current = ''
    setTranscript('')
    setInterimTranscript('')
    currentChunksRef.current = []
  }, [])

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
      if (nativeRecognitionRef.current) {
        try {
          nativeRecognitionRef.current.stop()
        } catch(e) {}
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
