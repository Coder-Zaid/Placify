/* eslint-disable react/prop-types */
import { useState } from 'react'
import { CheckCircle2, MessageSquare, Loader, ArrowRight } from 'lucide-react'
import axios from 'axios'

export default function InterviewModule({ apiKey, addToast }) {
  const [response, setResponse] = useState('')
  const [question, setQuestion] = useState('Explain the difference between a list and a tuple in Python.')
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState(null)

  const handleEvaluate = async () => {
    if (!response.trim()) {
      addToast('Please type in your answer response.', {
        type: 'error',
        title: 'Input Empty'
      })
      return
    }

    setIsLoading(true)
    try {
      const res = await axios.post('/analyze/interview/evaluate', {
        question,
        answer: response,
        api_key: apiKey
      })
      setResult(res.data)
      addToast('Answer evaluated successfully.', {
        type: 'success',
        title: 'Evaluation Complete'
      })
    } catch (err) {
      console.error('[Interview] Evaluation error:', err)
      addToast('Unable to complete interview assessment. Check server status.', {
        type: 'error',
        title: 'Evaluation Failed'
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleNextQuestion = () => {
    const questions = [
      'Explain the difference between a list and a tuple in Python.',
      'What is normalized database design?',
      'How does HTTP/2 improve performance compared to HTTP/1.1?',
      'Explain Time and Space Complexity in algorithms.'
    ]
    const nextIdx = (questions.indexOf(question) + 1) % questions.length
    setQuestion(questions[nextIdx])
    setResponse('')
    setResult(null)
  }

  return (
    <div className="space-y-12">
      <div className="q-card space-y-8">
        <div>
          <h2 className="text-2xl font-medium tracking-tight text-[#0F0F11]">Mock Practice Interview</h2>
          <p className="text-sm text-[#6F6F75] mt-1">Answer the technical challenge question to run sentiment and content score analysis.</p>
        </div>

        <div className="space-y-4">
          <div className="p-5 border border-[#0F0F11]/10 rounded-[14px] bg-[#FAFAF8]">
            <p className="text-xs font-mono text-[#A8A8AE] uppercase tracking-wider mb-2">Technical Question</p>
            <p className="text-base font-medium text-[#0F0F11]">{question}</p>
          </div>

          <div className="space-y-2">
            <label className="block text-xs font-semibold text-[#6F6F75] uppercase tracking-wider">Your Answer</label>
            <textarea
              value={response}
              onChange={(e) => setResponse(e.target.value)}
              placeholder="Provide a comprehensive technical explanation here..."
              className="textarea-field h-44 font-display text-sm leading-relaxed"
            />
          </div>
        </div>

        <div className="flex gap-4 pt-4 border-t border-[#0F0F11]/10">
          <button
            onClick={handleEvaluate}
            disabled={isLoading}
            className="btn-primary"
          >
            {isLoading && <Loader className="h-4 w-4 animate-spin mr-2" />}
            Evaluate Answer
          </button>

          <button
            onClick={handleNextQuestion}
            className="btn-secondary"
          >
            Next Question
          </button>
        </div>
      </div>

      {result && (
        <div className="q-card space-y-8">
          <div>
            <h3 className="text-xl font-medium tracking-tight text-[#0F0F11]">Evaluation Insights</h3>
            <p className="text-sm text-[#6F6F75] mt-1 font-mono">Pillar Analysis Result</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="border border-[#0F0F11]/10 rounded-[14px] p-5 bg-[#FAFAF8] space-y-1">
              <div className="text-xs font-mono text-[#A8A8AE] uppercase tracking-wider">Semantic Fit</div>
              <div className="text-3xl font-medium text-[#0F0F11]">{result.content_score}/100</div>
            </div>
            
            <div className="border border-[#0F0F11]/10 rounded-[14px] p-5 bg-[#FAFAF8] space-y-1">
              <div className="text-xs font-mono text-[#A8A8AE] uppercase tracking-wider">Sentiment Score</div>
              <div className="text-3xl font-medium text-[#0F0F11]">{result.sentiment_score}</div>
            </div>

            <div className="border border-[#0F0F11]/10 rounded-[14px] p-5 bg-[#FAFAF8] space-y-1">
              <div className="text-xs font-mono text-[#A8A8AE] uppercase tracking-wider">Tone Profile</div>
              <div className="text-xl font-medium text-[#0F0F11] pt-1">{result.tone}</div>
            </div>
          </div>

          <div className="space-y-4 pt-4 border-t border-[#0F0F11]/10">
            <h4 className="font-mono text-xs font-semibold text-[#6F6F75] uppercase tracking-widest">Recruiter Feedback</h4>
            <div className="p-5 border border-[#0F0F11]/10 rounded-[14px] bg-white space-y-2">
              <p className="text-sm text-[#6F6F75] leading-relaxed">{result.feedback}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
