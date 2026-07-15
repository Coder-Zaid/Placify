/* eslint-disable react/prop-types */
import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Award, TrendingUp, TrendingDown, MessageSquare, Clock, BarChart2, ChevronDown, ChevronUp, Mic2, Eye } from 'lucide-react'
import RadarChart from '../RadarChart'
import ConfidenceTimeline from '../ConfidenceTimeline'

const DashboardStep = ({ results, onNext }) => {
  const [animatedScore, setAnimatedScore] = useState(0)
  const [expandedQuestion, setExpandedQuestion] = useState(null)
  const [showConfetti, setShowConfetti] = useState(false)

  const overallScore = results?.overallScore || 0
  const categories = results?.categories || []
  const questionResults = results?.questionResults || []
  const strengths = results?.strengths || []
  const weaknesses = results?.weaknesses || []
  const speechStats = results?.speechStats || {}

  // Animate score counter
  useEffect(() => {
    const duration = 2000
    const steps = 60
    const increment = overallScore / steps
    let current = 0
    const interval = setInterval(() => {
      current += increment
      if (current >= overallScore) {
        current = overallScore
        clearInterval(interval)
      }
      setAnimatedScore(Math.round(current))
    }, duration / steps)

    // Confetti on excellent score
    if (overallScore >= 80) {
      setTimeout(async () => {
        try {
          const confetti = (await import('canvas-confetti')).default
          confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } })
          setShowConfetti(true)
        } catch(e) { /* ignore */ }
      }, 2200)
    }

    return () => clearInterval(interval)
  }, [overallScore])

  const scoreColor = overallScore >= 80 ? '#16A34A' : overallScore >= 60 ? '#F59E0B' : '#DC2626'
  const scoreLabel = overallScore >= 80 ? 'Excellent' : overallScore >= 60 ? 'Good' : overallScore >= 40 ? 'Average' : 'Needs Work'

  const radarScores = [
    categories.find(c => c.name === 'Communication')?.score || 0,
    categories.find(c => c.name === 'Confidence')?.score || 0,
    categories.find(c => c.name === 'Technical Knowledge')?.score || 0,
    categories.find(c => c.name === 'Professionalism')?.score || 0,
    categories.find(c => c.name === 'Content Delivery')?.score || 0
  ]

  const timelineData = questionResults.map((q, i) => ({
    label: `Q${i + 1}`,
    score: q.score || 0
  }))

  return (
    <motion.div
      className="min-h-screen p-6 pb-24"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-2 pt-8">
          <h1 className="text-3xl font-bold text-[#111] tracking-tight">Interview Performance</h1>
          <p className="text-[#666]">Here's how you performed across all evaluation criteria.</p>
        </div>

        {/* Score + Radar row */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Overall Score */}
          <motion.div
            className="bg-white rounded-3xl border border-black/5 p-8 text-center shadow-sm"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            <div className="text-xs font-mono text-[#999] uppercase tracking-wider mb-4">Overall Score</div>
            <div className="relative w-40 h-40 mx-auto mb-4">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="42" fill="none" stroke="#F3F4F6" strokeWidth="8" />
                <motion.circle
                  cx="50" cy="50" r="42" fill="none" stroke={scoreColor} strokeWidth="8"
                  strokeLinecap="round"
                  strokeDasharray={`${2 * Math.PI * 42}`}
                  initial={{ strokeDashoffset: 2 * Math.PI * 42 }}
                  animate={{ strokeDashoffset: 2 * Math.PI * 42 * (1 - overallScore / 100) }}
                  transition={{ duration: 2, ease: 'easeOut' }}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-4xl font-bold" style={{ color: scoreColor }}>{animatedScore}</span>
                <span className="text-xs text-[#999] font-mono">/100</span>
              </div>
            </div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium" style={{ backgroundColor: `${scoreColor}15`, color: scoreColor }}>
              <Award className="w-4 h-4" />
              {scoreLabel}
            </div>
          </motion.div>

          {/* Radar Chart */}
          <motion.div
            className="bg-white rounded-3xl border border-black/5 p-6 shadow-sm flex items-center justify-center"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            <RadarChart scores={radarScores} size={260} />
          </motion.div>
        </div>

        {/* Strengths & Weaknesses */}
        <div className="grid md:grid-cols-2 gap-6">
          <motion.div
            className="bg-white rounded-2xl border border-black/5 p-6 shadow-sm"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.7 }}
          >
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="w-5 h-5 text-green-500" />
              <h3 className="font-bold text-[#111]">Strengths</h3>
            </div>
            <div className="space-y-2">
              {strengths.map((s, i) => (
                <div key={i} className="flex items-start gap-2 p-2 rounded-lg bg-green-50/50">
                  <span className="text-green-500 mt-0.5">✓</span>
                  <span className="text-sm text-[#333]">{s}</span>
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div
            className="bg-white rounded-2xl border border-black/5 p-6 shadow-sm"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.7 }}
          >
            <div className="flex items-center gap-2 mb-4">
              <TrendingDown className="w-5 h-5 text-orange-500" />
              <h3 className="font-bold text-[#111]">Areas to Improve</h3>
            </div>
            <div className="space-y-2">
              {weaknesses.map((w, i) => (
                <div key={i} className="flex items-start gap-2 p-2 rounded-lg bg-orange-50/50">
                  <span className="text-orange-500 mt-0.5">△</span>
                  <span className="text-sm text-[#333]">{w}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Confidence Timeline */}
        {timelineData.length > 1 && (
          <motion.div
            className="bg-white rounded-2xl border border-black/5 p-6 shadow-sm"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9 }}
          >
            <h3 className="font-bold text-[#111] mb-4 flex items-center gap-2">
              <BarChart2 className="w-5 h-5 text-[#2563EB]" />
              Confidence Timeline
            </h3>
            <ConfidenceTimeline data={timelineData} />
          </motion.div>
        )}

        {/* Speaking Statistics */}
        <motion.div
          className="bg-white rounded-2xl border border-black/5 p-6 shadow-sm"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.0 }}
        >
          <h3 className="font-bold text-[#111] mb-4 flex items-center gap-2">
            <Mic2 className="w-5 h-5 text-[#2563EB]" />
            Speaking Statistics
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Words/Min', value: speechStats.wpm || 0, unit: 'WPM' },
              { label: 'Total Words', value: speechStats.totalWords || 0, unit: '' },
              { label: 'Filler Words', value: speechStats.fillerWords || 0, unit: '' },
              { label: 'Avg Eye Contact', value: `${speechStats.avgEyeContact || 0}%`, unit: '' }
            ].map((stat, i) => (
              <div key={i} className="p-4 rounded-xl bg-[#FAFAFA] border border-black/5 text-center">
                <div className="text-2xl font-bold text-[#111]">{stat.value}</div>
                <div className="text-xs font-mono text-[#999] uppercase tracking-wider mt-1">{stat.label}</div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Question-wise Breakdown */}
        <motion.div
          className="bg-white rounded-2xl border border-black/5 p-6 shadow-sm"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.1 }}
        >
          <h3 className="font-bold text-[#111] mb-4 flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-[#2563EB]" />
            Question-wise Breakdown
          </h3>
          <div className="space-y-3">
            {questionResults.map((q, i) => (
              <div key={i} className="border border-black/5 rounded-xl overflow-hidden">
                <button
                  className="w-full flex items-center gap-4 p-4 text-left hover:bg-[#FAFAFA] transition-colors"
                  onClick={() => setExpandedQuestion(expandedQuestion === i ? null : i)}
                >
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold ${
                    q.score >= 80 ? 'bg-green-100 text-green-700' :
                    q.score >= 60 ? 'bg-yellow-100 text-yellow-700' :
                    'bg-red-100 text-red-700'
                  }`}>
                    {q.score}
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-medium text-[#111] line-clamp-1">{q.question}</div>
                    <div className="text-[10px] font-mono text-[#999]">{q.type} • {q.duration}s</div>
                  </div>
                  {expandedQuestion === i ? <ChevronUp className="w-4 h-4 text-[#999]" /> : <ChevronDown className="w-4 h-4 text-[#999]" />}
                </button>
                <AnimatePresence>
                  {expandedQuestion === i && (
                    <motion.div
                      className="px-4 pb-4 space-y-3"
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <div className="p-3 rounded-lg bg-[#FAFAFA]">
                        <div className="text-xs font-mono text-[#999] mb-1">Your Answer</div>
                        <p className="text-sm text-[#333]">{q.answer || 'No answer recorded'}</p>
                      </div>
                      {q.feedback && (
                        <div className="p-3 rounded-lg bg-[#2563EB]/5">
                          <div className="text-xs font-mono text-[#2563EB] mb-1">AI Feedback</div>
                          <p className="text-sm text-[#333]">{q.feedback}</p>
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        </motion.div>

        {/* CTA */}
        <motion.button
          onClick={onNext}
          className="w-full py-4 rounded-2xl bg-[#111] text-white font-semibold text-base hover:bg-[#222] shadow-lg transition-colors"
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.3 }}
        >
          View Improvement Roadmap →
        </motion.button>
      </div>
    </motion.div>
  )
}

export default DashboardStep
