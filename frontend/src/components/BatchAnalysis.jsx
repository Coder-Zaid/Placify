/* eslint-disable react/prop-types */
import { useState, useEffect } from 'react'
import { Upload, Loader, Download, AlertCircle, Info, Clock, Zap } from 'lucide-react'
import axios from 'axios'
import Results from './Results'

export default function BatchAnalysis({ apiKey, data, updateData, addToast }) {
  const [timeLeft, setTimeLeft] = useState(0)
  const [totalTime, setTotalTime] = useState(0)

  // Extract state from props
  const { jdText, csvFile, csvText, isLoading, error, results } = data

  // Handle time countdown
  useEffect(() => {
    if (!isLoading) {
      setTimeLeft(0)
      return
    }

    const interval = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(interval)
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [isLoading])

  const handleCsvUpload = (e) => {
    const file = e.target.files[0]
    if (!file) return

    updateData({ csvFile: file })
    const reader = new FileReader()
    reader.onload = (event) => {
      updateData({ csvText: event.target.result })
      try {
        const lines = event.target.result.split('\n').filter(line => line.trim())
        const rowCount = Math.max(0, lines.length - 1)
        addToast(`CSV loaded with ${rowCount} students`, {
          type: 'success',
          title: 'CSV Uploaded Successfully',
          duration: 3000
        })
      } catch (err) {
        console.error('Error parsing CSV:', err)
      }
    }
    reader.readAsText(file)
  }

  const handleOfflineBatch = async () => {
    updateData({ error: '' })

    if (!jdText.trim()) {
      const err = 'Please enter a job description'
      updateData({ error: err })
      addToast(err, { type: 'error', title: 'Missing Input', duration: 4000 })
      return
    }

    if (!csvText.trim()) {
      const err = 'Please upload a CSV file with student data'
      updateData({ error: err })
      addToast(err, { type: 'error', title: 'Missing CSV', duration: 4000 })
      return
    }

    const lines = csvText.split('\n').filter(line => line.trim())
    const rowCount = Math.max(0, lines.length - 1)
    const estimatedSeconds = Math.max(5, rowCount * 2)
    
    setTotalTime(estimatedSeconds)
    setTimeLeft(estimatedSeconds)

    updateData({ isLoading: true, results: null })

    try {
      const response = await axios.post('http://localhost:8000/analyze/batch/offline', {
        jd_text: jdText,
        csv_data: csvText,
        api_key: 'offline_dummy_key'
      })
      
      if (!response.data || !response.data.results) {
        const err = 'Backend returned invalid response format. Check console logs.'
        updateData({ error: err })
        addToast(err, { type: 'error', title: 'Invalid Response', duration: 4000 })
        return
      }
      
      updateData({ results: response.data })
      addToast(`Fast Logic Complete! ${response.data.results.length} students scored instantly.`, {
        type: 'success',
        title: 'Instant Report Generated!',
        duration: 4000
      })
    } catch (err) {
      console.error('[BatchAnalysis] Offline Error:', err)
      const errorDetail = err.response?.data?.detail || err.message || 'Unknown error'
      let friendlyError = errorDetail
      if (err.code === 'ERR_NETWORK') {
        friendlyError = "Cannot connect to backend. Make sure the backend server is running on http://localhost:8000"
      }
      
      updateData({ error: friendlyError || 'Offline analysis failed. Please try again.' })
      addToast(friendlyError, { type: 'error', title: 'Offline Error', duration: 5000 })
    } finally {
      updateData({ isLoading: false })
      setTimeLeft(0)
    }
  }

  const handleAnalyze = async () => {
    updateData({ error: '' })

    if (!jdText.trim()) {
      const err = 'Please enter a job description'
      updateData({ error: err })
      addToast(err, { type: 'error', title: 'Missing Input', duration: 4000 })
      return
    }

    if (!csvText.trim()) {
      const err = 'Please upload a CSV file with student data'
      updateData({ error: err })
      addToast(err, { type: 'error', title: 'Missing CSV', duration: 4000 })
      return
    }

    if (!apiKey) {
      const err = 'Please enter your API key in the sidebar first'
      updateData({ error: err })
      addToast(err, { type: 'error', title: 'No API Key', duration: 4000 })
      return
    }

    const lines = csvText.split('\n').filter(line => line.trim())
    const rowCount = Math.max(0, lines.length - 1)
    const estimatedSeconds = rowCount * 10
    
    setTotalTime(estimatedSeconds)
    setTimeLeft(estimatedSeconds)

    updateData({ isLoading: true, results: null })

    try {
      const response = await axios.post('http://localhost:8000/analyze/batch', {
        jd_text: jdText,
        csv_data: csvText,
        api_key: apiKey
      })
      
      if (!response.data || !response.data.results) {
        const err = 'Backend returned invalid response format. Check console logs.'
        updateData({ error: err })
        addToast(err, { type: 'error', title: 'Invalid Response', duration: 4000 })
        return
      }
      
      updateData({ results: response.data })
      addToast(`Analysis complete! ${response.data.results.length} students scored.`, {
        type: 'success',
        title: 'Report Generation Complete!',
        duration: 4000
      })
    } catch (err) {
      console.error('[BatchAnalysis] Error:', err)
      const errorDetail = err.response?.data?.detail || err.message || 'Unknown error'
      let friendlyError = errorDetail
      updateData({ error: friendlyError || 'Error analyzing batch. Please try again.' })
      addToast(friendlyError, { type: 'error', title: 'Analysis Error', duration: 5000 })
    } finally {
      updateData({ isLoading: false })
      setTimeLeft(0)
    }
  }

  const downloadResults = () => {
    if (!results) return

    const csv = convertToCSV(results.results)
    const element = document.createElement('a')
    element.setAttribute('href', 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv))
    element.setAttribute('download', 'placify_analysis_results.csv')
    element.style.display = 'none'
    document.body.appendChild(element)
    element.click()
    document.body.removeChild(element)
  }

  const convertToCSV = (data) => {
    if (!data || data.length === 0) return ''

    const headers = ['Name', 'Roll Number', 'CGPA', 'Final Score', 'Tier', 'Eligible', 'Present Skills', 'Missing Skills', 'Confidence Level']
    const rows = data.map(item => [
      item.name,
      item.roll_number,
      item.cgpa,
      item.final_score,
      item.tier,
      item.eligible ? 'Yes' : 'No',
      item.present_skills.join('; '),
      item.missing_skills.join('; '),
      item.confidence_level
    ])

    return [headers, ...rows].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n')
  }

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div className="space-y-12">
      {/* Input Section */}
      <div className="q-card space-y-8">
        <div>
          <h2 className="text-2xl font-medium tracking-tight text-[#0F0F11]">Institutional Batch Analysis</h2>
          <p className="text-sm text-[#6F6F75] mt-1">Upload a student batch list in CSV format to run qualification criteria scoring.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Job Description */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-[#6F6F75] uppercase tracking-wider">
              Job Description
            </label>
            <textarea
              value={jdText}
              onChange={(e) => updateData({ jdText: e.target.value })}
              placeholder="Paste the complete job description here..."
              className="textarea-field h-52 font-display text-sm leading-relaxed"
            />
          </div>

          {/* CSV Upload */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-[#6F6F75] uppercase tracking-wider">
              Student CSV File
            </label>
            <div className="border border-[#0F0F11]/10 rounded-[14px] bg-[#FAFAF8] p-10 text-center hover:border-[#0F0F11] transition cursor-pointer flex flex-col items-center justify-center h-52">
              <input
                type="file"
                accept=".csv"
                onChange={handleCsvUpload}
                className="hidden"
                id="csv-input"
              />
              <label htmlFor="csv-input" className="cursor-pointer space-y-3">
                <Upload className="mx-auto h-6 w-6 text-[#6F6F75] stroke-[1.5]" />
                <div>
                  <p className="text-sm font-medium text-[#0F0F11]">Upload students CSV</p>
                  <p className="text-xs text-[#A8A8AE] mt-1">Excel or database CSV exports</p>
                </div>
              </label>
            </div>
            {csvFile && (
              <p className="text-xs font-mono text-[#6F6F75] mt-2 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 bg-[#0F0F11] rounded-full inline-block"></span>
                {csvFile.name} Loaded
              </p>
            )}
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="border border-[#0F0F11]/10 rounded-[14px] p-5 flex items-start gap-4 bg-white">
            <AlertCircle className="h-5 w-5 text-[#0F0F11] mt-0.5 flex-shrink-0 stroke-[1.5]" />
            <div className="space-y-1">
              <h3 className="font-semibold text-sm text-[#0F0F11]">System Notice</h3>
              <p className="text-sm text-[#6F6F75] leading-relaxed">{error}</p>
            </div>
          </div>
        )}

        {/* Buttons */}
        <div className="flex flex-wrap gap-4 pt-4 border-t border-[#0F0F11]/10">
          <button
            onClick={handleAnalyze}
            disabled={isLoading}
            className="btn-primary"
          >
            {isLoading ? (
              <>
                <Loader className="h-4 w-4 animate-spin mr-2 stroke-[1.5]" />
                Analyzing Batch...
              </>
            ) : (
              'Run AI Deep Analysis'
            )}
          </button>

          <button
            onClick={handleOfflineBatch}
            disabled={isLoading}
            className="btn-secondary flex items-center gap-2"
          >
            <Zap className="h-4 w-4 stroke-[1.5]" />
            Fast Offline Run
          </button>

          {results && (
            <button
              onClick={downloadResults}
              className="btn-outline flex items-center gap-2"
            >
              <Download className="h-4 w-4 stroke-[1.5]" />
              Export Results
            </button>
          )}
        </div>

        {isLoading && (
          <div className="p-6 border border-[#0F0F11]/10 rounded-[14px] bg-white space-y-4">
            <div className="flex items-start gap-3">
              <Info className="h-5 w-5 text-[#0F0F11] mt-0.5 flex-shrink-0 stroke-[1.5]" />
              <div className="space-y-1">
                <p className="text-sm font-medium text-[#0F0F11]">Analyzing Placement Batch</p>
                <p className="text-sm text-[#6F6F75]">
                  Applying 4-pillar analysis parameters across student metrics. This process runs sequentially.
                </p>
              </div>
            </div>
            
            {/* ETA Timer */}
            {timeLeft > 0 && (
              <div className="flex items-center justify-between p-4 bg-[#FAFAF8] rounded-[10px] border border-[#0F0F11]/5">
                <div className="flex items-center gap-3">
                  <Clock className="h-5 w-5 text-[#6F6F75] stroke-[1.5]" />
                  <div>
                    <p className="text-xs font-mono text-[#A8A8AE] uppercase tracking-wider">Estimated Time Remaining</p>
                    <p className="text-lg font-mono font-medium text-[#0F0F11]">{formatTime(timeLeft)}</p>
                  </div>
                </div>
                <div className="w-24 h-1 bg-[#0F0F11]/10 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-[#0F0F11] transition-all duration-1000"
                    style={{ width: `${totalTime > 0 ? ((totalTime - timeLeft) / totalTime) * 100 : 0}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Results Section */}
      {results && <Results data={results} />}
    </div>
  )
}
