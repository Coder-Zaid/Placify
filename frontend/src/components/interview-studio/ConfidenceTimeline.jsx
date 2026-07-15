/* eslint-disable react/prop-types */
import { motion } from 'framer-motion'

/**
 * SVG line chart showing confidence/score over time (per question).
 */
const ConfidenceTimeline = ({ data = [], className = '' }) => {
  // data: [{ label: 'Q1', score: 75 }, ...]
  if (data.length === 0) return null

  const width = 500
  const height = 160
  const padding = { top: 20, right: 20, bottom: 30, left: 40 }
  const chartW = width - padding.left - padding.right
  const chartH = height - padding.top - padding.bottom

  const maxScore = 100
  const xStep = data.length > 1 ? chartW / (data.length - 1) : chartW / 2

  const points = data.map((d, i) => ({
    x: padding.left + i * xStep,
    y: padding.top + chartH - (d.score / maxScore) * chartH,
    label: d.label,
    score: d.score
  }))

  const pathD = points
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x},${p.y}`)
    .join(' ')

  // Area fill path
  const areaD = pathD + ` L ${points[points.length - 1].x},${padding.top + chartH} L ${points[0].x},${padding.top + chartH} Z`

  // Grid lines at 25, 50, 75, 100
  const gridValues = [25, 50, 75, 100]

  return (
    <div className={`w-full ${className}`}>
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto">
        {/* Grid lines */}
        {gridValues.map(v => {
          const y = padding.top + chartH - (v / maxScore) * chartH
          return (
            <g key={v}>
              <line x1={padding.left} y1={y} x2={width - padding.right} y2={y} stroke="#F3F4F6" strokeWidth={1} />
              <text x={padding.left - 8} y={y + 3} textAnchor="end" className="fill-[#999] text-[8px] font-mono">{v}</text>
            </g>
          )
        })}

        {/* Area fill */}
        <motion.path
          d={areaD}
          fill="url(#confidenceGradient)"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.8 }}
        />

        {/* Line */}
        <motion.path
          d={pathD}
          fill="none"
          stroke="#2563EB"
          strokeWidth={2.5}
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 1.5, ease: 'easeOut' }}
        />

        {/* Data points */}
        {points.map((p, i) => (
          <g key={i}>
            <motion.circle
              cx={p.x}
              cy={p.y}
              r={4}
              fill="white"
              stroke="#2563EB"
              strokeWidth={2}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.3 + i * 0.15, type: 'spring' }}
            />
            {/* Score label */}
            <motion.text
              x={p.x}
              y={p.y - 10}
              textAnchor="middle"
              className="fill-[#2563EB] text-[9px] font-bold"
              initial={{ opacity: 0, y: p.y }}
              animate={{ opacity: 1, y: p.y - 10 }}
              transition={{ delay: 0.5 + i * 0.1 }}
            >
              {p.score}
            </motion.text>
            {/* X-axis label */}
            <text
              x={p.x}
              y={height - 8}
              textAnchor="middle"
              className="fill-[#999] text-[9px] font-mono"
            >
              {p.label}
            </text>
          </g>
        ))}

        {/* Gradient definition */}
        <defs>
          <linearGradient id="confidenceGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#2563EB" stopOpacity={0.2} />
            <stop offset="100%" stopColor="#2563EB" stopOpacity={0.02} />
          </linearGradient>
        </defs>
      </svg>
    </div>
  )
}

export default ConfidenceTimeline
