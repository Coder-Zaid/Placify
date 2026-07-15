/* eslint-disable react/prop-types */
import { motion } from 'framer-motion'

/**
 * Animated AI Interviewer Avatar using pure CSS/SVG.
 * States: idle, listening, thinking, speaking
 */
const AIAvatar = ({ state = 'idle', className = '' }) => {
  const isListening = state === 'listening'
  const isThinking = state === 'thinking'
  const isSpeaking = state === 'speaking'

  return (
    <div className={`relative flex items-center justify-center ${className}`}>
      {/* Ambient glow ring */}
      <motion.div
        className="absolute w-32 h-32 rounded-full"
        style={{
          background: isListening 
            ? 'radial-gradient(circle, rgba(37,99,235,0.15) 0%, transparent 70%)'
            : isSpeaking
              ? 'radial-gradient(circle, rgba(22,163,74,0.15) 0%, transparent 70%)'
              : 'radial-gradient(circle, rgba(17,17,17,0.05) 0%, transparent 70%)'
        }}
        animate={{ scale: isSpeaking ? [1, 1.15, 1] : isListening ? [1, 1.08, 1] : 1 }}
        transition={{ duration: isSpeaking ? 0.8 : 1.5, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* Head */}
      <motion.div
        className="relative w-24 h-24 rounded-full bg-gradient-to-b from-[#F5E6D3] to-[#E8D5C0] shadow-lg border border-black/5 overflow-hidden"
        animate={{
          rotateZ: isListening ? [0, 2, -1, 0] : isThinking ? [0, -3, 0] : 0,
          rotateY: isThinking ? [0, 8, -5, 0] : 0
        }}
        transition={{ duration: isListening ? 2 : 3, repeat: Infinity, ease: 'easeInOut' }}
      >
        {/* Hair */}
        <div className="absolute top-0 left-0 right-0 h-8 bg-gradient-to-b from-[#2C1810] to-[#3D2315] rounded-t-full" />

        {/* Face area */}
        <div className="absolute top-8 left-0 right-0 bottom-0 flex flex-col items-center">
          {/* Eyes container */}
          <div className="flex gap-5 mt-2">
            {/* Left eye */}
            <motion.div className="relative w-3.5 h-3.5 flex items-center justify-center">
              <motion.div
                className="w-3 h-3 rounded-full bg-[#1A1A1A]"
                animate={{
                  scaleY: isThinking ? [1, 0.1, 1] : [1, 1, 0.1, 1, 1],
                  x: isThinking ? [0, -1, 1, 0] : 0
                }}
                transition={{
                  scaleY: { duration: isThinking ? 0.3 : 4, repeat: Infinity, repeatDelay: isThinking ? 0.8 : 2 },
                  x: { duration: 2, repeat: Infinity, ease: 'easeInOut' }
                }}
              />
              {/* Eye highlight */}
              <div className="absolute top-0.5 right-0.5 w-1 h-1 rounded-full bg-white/60" />
            </motion.div>

            {/* Right eye */}
            <motion.div className="relative w-3.5 h-3.5 flex items-center justify-center">
              <motion.div
                className="w-3 h-3 rounded-full bg-[#1A1A1A]"
                animate={{
                  scaleY: isThinking ? [1, 0.1, 1] : [1, 1, 0.1, 1, 1],
                  x: isThinking ? [0, -1, 1, 0] : 0
                }}
                transition={{
                  scaleY: { duration: isThinking ? 0.3 : 4, repeat: Infinity, repeatDelay: isThinking ? 0.8 : 2, delay: 0.05 },
                  x: { duration: 2, repeat: Infinity, ease: 'easeInOut' }
                }}
              />
              <div className="absolute top-0.5 right-0.5 w-1 h-1 rounded-full bg-white/60" />
            </motion.div>
          </div>

          {/* Nose hint */}
          <div className="w-1 h-1.5 rounded-full bg-[#D4BC9F] mt-1.5" />

          {/* Mouth */}
          <motion.div
            className="mt-1.5 rounded-full bg-[#C4726C]"
            animate={{
              width: isSpeaking ? ['12px', '16px', '10px', '14px', '12px'] : isListening ? '14px' : '12px',
              height: isSpeaking ? ['4px', '8px', '3px', '7px', '4px'] : '4px',
              borderRadius: isSpeaking ? '50%' : '9999px'
            }}
            transition={{ duration: isSpeaking ? 0.5 : 0.3, repeat: isSpeaking ? Infinity : 0, ease: 'easeInOut' }}
          />
        </div>
      </motion.div>

      {/* Status label */}
      <motion.div
        className="absolute -bottom-6 text-[10px] font-mono tracking-wider uppercase"
        style={{ 
          color: isListening ? '#2563EB' : isSpeaking ? '#16A34A' : isThinking ? '#F59E0B' : '#666666' 
        }}
        animate={{ opacity: [0.6, 1, 0.6] }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        {state === 'listening' && '● Listening...'}
        {state === 'thinking' && '◐ Thinking...'}
        {state === 'speaking' && '◉ Speaking...'}
        {state === 'idle' && '○ Ready'}
      </motion.div>
    </div>
  )
}

export default AIAvatar
