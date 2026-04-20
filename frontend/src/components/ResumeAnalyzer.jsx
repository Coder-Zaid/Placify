/* eslint-disable react/prop-types */
import { useState, useCallback } from 'react'
import { Upload, Loader, AlertCircle, Info, Zap } from 'lucide-react'
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
      // Show success toast
      addToast(`PDF loaded: ${file.name}`, {
        type: 'success',
        title: '✓ Resume Uploaded Successfully',
        duration: 3000
      })
    }
    reader.readAsDataURL(file)
  }, [updateData, addToast])

  // --- THE NEW FAST LOGIC (OFFLINE) ENGINE ---
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
    console.log('[ResumeAnalyzer] Starting OFFLINE analysis...')

    try {
      const response = await axios.post('http://localhost:8000/analyze/resume/offline', {
        jd_text: jdText,
        resume_base64: resumeBase64
      })
      
      updateData({ results: response.data })
      console.log('[ResumeAnalyzer] ✅ Offline Analysis complete')
      
      addToast('Fast Analysis Complete (Offline)', {
        type: 'success',
        title: '⚡ Instant Report Generated',
        duration: 3000
      })
    } catch (err) {
      console.error('[ResumeAnalyzer] Offline Error:', err)
      const errorDetail = err.response?.data?.detail || "Offline engine failed. Ensure backend offline route is running."
      updateData({ error: errorDetail })
      addToast(errorDetail, { type: 'error', title: 'Offline Error', duration: 5000 })
    } finally {
      updateData({ isLoading: false })
      setIsAnalyzing(false)
    }
  }, [jdText, resumeBase64, updateData, addToast])

  // --- THE OLD AI ENGINE (Currently Rate Limited) ---
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
      addToast('Resume analysis complete!', { type: 'success', title: '✅ Report Complete!', duration: 4000 })
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
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Single Resume Analyzer</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Job Description</label>
            <textarea
              value={jdText}
              onChange={(e) => updateData({ jdText: e.target.value })}
              placeholder="Paste job requirements here..."
              className="textarea-field h-48"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Resume PDF</label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-placify-primary transition cursor-pointer">
              <input
                type="file"
                accept=".pdf"
                onChange={handleResumUpload}
                className="hidden"
                id="resume-input"
              />
              <label htmlFor="resume-input" className="cursor-pointer">
                <Upload className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                <p className="text-sm font-medium text-gray-700">Click to upload PDF</p>
              </label>
            </div>
            {resumeFile && <p className="text-sm text-placify-success mt-2">✓ {resumeFile.name} uploaded</p>}
          </div>
        </div>

        {error && (
          <div className="bg-placify-danger/10 border border-placify-danger rounded-lg p-4 mb-4 flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-placify-danger mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="font-semibold text-placify-danger">Error</h3>
              <p className="text-sm text-placify-danger">{error}</p>
            </div>
          </div>
        )}

        {/* --- DUAL BUTTON LAYOUT --- */}
        <div className="flex flex-wrap gap-4 mt-6">
          <button
            onClick={handleAnalyze}
            disabled={isLoading}
            className="btn-primary flex items-center gap-2"
          >
            {isLoading && isAnalyzing ? <Loader className="h-4 w-4 animate-spin" /> : null}
            Analyze with AI
          </button>

          <button
            onClick={handleOfflineAnalyze}
            disabled={isLoading || !resumeBase64}
            className="px-6 py-2 rounded-lg bg-slate-800 text-white font-semibold hover:bg-slate-900 transition flex items-center gap-2 shadow-lg"
          >
            <Zap className="h-4 w-4 fill-yellow-400 text-yellow-400" />
            Run Fast Logic (Offline)
          </button>
        </div>
      </div>

      {/* Results Section */}
      {results && (
        <div className="bg-white rounded-lg shadow p-6 space-y-6">
          <h3 className="text-lg font-bold text-gray-900">Analysis Results</h3>
          <div className="metric-card">
            <div className="text-sm font-medium text-gray-600">Overall Score</div>
            <div className="text-3xl font-bold text-placify-primary mt-2">{results.overall_score}</div>
          </div>
          <div className="metric-card">
            <div className="text-sm font-medium text-gray-600">Recommendation</div>
            <div className={`text-lg font-bold mt-2 ${getRecognitionColor(results.recommendation)}`}>
              {results.recommendation}
            </div>
          </div>
          
          {/* Strengths & Gaps Mapping */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             {results.strengths && results.strengths.length > 0 && (
              <div className="summary-box">
                <h4 className="font-semibold text-placify-success mb-3">✓ Key Strengths</h4>
                <ul className="space-y-2">
                  {results.strengths.map((strength, idx) => (
                    <li key={idx} className="text-sm text-gray-700 flex items-start gap-2">
                      <span className="text-placify-success mt-1">•</span>
                      <span>{strength}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {results.gaps && results.gaps.length > 0 && (
              <div className="summary-box">
                <h4 className="font-semibold text-placify-warning mb-3">⚠ Skill Gaps</h4>
                <ul className="space-y-2">
                  {results.gaps.map((gap, idx) => (
                    <li key={idx} className="text-sm text-gray-700 flex items-start gap-2">
                      <span className="text-placify-warning mt-1">•</span>
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

function getRecognitionColor(recommendation) {
  if (!recommendation) return 'text-gray-700'
  switch (recommendation.toLowerCase()) {
    case 'highly recommended': return 'text-placify-success'
    case 'recommended': return 'text-blue-600'
    case 'consider': return 'text-placify-warning'
    case 'not recommended': return 'text-placify-danger'
    default: return 'text-gray-700'
  }
}