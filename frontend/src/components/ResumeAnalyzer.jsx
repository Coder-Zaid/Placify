/* eslint-disable react/prop-types */
import { useState, useCallback } from 'react'
import { Upload, Loader, AlertCircle, Zap } from 'lucide-react'
import axios from 'axios'

export default function ResumeAnalyzer({ apiKey, data, updateData, addToast }) {
  const [isAnalyzing, setIsAnalyzing] = useState(false)

  // Extract state from props
  const { jdText, resumeFile, resumeBase64, isLoading, error, results } = data

  const handleResumUpload = useCallback((e) => {
    const file = e.target.files[0]
    if (!file) return

    updateData({ resumeFile: file })
    const reader = new FileReader()
    reader.onload = (event) => {
      updateData({ resumeBase64: event.target.result.split(',')[1] })
      addToast(`PDF loaded: ${file.name}`, {
        type: 'success',
        title: 'Resume Uploaded Successfully',
        duration: 3000
      })
    }
    reader.readAsDataURL(file)
  }, [updateData, addToast])

  // Offline logic
  const handleOfflineAnalyze = useCallback(async () => {
    updateData({ error: '' })

    if (!jdText.trim() || !resumeBase64) {
      const err = 'Please provide both a job description and a resume PDF'
      updateData({ error: err })
      addToast(err, { type: 'error', title: 'Missing Input' })
      return
    }

    updateData({ isLoading: true, results: null })
    setIsAnalyzing(true)

    try {
      const response = await axios.post('http://localhost:8000/analyze/resume/offline', {
        jd_text: jdText,
        resume_base64: resumeBase64,
        api_key: apiKey || "offline_dummy_key"
      })
      
      updateData({ results: response.data })
      addToast('Fast Analysis Complete (Offline)', {
        type: 'success',
        title: 'Report Generated',
        duration: 3000
      })
    } catch (err) {
      console.error('[ResumeAnalyzer] Offline Error:', err)
      let errorDetail = "Offline engine failed. Ensure backend offline route is running."
      
      if (err.response?.data?.detail) {
        if (Array.isArray(err.response.data.detail)) {
          errorDetail = err.response.data.detail.map(d => `${d.loc?.join('.') || 'Field'}: ${d.msg}`).join(' | ')
        } else if (typeof err.response.data.detail === 'string') {
          errorDetail = err.response.data.detail
        } else {
          errorDetail = JSON.stringify(err.response.data.detail)
        }
      } else if (err.message) {
        errorDetail = err.message
      }

      updateData({ error: errorDetail })
      addToast("Analysis failed", { type: 'error', title: 'Offline Error', duration: 5000 })
    } finally {
      updateData({ isLoading: false })
      setIsAnalyzing(false)
    }
  }, [jdText, resumeBase64, apiKey, updateData, addToast])

  // AI engine
  const handleAnalyze = useCallback(async () => {
    updateData({ error: '' })

    if (!jdText.trim()) {
      const err = 'Please enter a job description'
      updateData({ error: err })
      addToast(err, { type: 'error', title: 'Missing Input', duration: 4000 })
      return
    }

    if (!resumeBase64) {
      const err = 'Please upload a resume PDF'
      updateData({ error: err })
      addToast(err, { type: 'error', title: 'Missing PDF', duration: 4000 })
      return
    }

    if (!apiKey) {
      const err = 'Please enter your API key in the sidebar first'
      updateData({ error: err })
      addToast(err, { type: 'error', title: 'No API Key', duration: 4000 })
      return
    }

    updateData({ isLoading: true, results: null })
    setIsAnalyzing(true)

    try {
      const response = await axios.post('http://localhost:8000/analyze/resume', {
        jd_text: jdText,
        resume_base64: resumeBase64,
        api_key: apiKey
      })

      if (!response.data) throw new Error("Invalid response")
      
      updateData({ results: response.data })
      addToast('Resume analysis complete!', { type: 'success', title: 'Report Complete!', duration: 4000 })
    } catch (err) {
      const errorDetail = err.response?.data?.detail || err.message || 'Unknown error'
      updateData({ error: errorDetail })
      addToast(errorDetail, { type: 'error', title: 'Analysis Error', duration: 5000 })
    } finally {
      updateData({ isLoading: false })
      setIsAnalyzing(false)
    }
  }, [jdText, resumeBase64, apiKey, updateData, addToast])

  return (
    <div className="space-y-12">
      <div className="q-card space-y-8">
        <div>
          <h2 className="text-2xl font-medium tracking-tight text-[#0F0F11]">Single Resume Analyzer</h2>
          <p className="text-sm text-[#6F6F75] mt-1">Submit job requirements and a candidate resume to evaluate suitability.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-[#6F6F75] uppercase tracking-wider">Job Description</label>
            <textarea
              value={jdText}
              onChange={(e) => updateData({ jdText: e.target.value })}
              placeholder="Paste job requirements here..."
              className="textarea-field h-52 font-display text-sm leading-relaxed"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-xs font-semibold text-[#6F6F75] uppercase tracking-wider">Resume PDF</label>
            <div className="border border-[#0F0F11]/10 rounded-[14px] bg-[#FAFAF8] p-10 text-center hover:border-[#0F0F11] transition cursor-pointer flex flex-col items-center justify-center h-52">
              <input
                type="file"
                accept=".pdf"
                onChange={handleResumUpload}
                className="hidden"
                id="resume-input"
              />
              <label htmlFor="resume-input" className="cursor-pointer space-y-3">
                <Upload className="mx-auto h-6 w-6 text-[#6F6F75] stroke-[1.5]" />
                <div>
                  <p className="text-sm font-medium text-[#0F0F11]">Upload candidate PDF</p>
                  <p className="text-xs text-[#A8A8AE] mt-1">Only PDF format accepted</p>
                </div>
              </label>
            </div>
            {resumeFile && (
              <p className="text-xs font-mono text-[#6F6F75] mt-2 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 bg-[#0F0F11] rounded-full inline-block"></span>
                {resumeFile.name} Loaded
              </p>
            )}
          </div>
        </div>

        {error && (
          <div className="border border-[#0F0F11]/10 rounded-[14px] p-5 flex items-start gap-4 bg-white">
            <AlertCircle className="h-5 w-5 text-[#0F0F11] mt-0.5 flex-shrink-0 stroke-[1.5]" />
            <div className="space-y-1">
              <h3 className="font-semibold text-sm text-[#0F0F11]">System Notice</h3>
              <p className="text-sm text-[#6F6F75] leading-relaxed">{error}</p>
            </div>
          </div>
        )}

        <div className="flex flex-wrap gap-4 pt-4 border-t border-[#0F0F11]/10">
          <button
            onClick={handleAnalyze}
            disabled={isLoading}
            className="btn-primary"
          >
            {isLoading && isAnalyzing ? <Loader className="h-4 w-4 animate-spin mr-2 stroke-[1.5]" /> : null}
            Analyze with AI
          </button>

          <button
            onClick={handleOfflineAnalyze}
            disabled={isLoading || !resumeBase64}
            className="btn-secondary flex items-center gap-2"
          >
            <Zap className="h-4 w-4 stroke-[1.5]" />
            Fast Offline Run
          </button>
        </div>
      </div>

      {/* Results Section */}
      {results && (
        <div className="q-card space-y-8">
          <div>
            <h3 className="text-xl font-medium tracking-tight text-[#0F0F11]">Analysis Report</h3>
            <p className="text-sm text-[#6F6F75] mt-1">Generated metrics based on alignment profiles.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="border border-[#0F0F11]/10 rounded-[14px] p-6 bg-[#FAFAF8] space-y-1">
              <div className="font-mono text-xs text-[#A8A8AE] uppercase tracking-wider">Overall Score</div>
              <div className="text-4xl font-medium tracking-tight text-[#0F0F11] pt-1">{results.overall_score}<span className="text-lg text-[#6F6F75]">/100</span></div>
            </div>
            
            <div className="border border-[#0F0F11]/10 rounded-[14px] p-6 bg-[#FAFAF8] space-y-1">
              <div className="font-mono text-xs text-[#A8A8AE] uppercase tracking-wider">Recommendation Profile</div>
              <div className="text-2xl font-medium tracking-tight text-[#0F0F11] pt-2">
                {results.recommendation}
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4">
             {results.strengths && results.strengths.length > 0 && (
              <div className="space-y-4">
                <h4 className="font-mono text-xs font-semibold text-[#6F6F75] uppercase tracking-widest">Key Strengths</h4>
                <ul className="space-y-3">
                  {results.strengths.map((strength, idx) => (
                    <li key={idx} className="text-sm text-[#6F6F75] flex items-start gap-3 leading-relaxed">
                      <span className="text-[#0F0F11] font-mono mt-0.5">•</span>
                      <span>{strength}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {results.gaps && results.gaps.length > 0 && (
              <div className="space-y-4">
                <h4 className="font-mono text-xs font-semibold text-[#6F6F75] uppercase tracking-widest">Skill Gaps</h4>
                <ul className="space-y-3">
                  {results.gaps.map((gap, idx) => (
                    <li key={idx} className="text-sm text-[#6F6F75] flex items-start gap-3 leading-relaxed">
                      <span className="text-[#A8A8AE] font-mono mt-0.5">•</span>
                      <span>{gap}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}