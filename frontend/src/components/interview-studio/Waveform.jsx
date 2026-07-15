/* eslint-disable react/prop-types */
import { useRef, useEffect } from 'react'

/**
 * Real-time audio waveform visualization using Canvas.
 */
const Waveform = ({ frequencyData, isSpeaking, className = '', barColor = '#2563EB' }) => {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    const dpr = window.devicePixelRatio || 1

    canvas.width = canvas.offsetWidth * dpr
    canvas.height = canvas.offsetHeight * dpr
    ctx.scale(dpr, dpr)

    const width = canvas.offsetWidth
    const height = canvas.offsetHeight
    const barCount = Math.min(frequencyData.length, 32)
    const barWidth = width / barCount - 2
    const maxBarHeight = height * 0.85

    ctx.clearRect(0, 0, width, height)

    for (let i = 0; i < barCount; i++) {
      const value = frequencyData[i] || 0
      const barHeight = Math.max(2, (value / 255) * maxBarHeight)
      const x = i * (barWidth + 2) + 1
      const y = (height - barHeight) / 2

      // Gradient per bar
      const gradient = ctx.createLinearGradient(x, y, x, y + barHeight)
      if (isSpeaking) {
        gradient.addColorStop(0, barColor)
        gradient.addColorStop(1, `${barColor}66`)
      } else {
        gradient.addColorStop(0, '#D1D5DB')
        gradient.addColorStop(1, '#E5E7EB')
      }

      ctx.fillStyle = gradient
      ctx.beginPath()
      ctx.roundRect(x, y, barWidth, barHeight, 2)
      ctx.fill()
    }
  }, [frequencyData, isSpeaking, barColor])

  return (
    <canvas
      ref={canvasRef}
      className={`w-full h-12 ${className}`}
      style={{ imageRendering: 'auto' }}
    />
  )
}

export default Waveform
