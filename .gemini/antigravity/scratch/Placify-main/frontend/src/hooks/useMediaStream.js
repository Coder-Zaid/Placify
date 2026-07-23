import { useState, useRef, useCallback, useEffect } from 'react'

/**
 * Hook to manage camera and microphone media streams.
 * Returns refs, state, and controls for video/audio access.
 */
export function useMediaStream() {
  const videoRef = useRef(null)
  const streamRef = useRef(null)
  const [isVideoReady, setIsVideoReady] = useState(false)
  const [isAudioReady, setIsAudioReady] = useState(false)
  const [error, setError] = useState(null)
  const [audioStream, setAudioStream] = useState(null)

  const startMedia = useCallback(async ({ video = true, audio = true } = {}) => {
    try {
      setError(null)
      const constraints = {
        video: video ? { width: 640, height: 480, facingMode: 'user' } : false,
        audio: audio ? { echoCancellation: true, noiseSuppression: true } : false
      }
      const stream = await navigator.mediaDevices.getUserMedia(constraints)
      streamRef.current = stream

      if (video && videoRef.current) {
        videoRef.current.srcObject = stream
        videoRef.current.onloadedmetadata = () => {
          videoRef.current.play()
          setIsVideoReady(true)
        }
      }

      if (audio) {
        setAudioStream(stream)
        setIsAudioReady(true)
      }

      return stream
    } catch (err) {
      console.warn('[useMediaStream] Media access failed:', err.name, err.message)
      if (video && audio) {
        console.log('[useMediaStream] Retrying with audio only...')
        return startMedia({ video: false, audio: true })
      }
      setError(err.name === 'NotAllowedError' 
        ? 'Permission denied. Please allow camera/microphone access in your browser settings.'
        : err.name === 'NotFoundError'
          ? 'No camera or microphone found. Please connect a device.'
          : `Media error: ${err.message}`
      )
      return null
    }
  }, [])

  const stopMedia = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null
    }
    setIsVideoReady(false)
    setIsAudioReady(false)
    setAudioStream(null)
  }, [])

  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop())
      }
    }
  }, [])

  return { videoRef, audioStream, isVideoReady, isAudioReady, error, startMedia, stopMedia, streamRef }
}
