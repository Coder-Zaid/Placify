/* eslint-disable react/prop-types */
import { motion } from 'framer-motion'

/**
 * Animated 5-axis radar/spider chart for evaluation categories.
 * Pure SVG with Framer Motion path animations.
 */
const CATEGORIES = ['Communication', 'Confidence', 'Technical', 'Professionalism', 'Content']

const RadarChart = ({ scores = [0, 0, 0, 0, 0], size = 240, className = '' }) => {
  const center = size / 2
  const radius = size / 2 - 30
  const angleStep = (2 * Math.PI) / 5

  // Generate polygon points for a given set of values (0-100)
  const getPoints = (values) => {
    return values.map((v, i) => {
      const angle = angleStep * i - Math.PI / 2
      const r = (v / 100) * radius
      return {
        x: center + r * Math.cos(angle),
        y: center + r * Math.sin(angle)
      }
    })
  }

  // Grid levels at 20, 40, 60, 80, 100%
  const gridLevels = [20, 40, 60, 80, 100]

  const dataPoints = getPoints(scores)
  const dataPath = dataPoints.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x},${p.y}`).join(' ') + ' Z'

  // Label positions (slightly outside the chart)
  const labelPoints = scores.map((_, i) => {
    const angle = angleStep * i - Math.PI / 2
    const r = radius + 20
    return {
      x: center + r * Math.cos(angle),
      y: center + r * Math.sin(angle)
    }
  })

  return (
    <div className={`relative ${className}`}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {/* Grid polygons */}
        {gridLevels.map((level) => {
          const pts = getPoints(Array(5).fill(level))
          const path = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x},${p.y}`).join(' ') + ' Z'
          return (
            <path
              key={level}
              d={path}
              fill="none"
              stroke="#E5E7EB"
              strokeWidth={level === 100 ? 1.5 : 0.5}
              opacity={0.6}
            />
          )
        })}

        {/* Axis lines */}
        {Array(5).fill(0).map((_, i) => {
          const angle = angleStep * i - Math.PI / 2
          const endX = center + radius * Math.cos(angle)
          const endY = center + radius * Math.sin(angle)
          return (
            <line
              key={i}
              x1={center}
              y1={center}
              x2={endX}
              y2={endY}
              stroke="#E5E7EB"
              strokeWidth={0.5}
            />
          )
        })}

        {/* Data polygon */}
        <motion.path
          d={dataPath}
          fill="rgba(37, 99, 235, 0.12)"
          stroke="#2563EB"
          strokeWidth={2}
          strokeLinejoin="round"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{ duration: 1.5, ease: 'easeOut' }}
        />

        {/* Data points */}
        {dataPoints.map((p, i) => (
          <motion.circle
            key={i}
            cx={p.x}
            cy={p.y}
            r={4}
            fill="#2563EB"
            stroke="white"
            strokeWidth={2}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.3 + i * 0.15, type: 'spring', stiffness: 200 }}
          />
        ))}

        {/* Labels */}
        {labelPoints.map((p, i) => (
          <text
            key={i}
            x={p.x}
            y={p.y}
            textAnchor="middle"
            dominantBaseline="middle"
            className="fill-[#666] text-[9px] font-mono"
          >
            {CATEGORIES[i]}
          </text>
        ))}

        {/* Score values next to data points */}
        {dataPoints.map((p, i) => (
          <motion.text
            key={`score-${i}`}
            x={p.x}
            y={p.y - 12}
            textAnchor="middle"
            className="fill-[#2563EB] text-[10px] font-bold"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 + i * 0.1 }}
          >
            {scores[i]}
          </motion.text>
        ))}
      </svg>
    </div>
  )
}

export default RadarChart
