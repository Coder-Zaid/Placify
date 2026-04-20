/* eslint-disable react/prop-types */
import { useState, useEffect } from 'react'
import { Upload, Loader, Download, AlertCircle, Info, Clock } from 'lucide-react'
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
      // Show success toast with row count
      try {
        const lines = event.target.result.split('\n').filter(line => line.trim())
        const rowCount = Math.max(0, lines.length - 1) // Subtract header
        addToast(`CSV loaded with ${rowCount} students`, {
          type: 'success',
          title: '✓ CSV Uploaded Successfully',
          duration: 3000
        })
      } catch (err) {
        console.error('Error parsing CSV:', err)
      }
    }
    reader.readAsText(file)
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

    // Calculate ETA: number of rows * 10 seconds per row (8s throttle + 2s buffer)
    const lines = csvText.split('\n').filter(line => line.trim())
    const rowCount = Math.max(0, lines.length - 1)
    const estimatedSeconds = rowCount * 10
    
    setTotalTime(estimatedSeconds)
    setTimeLeft(estimatedSeconds)

    updateData({ isLoading: true, results: null })
    console.log('[BatchAnalysis] Starting analysis...')

    try {
      console.log('[BatchAnalysis] Sending request to /analyze/batch...')
      const response = await axios.post('http://localhost:8000/analyze/batch', {
        jd_text: jdText,
        csv_data: csvText,
        api_key: apiKey
      })

      console.log('[BatchAnalysis] Response received:', response.status, response.data)
      
      if (!response.data || !response.data.results) {
        console.error('[BatchAnalysis] Invalid response format:', response.data)
        const err = 'Backend returned invalid response format. Check console logs.'
        updateData({ error: err })
        addToast(err, { type: 'error', title: 'Invalid Response', duration: 4000 })
        return
      }
      
      updateData({ results: response.data })
      console.log('[BatchAnalysis] ✅ Analysis complete:', response.data.results.length, 'results')
      
      // Show success toast
      addToast(`Analysis complete! ${response.data.results.length} students scored.`, {
        type: 'success',
        title: '✅ Report Generation Complete!',
        duration: 4000
      })
    } catch (err) {
      console.error('[BatchAnalysis] Error:', err)
      console.error('[BatchAnalysis] Error response:', err.response?.data)
      
      const errorDetail = err.response?.data?.detail || err.message || 'Unknown error'
      const errorStr = errorDetail.toString().toLowerCase()
      
      let friendlyError = errorDetail
      if (err.response?.status === 401 || 'api key' in errorStr) {
        friendlyError = "Please enter your API key in the sidebar to run AI analysis."
      } else if (err.response?.status === 429 || '429' in errorStr || 'quota' in errorStr || 'resource_exhausted' in errorStr) {
        friendlyError = "Rate limit reached. Wait 1 minute and retry. Your API key's daily quota may be exhausted."
      } else if (err.code === 'ERR_NETWORK') {
        friendlyError = "Cannot connect to backend. Make sure the backend server is running on http://localhost:8000"
      } else if (!err.response) {
        friendlyError = `Network error: ${err.message}. Is the backend running?`
      }
      
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
    <div className="space-y-6">
      {/* Input Section */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Institutional Batch Analysis</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {/* Job Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Job Description
            </label>
            <textarea
              value={jdText}
              onChange={(e) => updateData({ jdText: e.target.value })}
              placeholder="Paste the complete job description here..."
              className="textarea-field h-48"
            />
            <p className="text-xs text-gray-500 mt-2">
              Include required skills, CGPA minimum, aptitude requirements, and portfolio needs
            </p>
          </div>

          {/* CSV Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Student CSV File
            </label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-placify-primary transition cursor-pointer">
              <input
                type="file"
                accept=".csv"
                onChange={handleCsvUpload}
                className="hidden"
                id="csv-input"
              />
              <label htmlFor="csv-input" className="cursor-pointer">
                <Upload className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                <p className="text-sm font-medium text-gray-700">Click to upload CSV</p>
                <p className="text-xs text-gray-500">or drag and drop</p>
              </label>
            </div>
            {csvFile && (
              <p className="text-sm text-placify-success mt-2">✓ {csvFile.name} uploaded</p>
            )}
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-placify-danger/10 border border-placify-danger rounded-lg p-4 mb-4 flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-placify-danger mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="font-semibold text-placify-danger">Error</h3>
              <p className="text-sm text-placify-danger">{error}</p>
            </div>
          </div>
        )}

        {/* Buttons */}
        <div className="flex gap-3">
          <button
            onClick={handleAnalyze}
            disabled={isLoading}
            className="btn-primary flex items-center gap-2"
          >
            {isLoading ? (
              <>
                <Loader className="h-4 w-4 animate-spin" />
                Analyzing Batch...
              </>
            ) : (
              'Run AI Deep Analysis'
            )}
          </button>

          {results && (
            <button
              onClick={downloadResults}
              className="btn-secondary flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              Download Results
            </button>
          )}
        </div>

        {isLoading && (
          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg space-y-3">
            <div className="flex items-start gap-3">
              <Info className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-blue-800">
                ⏳ Analyzing students with 4-pillar scoring engine. This may take a few minutes depending on batch size and AI analysis depth.
              </p>
            </div>
            
            {/* ETA Timer */}
            {timeLeft > 0 && (
              <div className="flex items-center gap-3 bg-white rounded p-3 border border-blue-100">
                <Clock className="h-5 w-5 text-blue-600 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-xs font-semibold text-blue-700">Estimated Time Remaining</p>
                  <p className="text-lg font-mono font-bold text-blue-600">{formatTime(timeLeft)}</p>
                </div>
                <div className="w-16 h-1 bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-blue-600 transition-all duration-1000"
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
