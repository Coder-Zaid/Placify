/* eslint-disable react/prop-types */
import { ChevronDown, ChevronUp, AlertTriangle, CheckCircle, TrendingUp, Zap } from 'lucide-react'
import { useState } from 'react'

export default function Results({ data }) {
  const [expandedIndex, setExpandedIndex] = useState(null)

  const toggleExpand = (index) => {
    setExpandedIndex(expandedIndex === index ? null : index)
  }

  const getTierColor = (tier) => {
    switch (tier) {
      case 'Qualified': return 'bg-green-100 text-green-800 border-green-300'
      case 'Potential': return 'bg-blue-100 text-blue-800 border-blue-300'
      case 'Needs Training': return 'bg-orange-100 text-orange-800 border-orange-300'
      default: return 'bg-gray-100 text-gray-800 border-gray-300'
    }
  }

  const getConfidenceColor = (level) => {
    switch (level) {
      case 'High': return 'bg-green-100 text-green-800'
      case 'Medium': return 'bg-yellow-100 text-yellow-800'
      case 'Low': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getScorePercentage = (score, max) => {
    return Math.min((score / max) * 100, 100)
  }

  const countEligible = (results) => {
    return results.filter(r => r.eligible === true).length
  }

  const countByTier = (results, tier) => {
    return results.filter(r => r.tier === tier).length
  }

  return (
    <div className="bg-white rounded-lg shadow p-6 space-y-6">
      {/* Header Section */}
      <div>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Scoring Analysis Results</h2>
          <div className="text-sm text-gray-600">
            {data.analyzed_students} / {data.total_students} students analyzed
          </div>
        </div>

        {/* JD Intelligence Summary */}
        {data.jd_intelligence && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <h3 className="font-semibold text-blue-900 mb-3">JD Intelligence Summary</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm mb-3">
              <div>
                <p className="text-blue-700 font-medium">JD Type</p>
                <div className="mt-1 flex items-center gap-2">
                  {data.jd_intelligence.jd_type === 'service_based' && (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-blue-200 text-blue-800">
                      Service-Based JD (Track A)
                    </span>
                  )}
                  {data.jd_intelligence.jd_type === 'product_based' && (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-purple-200 text-purple-800">
                      Product-Based JD (Track B)
                    </span>
                  )}
                  {data.jd_intelligence.jd_type === 'academic' && (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-green-200 text-green-800">
                      Academic JD
                    </span>
                  )}
                  {data.jd_intelligence.jd_type === 'balanced' && (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-gray-200 text-gray-800">
                      Balanced JD
                    </span>
                  )}
                </div>
                <p className="text-xs text-blue-700 mt-2">{data.jd_intelligence.jd_type_description}</p>
              </div>
              <div>
                <p className="text-blue-700 font-medium">Skills Found</p>
                <p className="text-blue-900">{data.jd_intelligence.combined_skill_set?.length || 0}</p>
              </div>
              <div>
                <p className="text-blue-700 font-medium">Min CGPA</p>
                <p className="text-blue-900">{data.jd_intelligence.min_cgpa?.toFixed(2) || '0.00'}</p>
              </div>
              <div>
                <p className="text-blue-700 font-medium">Sample Skills Extracted</p>
                <p className="text-blue-900 text-xs">{data.jd_intelligence.combined_skill_set?.slice(0, 3).join(', ')}</p>
              </div>
            </div>
          </div>
        )}

        {/* Summary Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          <div className="metric-card">
            <div className="text-sm font-medium text-gray-600">Total</div>
            <div className="text-2xl font-bold text-gray-900">{data.total_students}</div>
          </div>
          <div className="metric-card">
            <div className="text-sm font-medium text-gray-600">Analyzed</div>
            <div className="text-2xl font-bold text-placify-success">{data.analyzed_students}</div>
          </div>
          <div className="metric-card">
            <div className="text-sm font-medium text-gray-600">Eligible</div>
            <div className="text-2xl font-bold text-green-600">{countEligible(data.results)}</div>
          </div>
          <div className="metric-card">
            <div className="text-sm font-medium text-gray-600">Qualified</div>
            <div className="text-2xl font-bold text-blue-600">{countByTier(data.results, 'Qualified')}</div>
          </div>
          <div className="metric-card">
            <div className="text-sm font-medium text-gray-600">Potential</div>
            <div className="text-2xl font-bold text-orange-600">{countByTier(data.results, 'Potential')}</div>
          </div>
        </div>
      </div>

      {/* Student Results List */}
      <div className="space-y-3">
        {data.results.map((result, index) => (
          <div
            key={index}
            className="border border-gray-200 rounded-lg hover:shadow-md transition"
          >
            {/* Header Row - Always Visible */}
            <button
              onClick={() => toggleExpand(index)}
              className="w-full text-left flex items-center justify-between p-4 hover:bg-gray-50"
            >
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <div className="font-bold text-gray-900">{result.name}</div>
                  <div className="text-xs text-gray-500">{result.roll_number}</div>
                </div>
                <div className="text-sm text-gray-600">CGPA: {result.cgpa?.toFixed(2)} | Score: {result.final_score}/100</div>
              </div>

              <div className="flex items-center gap-3">
                {/* Not Eligible Banner */}
                {!result.eligible && (
                  <div className="flex items-center gap-2 px-3 py-1 bg-red-100 border border-red-300 rounded">
                    <AlertTriangle className="h-4 w-4 text-red-600" />
                    <span className="text-xs font-semibold text-red-700">INELIGIBLE</span>
                  </div>
                )}

                {/* Score Badge with Tier Color */}
                {result.eligible && (
                  <div className={`px-3 py-1 border rounded text-sm font-semibold ${getTierColor(result.tier)}`}>
                    {result.final_score} • {result.tier}
                  </div>
                )}

                {/* Confidence Badge */}
                <div className={`px-3 py-1 rounded text-xs font-semibold ${getConfidenceColor(result.confidence_level)}`}>
                  {result.confidence_level} Conf
                </div>

                {expandedIndex === index ? (
                  <ChevronUp className="h-5 w-5 text-gray-400" />
                ) : (
                  <ChevronDown className="h-5 w-5 text-gray-400" />
                )}
              </div>
            </button>

            {/* Expanded Details */}
            {expandedIndex === index && (
              <div className="border-t border-gray-200 bg-gray-50 p-4 space-y-4">
                {/* Ineligibility Reason - BUG FIX 4: Different styles per gate_type */}
                {!result.eligible && (
                  <div className={`rounded-lg p-4 flex gap-3 ${
                    result.gate_type === 'backlog' 
                      ? 'bg-red-50 border border-red-300'
                      : result.gate_type === 'cgpa'
                      ? 'bg-red-50 border border-red-300'
                      : result.gate_type === 'skill_mismatch'
                      ? 'bg-red-900 bg-opacity-10 border border-red-900'
                      : 'bg-red-50 border border-red-300'
                  }`}>
                    {result.gate_type === 'backlog' && (
                      <>
                        <AlertTriangle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="font-semibold text-red-900">Active Backlogs</p>
                          <p className="text-sm text-red-800 mt-1">{result.fail_reason}</p>
                        </div>
                      </>
                    )}
                    {result.gate_type === 'cgpa' && (
                      <>
                        <AlertTriangle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="font-semibold text-red-900">CGPA Below Minimum</p>
                          <p className="text-sm text-red-800 mt-1">{result.fail_reason}</p>
                        </div>
                      </>
                    )}
                    {result.gate_type === 'skill_mismatch' && (
                      <>
                        <AlertTriangle className="h-5 w-5 text-red-900 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="font-semibold text-red-900">Domain Mismatch</p>
                          <p className="text-xs text-red-800 mb-2">(Wrong domain, not a skill gap)</p>
                          <p className="text-sm text-red-800">{result.fail_reason}</p>
                        </div>
                      </>
                    )}
                    {!result.gate_type && (
                      <>
                        <AlertTriangle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="font-semibold text-red-900">Ineligible</p>
                          <p className="text-sm text-red-800 mt-1">{result.fail_reason}</p>
                        </div>
                      </>
                    )}
                  </div>
                )}

                {result.eligible && (
                  <>
                    {/* Zero Skill Warning */}
                    {result.zero_skill_note && (
                      <div className="bg-red-50 border border-red-300 rounded-lg p-4 flex gap-3">
                        <AlertTriangle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="font-semibold text-red-900">Zero Skill Overlap</p>
                          <p className="text-sm text-red-800 mt-1">{result.zero_skill_note}</p>
                        </div>
                      </div>
                    )}

                    {/* Confidence Note */}
                    <div className={`text-sm p-3 rounded-lg border ${getConfidenceColor(result.confidence_level).replace('text-', 'border-').replace('bg-', 'bg-').slice(0, -3)} bg-opacity-20`}>
                      <p className="font-medium mb-1">Confidence: {result.confidence_level}</p>
                      <p className="text-xs">{result.confidence_note}</p>
                    </div>

                    {/* Pillar Breakdown - 6 Pillars */}
                    <div className="bg-white border border-gray-200 rounded-lg p-4">
                      <h4 className="font-semibold text-gray-900 mb-3">6-Pillar Score Breakdown</h4>
                      <div className="space-y-3">
                        {/* Skills Pillar */}
                        <div>
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-sm font-medium text-gray-700">Skills Match</span>
                            <span className="text-sm font-bold text-gray-900">
                              {result.pillar_breakdown.skills}/{data.jd_intelligence?.weight_profile?.skills || 40}
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-blue-500 h-2 rounded-full"
                              style={{ width: `${getScorePercentage(result.pillar_breakdown.skills, data.jd_intelligence?.weight_profile?.skills || 40)}%` }}
                            />
                          </div>
                        </div>

                        {/* Academics Pillar */}
                        <div>
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-sm font-medium text-gray-700">Academics</span>
                            <span className="text-sm font-bold text-gray-900">
                              {result.pillar_breakdown.academics}/{data.jd_intelligence?.weight_profile?.academic || 20}
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-green-500 h-2 rounded-full"
                              style={{ width: `${getScorePercentage(result.pillar_breakdown.academics, data.jd_intelligence?.weight_profile?.academic || 20)}%` }}
                            />
                          </div>
                        </div>

                        {/* Corporate Readiness Pillar - only if weight > 0 */}
                        {(data.jd_intelligence?.weight_profile?.corporate || 0) > 0 && (
                          <div>
                            <div className="flex justify-between items-center mb-1">
                              <span className="text-sm font-medium text-gray-700">Corporate Readiness</span>
                              <span className="text-sm font-bold text-gray-900">
                                {result.pillar_breakdown.corporate_readiness}/{data.jd_intelligence?.weight_profile?.corporate || 15}
                              </span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div
                                className="bg-yellow-500 h-2 rounded-full"
                                style={{ width: `${getScorePercentage(result.pillar_breakdown.corporate_readiness, data.jd_intelligence?.weight_profile?.corporate || 15)}%` }}
                              />
                            </div>
                            {/* Corporate matches tags */}
                            {result.corporate_matches && result.corporate_matches.length > 0 && (
                              <div className="mt-2 flex flex-wrap gap-1">
                                <span className="text-xs text-gray-600">Matched:</span>
                                {result.corporate_matches.map((match, idx) => (
                                  <span key={idx} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-700">
                                    {match}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        )}

                        {/* Aptitude Pillar - only show if active */}
                        {(data.jd_intelligence?.weight_profile?.aptitude || 0) > 0 && result.pillar_breakdown.aptitude > 0 && (
                          <div>
                            <div className="flex justify-between items-center mb-1">
                              <span className="text-sm font-medium text-gray-700">Aptitude Score</span>
                              <span className="text-sm font-bold text-gray-900">
                                {result.pillar_breakdown.aptitude}/{data.jd_intelligence?.weight_profile?.aptitude || 10}
                              </span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div
                                className="bg-cyan-500 h-2 rounded-full"
                                style={{ width: `${getScorePercentage(result.pillar_breakdown.aptitude, data.jd_intelligence?.weight_profile?.aptitude || 10)}%` }}
                              />
                            </div>
                          </div>
                        )}

                        {/* Portfolio Pillar - only if weight > 0 */}
                        {(data.jd_intelligence?.weight_profile?.portfolio || 0) > 0 && (
                          <div>
                            <div className="flex justify-between items-center mb-1">
                              <span className="text-sm font-medium text-gray-700">Portfolio</span>
                              <span className="text-sm font-bold text-gray-900">
                                {result.pillar_breakdown.portfolio}/{data.jd_intelligence?.weight_profile?.portfolio || 10}
                              </span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div
                                className="bg-purple-500 h-2 rounded-full"
                                style={{ width: `${getScorePercentage(result.pillar_breakdown.portfolio, data.jd_intelligence?.weight_profile?.portfolio || 10)}%` }}
                              />
                            </div>
                          </div>
                        )}

                        {/* AI Growth Pillar */}
                        <div>
                          {result.pillar_breakdown.ai_growth === -1 ? (
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium text-gray-700">AI Growth Potential</span>
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-800 border border-yellow-300">
                                Rate Limited
                              </span>
                            </div>
                          ) : (
                            <>
                              <div className="flex justify-between items-center mb-1">
                                <span className="text-sm font-medium text-gray-700">AI Growth Potential</span>
                                <span className="text-sm font-bold text-gray-900">
                                  {result.pillar_breakdown.ai_growth}/{data.jd_intelligence?.weight_profile?.ai || 10}
                                </span>
                              </div>
                              <div className="w-full bg-gray-200 rounded-full h-2">
                                <div
                                  className="bg-orange-500 h-2 rounded-full"
                                  style={{ width: `${getScorePercentage(result.pillar_breakdown.ai_growth, data.jd_intelligence?.weight_profile?.ai || 10)}%` }}
                                />
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Skills Section */}
                    <div className="bg-white border border-gray-200 rounded-lg p-4">
                      <h4 className="font-semibold text-gray-900 mb-3">Technical Skills</h4>
                      <div className="grid grid-cols-2 gap-4">
                        {/* Present Skills */}
                        <div>
                          <p className="text-xs font-semibold text-gray-600 mb-2">✓ Present ({result.present_skills?.length || 0})</p>
                          <div className="flex flex-wrap gap-2">
                            {result.present_skills && result.present_skills.length > 0 ? (
                              result.present_skills.map((skill, idx) => (
                                <span key={idx} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                  {skill}
                                </span>
                              ))
                            ) : (
                              <span className="text-xs text-gray-500">None detected</span>
                            )}
                          </div>
                        </div>

                        {/* Missing Skills */}
                        <div>
                          <p className="text-xs font-semibold text-gray-600 mb-2">✗ Missing ({result.missing_skills?.length || 0})</p>
                          <div className="flex flex-wrap gap-2">
                            {result.missing_skills && result.missing_skills.length > 0 ? (
                              result.missing_skills.map((skill, idx) => (
                                <span key={idx} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                  {skill}
                                </span>
                              ))
                            ) : (
                              <span className="text-xs text-gray-500">All aligned</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Portfolio Gate Note - BUG FIX 2: Only show if portfolio weight > 0 */}
                    {result.portfolio_gate_note && 
                     data.jd_intelligence?.weight_profile?.portfolio > 0 && (
                      <div className="bg-yellow-50 border border-yellow-300 rounded-lg p-3 flex items-start gap-3">
                        <AlertTriangle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="font-semibold text-yellow-900">Portfolio Gate</p>
                          <p className="text-sm text-yellow-800">{result.portfolio_gate_note}</p>
                        </div>
                      </div>
                    )}

                    {/* JD Type Information */}
                    <div className="bg-indigo-50 border border-indigo-300 rounded-lg p-3">
                      <p className="text-xs font-semibold text-indigo-900">JD Type Detected</p>
                      <p className="text-sm text-indigo-800">{result.jd_type_description}</p>
                    </div>

                    {/* AI Insights */}
                    {result.ai_insight && (
                      <div className={`border rounded-lg p-4 ${
                        result.pillar_breakdown.ai_growth === -1
                          ? 'bg-yellow-50 border-yellow-300'
                          : 'bg-white border-gray-200'
                      }`}>
                        <h4 className={`font-semibold mb-2 flex items-center gap-2 ${
                          result.pillar_breakdown.ai_growth === -1
                            ? 'text-yellow-900'
                            : 'text-gray-900'
                        }`}>
                          <TrendingUp className="h-4 w-4" />
                          AI Analysis {result.pillar_breakdown.ai_growth === -1 && '(Pending)'}
                        </h4>
                        <p className={`text-sm mb-3 ${
                          result.pillar_breakdown.ai_growth === -1
                            ? 'text-yellow-800'
                            : 'text-gray-700'
                        }`}>
                          {result.ai_insight}
                        </p>
                        {result.growth_reasoning && result.growth_reasoning !== 'N/A' && (
                          <div className={`rounded p-3 mt-3 border ${
                            result.pillar_breakdown.ai_growth === -1
                              ? 'bg-yellow-100 border-yellow-300'
                              : 'bg-gray-50 border-gray-200'
                          }`}>
                            <p className="text-xs font-semibold mb-1" style={{
                              color: result.pillar_breakdown.ai_growth === -1 ? '#854d0e' : '#4b5563'
                            }}>Growth Potential
                            </p>
                            <p className={`text-sm ${
                              result.pillar_breakdown.ai_growth === -1
                                ? 'text-yellow-800'
                                : 'text-gray-700'
                            }`}>
                              {result.growth_reasoning}
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
