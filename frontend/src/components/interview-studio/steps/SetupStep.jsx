/* eslint-disable react/prop-types */
import { useState } from 'react'
import { motion } from 'framer-motion'
import { Briefcase, Upload, ChevronRight, Sparkles, Sprout, Leaf, TreePine, Star, Trophy, Crown } from 'lucide-react'

const EXPERIENCE_LEVELS = [
  { label: 'Entry Level', desc: '0-1 years', icon: Sprout },
  { label: 'Junior', desc: '1-3 years', icon: Leaf },
  { label: 'Mid Level', desc: '3-5 years', icon: TreePine },
  { label: 'Senior', desc: '5-8 years', icon: Star },
  { label: 'Lead', desc: '8-12 years', icon: Trophy },
  { label: 'Executive', desc: '12+ years', icon: Crown }
]

const SetupStep = ({ config, setConfig, onNext }) => {
  const [dragOver, setDragOver] = useState(false)

  const handleResumeUpload = (file) => {
    if (file && file.type === 'application/pdf') {
      const reader = new FileReader()
      reader.onload = (e) => {
        setConfig(prev => ({ ...prev, resumeFile: file, resumeBase64: e.target.result }))
      }
      reader.readAsDataURL(file)
    }
  }

  const isValid = config.role?.trim()?.length > 0 && config.experience && config.resumeFile

  return (
    <motion.div
      className="flex items-center justify-center min-h-screen p-6"
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -30 }}
      transition={{ duration: 0.5 }}
    >
      <div className="w-full max-w-2xl space-y-8">
        {/* Header */}
        <div className="text-center space-y-3">
          <motion.div
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#2563EB]/5 border border-[#2563EB]/10"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <Sparkles className="w-4 h-4 text-[#2563EB]" />
            <span className="text-xs font-mono text-[#2563EB] tracking-wider uppercase">AI Interview Studio</span>
          </motion.div>
          <h1 className="text-4xl font-bold text-[#111] tracking-tight">Tell us about yourself</h1>
          <p className="text-[#666] text-lg">We'll tailor your interview to your profession and experience.</p>
        </div>

        {/* Form */}
        <div className="space-y-6">
          {/* Job Role */}
          <motion.div
            className="space-y-2"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
          >
            <label className="block text-xs font-semibold text-[#666] uppercase tracking-wider">Job Role *</label>
            <div className="relative">
              <Briefcase className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#999]" />
              <input
                type="text"
                value={config.role || ''}
                onChange={(e) => setConfig(prev => ({ ...prev, role: e.target.value }))}
                placeholder="Software Engineer"
                className="w-full pl-12 pr-4 py-4 bg-white border border-black/10 rounded-2xl text-[#111] placeholder:text-[#CCC] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB]/30 transition-all text-base"
              />
            </div>
          </motion.div>

          {/* Experience Level */}
          <motion.div
            className="space-y-3"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
          >
            <label className="block text-xs font-semibold text-[#666] uppercase tracking-wider">Experience Level *</label>
            <div className="grid grid-cols-3 gap-3">
              {EXPERIENCE_LEVELS.map((level) => (
                <motion.button
                  key={level.label}
                  onClick={() => setConfig(prev => ({ ...prev, experience: level.label }))}
                  className={`relative p-4 rounded-2xl border text-left transition-all ${
                    config.experience === level.label
                      ? 'bg-[#111] border-[#111] text-white shadow-lg'
                      : 'bg-white border-black/10 text-[#111] hover:border-black/20 hover:shadow-md'
                  }`}
                  whileHover={{ y: -2 }}
                  whileTap={{ scale: 0.97 }}
                >
                  <div className="mb-2">
                    <level.icon className={`w-5 h-5 ${config.experience === level.label ? 'text-white' : 'text-[#2563EB]'}`} />
                  </div>
                  <div className="text-sm font-semibold">{level.label}</div>
                  <div className={`text-[10px] font-mono ${config.experience === level.label ? 'text-white/60' : 'text-[#999]'}`}>
                    {level.desc}
                  </div>
                </motion.button>
              ))}
            </div>
          </motion.div>

          {/* Target Company (Optional) */}
          <motion.div
            className="space-y-2"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 }}
          >
            <label className="block text-xs font-semibold text-[#666] uppercase tracking-wider">
              Target Company <span className="text-[#CCC]">(optional)</span>
            </label>
            <input
              type="text"
              value={config.company || ''}
              onChange={(e) => setConfig(prev => ({ ...prev, company: e.target.value }))}
              placeholder="Google, Microsoft, etc."
              className="w-full px-4 py-4 bg-white border border-black/10 rounded-2xl text-[#111] placeholder:text-[#CCC] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB]/30 transition-all text-base"
            />
          </motion.div>

          {/* Resume Upload (Optional) */}
          <motion.div
            className="space-y-2"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.6 }}
          >
            <label className="block text-xs font-semibold text-[#666] uppercase tracking-wider">
              Resume Upload * <span className="text-[#CCC]">(compulsory PDF)</span>
            </label>
            <input
              id="resume-input"
              type="file"
              accept=".pdf"
              className="hidden"
              onChange={(e) => handleResumeUpload(e.target.files[0])}
            />
            <label
              htmlFor="resume-input"
              className={`relative block border-2 border-dashed rounded-2xl p-8 text-center transition-all cursor-pointer ${
                dragOver ? 'border-[#2563EB] bg-[#2563EB]/5' : config.resumeFile ? 'border-green-300 bg-green-50/50' : 'border-black/10 hover:border-black/20'
              }`}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => { e.preventDefault(); setDragOver(false); handleResumeUpload(e.dataTransfer.files[0]) }}
            >
              <Upload className={`w-6 h-6 mx-auto mb-2 ${config.resumeFile ? 'text-green-500' : 'text-[#CCC]'}`} />
              <p className="text-sm text-[#666]">
                {config.resumeFile ? config.resumeFile.name : 'Drop your resume here or click to browse'}
              </p>
            </label>
          </motion.div>
        </div>

        {/* CTA */}
        <motion.button
          onClick={onNext}
          disabled={!isValid}
          className={`w-full py-4 rounded-2xl font-semibold text-base flex items-center justify-center gap-3 transition-all ${
            isValid
              ? 'bg-[#111] text-white hover:bg-[#222] shadow-lg hover:shadow-xl'
              : 'bg-black/5 text-[#CCC] cursor-not-allowed'
          }`}
          whileHover={isValid ? { scale: 1.01 } : {}}
          whileTap={isValid ? { scale: 0.99 } : {}}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
        >
          <Sparkles className="w-5 h-5" />
          Start AI Interview
          <ChevronRight className="w-4 h-4" />
        </motion.button>
      </div>
    </motion.div>
  )
}

export default SetupStep
