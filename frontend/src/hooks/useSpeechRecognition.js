import { useState, useRef, useCallback, useEffect } from 'react'

/**
 * Hook wrapping a custom Backend-proxied STT engine (like Groq Whisper).
 * Records continuously in a single audio buffer, requesting data slices
 * every few seconds to perform cumulative transcription.
 * 
 * This strategy preserves full sentence context for Whisper, eliminating boundary cuts
 * and spelling inaccuracies, while maintaining real-time text updates.
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
  const cumulativeChunksRef = useRef([])
  const intervalRef = useRef(null)
  const lastRequestTimeRef = useRef(0)

  const start = useCallback(async () => {
    if (isStartedRef.current) return
    isStartedRef.current = true
    setIsListening(true)
    setSpeechError(null)
    cumulativeChunksRef.current = []
    setTranscript('')

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
          
          // Construct cumulative blob containing all speech from the start
          const extension = mimeType.split('/')[1]?.split(';')[0] || 'webm'
          const blob = new Blob(cumulativeChunksRef.current, { type: mimeType })
          
          const formData = new FormData()
          formData.append('file', blob, `chunk.${extension}`)
          
          try {
            const keys = JSON.parse(localStorage.getItem('placify_api_keys') || '{}')
            const apiKey = keys.GROQ_API_KEY || keys.GEMINI_API_KEY || keys.OPENAI_API_KEY || keys.ANTHROPIC_API_KEY
            if (apiKey) formData.append('api_key', apiKey)
          } catch (e) {}

          const requestTime = Date.now()
          lastRequestTimeRef.current = requestTime

          try {
            const baseUrl = import.meta.env.PROD ? '' : 'http://localhost:8000';
            const res = await fetch(`${baseUrl}/analyze/interview-studio/transcribe`, {
              method: 'POST',
              body: formData
            })
            const data = await res.json()
            
            // Check sequence order to prevent race conditions from lagging network requests
            if (requestTime >= lastRequestTimeRef.current && data.text) {
              setTranscript(data.text.trim())
            }
          } catch (err) {
            console.error('[SpeechRecognition] Transcribe cumulative error:', err)
          }
        }
      }

      mediaRecorder.start()

      // Every 4 seconds, request accumulated media data without stopping the recorder
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
    cumulativeChunksRef.current = []
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
