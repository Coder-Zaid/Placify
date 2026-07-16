import { useState, useRef, useCallback, useEffect } from 'react'

/**
 * Hook wrapping a custom WebAssembly / Backend-proxied STT engine.
 * Records standalone, fully-headered audio slices, stops & restarts the recorder
 * dynamically every few seconds, and appends incoming transcriptions.
 * Completely immune to container headers concatenation corruptions!
 */
export function useSpeechRecognition() {
  const [transcript, setTranscript] = useState('')
  const [interimTranscript] = useState('')
  const [isListening, setIsListening] = useState(false)
  const [isSupported] = useState(true)
  const [speechError, setSpeechError] = useState(null)
  
  const mediaRecorderRef = useRef(null)
  const isStartedRef = useRef(false)
  const streamRef = useRef(null)
  const currentChunksRef = useRef([])
  const intervalRef = useRef(null)
  const fullTextRef = useRef('')

  const start = useCallback(async () => {
    if (isStartedRef.current) return
    isStartedRef.current = true
    setIsListening(true)
    setSpeechError(null)

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

          const blob = new Blob(currentChunksRef.current, { type: mimeType })
          const formData = new FormData()
          formData.append('file', blob, 'chunk.webm')
          
          try {
            const keys = JSON.parse(localStorage.getItem('placify_api_keys') || '{}')
            const apiKey = keys.GROQ_API_KEY || keys.GEMINI_API_KEY || keys.OPENAI_API_KEY
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
    if (intervalRef.current) clearInterval(intervalRef.current)
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop()
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop())
    }
  }, [])
  
  const resetTranscript = useCallback(() => {
    fullTextRef.current = ''
    setTranscript('')
    currentChunksRef.current = []
  }, [])

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
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
