/* eslint-disable react/prop-types */
import { motion } from 'framer-motion'
import { Calendar, Target, ArrowLeft, RotateCcw, BookOpen, MessageSquare, Brain, Lightbulb, Users } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

const CATEGORY_ICONS = {
  'Communication': MessageSquare,
  'Confidence': Lightbulb,
  'Technical Skills': Brain,
  'Interview Skills': Users,
  'Behavioral Questions': BookOpen
}

const RoadmapStep = ({ plan, onRetake }) => {
  const navigate = useNavigate()
  const weeks = plan?.weeks || []
  const dailyTips = plan?.dailyTips || []

  return (
    <motion.div
      className="min-h-screen p-6 pb-24"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-3 pt-8">
          <motion.div
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#2563EB]/5 border border-[#2563EB]/10"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
          >
            <Target className="w-4 h-4 text-[#2563EB]" />
            <span className="text-xs font-mono text-[#2563EB] tracking-wider uppercase">30-Day Plan</span>
          </motion.div>
          <h1 className="text-3xl font-bold text-[#111] tracking-tight">Your Improvement Roadmap</h1>
          <p className="text-[#666]">A personalized 30-day plan to sharpen your interview skills.</p>
        </div>

        {/* Weekly progression cards */}
        <div className="grid md:grid-cols-2 gap-6">
          {weeks.map((week, i) => (
            <motion.div
              key={i}
              className="bg-white rounded-2xl border border-black/5 p-6 shadow-sm"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + i * 0.15 }}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-[#2563EB]/10 flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-[#2563EB]" />
                </div>
                <div>
                  <h3 className="font-bold text-[#111]">Week {i + 1}</h3>
                  <p className="text-xs text-[#999] font-mono">{week.focus}</p>
                </div>
              </div>
              <div className="space-y-2">
                {week.tasks?.map((task, j) => (
                  <div key={j} className="flex items-start gap-2 p-2 rounded-lg bg-[#FAFAFA]">
                    <div className="w-5 h-5 rounded border border-black/10 flex items-center justify-center mt-0.5 shrink-0">
                      <span className="text-[10px] font-mono text-[#999]">{j + 1}</span>
                    </div>
                    <span className="text-sm text-[#333]">{task}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          ))}
        </div>

        {/* Daily exercises */}
        {dailyTips.length > 0 && (
          <motion.div
            className="bg-white rounded-2xl border border-black/5 p-6 shadow-sm"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
          >
            <h3 className="font-bold text-[#111] mb-4 flex items-center gap-2">
              <Lightbulb className="w-5 h-5 text-[#F59E0B]" />
              Daily Exercises
            </h3>
            <div className="grid md:grid-cols-2 gap-3">
              {dailyTips.map((tip, i) => {
                const Icon = CATEGORY_ICONS[tip.category] || BookOpen
                return (
                  <div key={i} className="flex items-start gap-3 p-3 rounded-xl bg-[#FAFAFA] border border-black/5">
                    <div className="w-8 h-8 rounded-lg bg-[#2563EB]/5 flex items-center justify-center shrink-0">
                      <Icon className="w-4 h-4 text-[#2563EB]" />
                    </div>
                    <div>
                      <div className="text-xs font-mono text-[#999] uppercase tracking-wider">{tip.category}</div>
                      <p className="text-sm text-[#333] mt-0.5">{tip.exercise}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          </motion.div>
        )}

        {/* CTAs */}
        <div className="flex gap-4">
          <motion.button
            onClick={onRetake}
            className="flex-1 py-4 rounded-2xl bg-[#111] text-white font-semibold text-base hover:bg-[#222] shadow-lg transition-colors flex items-center justify-center gap-2"
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
          >
            <RotateCcw className="w-4 h-4" />
            Retake Interview
          </motion.button>
          <motion.button
            onClick={() => navigate('/')}
            className="flex-1 py-4 rounded-2xl border border-black/10 text-[#111] font-semibold text-base hover:bg-black/5 transition-colors flex items-center justify-center gap-2"
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </motion.button>
        </div>
      </div>
    </motion.div>
  )
}

export default RoadmapStep
