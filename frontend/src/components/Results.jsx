/* eslint-disable react/prop-types */
import { ChevronDown, ChevronUp, AlertCircle, TrendingUp } from 'lucide-react'
import { useState } from 'react'

export default function Results({ data }) {
  const [expandedIndex, setExpandedIndex] = useState(null)

  const toggleExpand = (index) => {
    setExpandedIndex(expandedIndex === index ? null : index)
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
    <div className="space-y-12">
      {/* Header Section */}
      <div className="q-card space-y-8">
        <div className="flex justify-between items-baseline border-b border-[#0F0F11]/10 pb-6">
          <h2 className="text-2xl font-medium tracking-tight text-[#0F0F11]">Scoring Analysis Results</h2>
          <div className="text-sm font-mono text-[#6F6F75]">
            {data.analyzed_students} / {data.total_students} students analyzed
          </div>
        </div>

        {/* JD Intelligence Summary */}
        {data.jd_intelligence && (
          <div className="border border-[#0F0F11]/10 rounded-[14px] p-6 bg-[#FAFAF8] space-y-4">
            <h3 className="font-mono text-xs font-semibold text-[#0F0F11] uppercase tracking-widest">JD Intelligence Summary</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 text-sm">
              <div className="space-y-1">
                <p className="text-xs font-mono text-[#A8A8AE] uppercase tracking-wider">JD Profile</p>
                <div className="text-sm font-medium text-[#0F0F11]">
                  {data.jd_intelligence.jd_type === 'service_based' && 'Service-Based'}
                  {data.jd_intelligence.jd_type === 'product_based' && 'Product-Based'}
                  {data.jd_intelligence.jd_type === 'academic' && 'Academic Profile'}
                  {data.jd_intelligence.jd_type === 'balanced' && 'Balanced Profile'}
                </div>
                <p className="text-xs text-[#6F6F75] leading-relaxed pt-1">{data.jd_intelligence.jd_type_description}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-mono text-[#A8A8AE] uppercase tracking-wider">Required Skills</p>
                <p className="text-sm font-medium text-[#0F0F11]">{data.jd_intelligence.combined_skill_set?.length || 0} skills</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-mono text-[#A8A8AE] uppercase tracking-wider">Minimum CGPA</p>
                <p className="text-sm font-medium text-[#0F0F11]">{data.jd_intelligence.min_cgpa?.toFixed(2) || '0.00'}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-mono text-[#A8A8AE] uppercase tracking-wider">Core Domains</p>
                <p className="text-xs text-[#6F6F75] font-mono leading-relaxed">{data.jd_intelligence.combined_skill_set?.slice(0, 3).join(', ')}</p>
              </div>
            </div>
          </div>
        )}

        {/* Summary Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="border border-[#0F0F11]/10 rounded-[14px] p-5 bg-white space-y-1">
            <div className="text-xs font-mono text-[#A8A8AE] uppercase tracking-wider">Total</div>
            <div className="text-2xl font-medium text-[#0F0F11]">{data.total_students}</div>
          </div>
          <div className="border border-[#0F0F11]/10 rounded-[14px] p-5 bg-white space-y-1">
            <div className="text-xs font-mono text-[#A8A8AE] uppercase tracking-wider">Scored</div>
            <div className="text-2xl font-medium text-[#0F0F11]">{data.analyzed_students}</div>
          </div>
          <div className="border border-[#0F0F11]/10 rounded-[14px] p-5 bg-white space-y-1">
            <div className="text-xs font-mono text-[#A8A8AE] uppercase tracking-wider">Eligible</div>
            <div className="text-2xl font-medium text-[#0F0F11]">{countEligible(data.results)}</div>
          </div>
          <div className="border border-[#0F0F11]/10 rounded-[14px] p-5 bg-white space-y-1">
            <div className="text-xs font-mono text-[#A8A8AE] uppercase tracking-wider">Qualified</div>
            <div className="text-2xl font-medium text-[#0F0F11]">{countByTier(data.results, 'Qualified')}</div>
          </div>
          <div className="border border-[#0F0F11]/10 rounded-[14px] p-5 bg-white space-y-1">
            <div className="text-xs font-mono text-[#A8A8AE] uppercase tracking-wider">Potential</div>
            <div className="text-2xl font-medium text-[#0F0F11]">{countByTier(data.results, 'Potential')}</div>
          </div>
        </div>
      </div>

      {/* Student Results List */}
      <div className="space-y-4">
        {data.results.map((result, index) => (
          <div
            key={index}
            className="border border-[#0F0F11]/10 rounded-[16px] bg-white overflow-hidden shadow-[0_1px_2px_rgba(15,15,17,0.04)]"
          >
            {/* Header Row - Always Visible */}
            <button
              onClick={() => toggleExpand(index)}
              className="w-full text-left flex items-center justify-between p-6 hover:bg-[#FAFAF8] transition-colors"
            >
              <div className="flex-1 space-y-1">
                <div className="flex items-center gap-3">
                  <div className="font-medium text-[#0F0F11] text-base">{result.name}</div>
                  <div className="font-mono text-xs text-[#A8A8AE]">{result.roll_number}</div>
                </div>
                <div className="text-xs font-mono text-[#6F6F75]">
                  CGPA: {result.cgpa?.toFixed(2)} | Score: {result.final_score}/100
                </div>
              </div>

              <div className="flex items-center gap-4">
                {/* Not Eligible Badge */}
                {!result.eligible && (
                  <div className="flex items-center gap-1.5 px-3 py-1 border border-[#0F0F11] rounded-full">
                    <span className="text-[10px] font-mono font-semibold text-[#0F0F11] uppercase tracking-wider">Ineligible</span>
                  </div>
                )}

                {/* Score Badge */}
                {result.eligible && (
                  <div className="px-3 py-1 border border-[#0F0F11] rounded-full text-xs font-medium text-[#0F0F11]">
                    {result.final_score} • {result.tier}
                  </div>
                )}

                {/* Confidence Badge */}
                <div className="px-3 py-1 border border-[#0F0F11]/15 rounded-full text-xs font-mono text-[#6F6F75]">
                  {result.confidence_level} Conf
                </div>

                {expandedIndex === index ? (
                  <ChevronUp className="h-4 w-4 text-[#6F6F75] stroke-[1.5]" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-[#6F6F75] stroke-[1.5]" />
                )}
              </div>
            </button>

            {/* Expanded Details */}
            {expandedIndex === index && (
              <div className="border-t border-[#0F0F11]/10 bg-[#FAFAF8] p-6 space-y-6">
                {/* Ineligibility Reason */}
                {!result.eligible && (
                  <div className="border border-[#0F0F11] rounded-[14px] p-5 flex gap-4 bg-white">
                    <AlertCircle className="h-5 w-5 text-[#0F0F11] flex-shrink-0 mt-0.5 stroke-[1.5]" />
                    <div className="space-y-1">
                      <p className="font-semibold text-[#0F0F11] text-sm">Eligibility Exclusion Gate</p>
                      <p className="text-sm text-[#6F6F75] leading-relaxed">{result.fail_reason}</p>
                    </div>
                  </div>
                )}

                {result.eligible && (
                  <>
                    {/* Zero Skill Warning */}
                    {result.zero_skill_note && (
                      <div className="border border-[#0F0F11] rounded-[14px] p-5 flex gap-4 bg-white">
                        <AlertCircle className="h-5 w-5 text-[#0F0F11] flex-shrink-0 mt-0.5 stroke-[1.5]" />
                        <div className="space-y-1">
                          <p className="font-semibold text-[#0F0F11] text-sm">Low Skill Overlap</p>
                          <p className="text-sm text-[#6F6F75] leading-relaxed">{result.zero_skill_note}</p>
                        </div>
                      </div>
                    )}

                    {/* Confidence Note */}
                    <div className="border border-[#0F0F11]/10 rounded-[14px] p-5 bg-white space-y-1">
                      <p className="text-xs font-mono text-[#A8A8AE] uppercase tracking-wider">Evaluation Reliability ({result.confidence_level})</p>
                      <p className="text-sm text-[#6F6F75] leading-relaxed">{result.confidence_note}</p>
                    </div>

                    {/* Pillar Breakdown */}
                    <div className="border border-[#0F0F11]/10 bg-white rounded-[14px] p-6 space-y-5">
                      <h4 className="font-mono text-xs font-semibold text-[#0F0F11] uppercase tracking-widest">6-Pillar Metrics Allocation</h4>
                      <div className="space-y-4">
                        {/* Skills Pillar */}
                        <div className="space-y-1.5">
                          <div className="flex justify-between text-xs font-mono text-[#6F6F75]">
                            <span>Skills Match</span>
                            <span className="text-[#0F0F11] font-medium">
                              {result.pillar_breakdown.skills}/{data.jd_intelligence?.weight_profile?.skills || 40}
                            </span>
                          </div>
                          <div className="w-full bg-[#FAFAF8] border border-[#0F0F11]/5 rounded-full h-1.5 overflow-hidden">
                            <div
                              className="bg-[#0F0F11] h-full"
                              style={{ width: `${getScorePercentage(result.pillar_breakdown.skills, data.jd_intelligence?.weight_profile?.skills || 40)}%` }}
                            />
                          </div>
                        </div>

                        {/* Academics Pillar */}
                        <div className="space-y-1.5">
                          <div className="flex justify-between text-xs font-mono text-[#6F6F75]">
                            <span>Academics Profile</span>
                            <span className="text-[#0F0F11] font-medium">
                              {result.pillar_breakdown.academics}/{data.jd_intelligence?.weight_profile?.academic || 20}
                            </span>
                          </div>
                          <div className="w-full bg-[#FAFAF8] border border-[#0F0F11]/5 rounded-full h-1.5 overflow-hidden">
                            <div
                              className="bg-[#0F0F11] h-full"
                              style={{ width: `${getScorePercentage(result.pillar_breakdown.academics, data.jd_intelligence?.weight_profile?.academic || 20)}%` }}
                            />
                          </div>
                        </div>

                        {/* Corporate Readiness Pillar */}
                        {(data.jd_intelligence?.weight_profile?.corporate || 0) > 0 && (
                          <div className="space-y-1.5">
                            <div className="flex justify-between text-xs font-mono text-[#6F6F75]">
                              <span>Corporate Readiness</span>
                              <span className="text-[#0F0F11] font-medium">
                                {result.pillar_breakdown.corporate_readiness}/{data.jd_intelligence?.weight_profile?.corporate || 15}
                              </span>
                            </div>
                            <div className="w-full bg-[#FAFAF8] border border-[#0F0F11]/5 rounded-full h-1.5 overflow-hidden">
                              <div
                                className="bg-[#0F0F11] h-full"
                                style={{ width: `${getScorePercentage(result.pillar_breakdown.corporate_readiness, data.jd_intelligence?.weight_profile?.corporate || 15)}%` }}
                              />
                            </div>
                          </div>
                        )}

                        {/* Aptitude Pillar */}
                        {(data.jd_intelligence?.weight_profile?.aptitude || 0) > 0 && result.pillar_breakdown.aptitude > 0 && (
                          <div className="space-y-1.5">
                            <div className="flex justify-between text-xs font-mono text-[#6F6F75]">
                              <span>Cognitive Aptitude</span>
                              <span className="text-[#0F0F11] font-medium">
                                {result.pillar_breakdown.aptitude}/{data.jd_intelligence?.weight_profile?.aptitude || 10}
                              </span>
                            </div>
                            <div className="w-full bg-[#FAFAF8] border border-[#0F0F11]/5 rounded-full h-1.5 overflow-hidden">
                              <div
                                className="bg-[#0F0F11] h-full"
                                style={{ width: `${getScorePercentage(result.pillar_breakdown.aptitude, data.jd_intelligence?.weight_profile?.aptitude || 10)}%` }}
                              />
                            </div>
                          </div>
                        )}

                        {/* Portfolio Pillar */}
                        {(data.jd_intelligence?.weight_profile?.portfolio || 0) > 0 && (
                          <div className="space-y-1.5">
                            <div className="flex justify-between text-xs font-mono text-[#6F6F75]">
                              <span>Portfolio & Project Depth</span>
                              <span className="text-[#0F0F11] font-medium">
                                {result.pillar_breakdown.portfolio}/{data.jd_intelligence?.weight_profile?.portfolio || 10}
                              </span>
                            </div>
                            <div className="w-full bg-[#FAFAF8] border border-[#0F0F11]/5 rounded-full h-1.5 overflow-hidden">
                              <div
                                className="bg-[#0F0F11] h-full"
                                style={{ width: `${getScorePercentage(result.pillar_breakdown.portfolio, data.jd_intelligence?.weight_profile?.portfolio || 10)}%` }}
                              />
                            </div>
                          </div>
                        )}

                        {/* AI Growth Pillar */}
                        <div className="space-y-1.5">
                          <div className="flex justify-between text-xs font-mono text-[#6F6F75]">
                            <span>AI Growth Horizon</span>
                            <span className="text-[#0F0F11] font-medium">
                              {result.pillar_breakdown.ai_growth === -1 ? 'Pending' : `${result.pillar_breakdown.ai_growth}/${data.jd_intelligence?.weight_profile?.ai || 10}`}
                            </span>
                          </div>
                          <div className="w-full bg-[#FAFAF8] border border-[#0F0F11]/5 rounded-full h-1.5 overflow-hidden">
                            <div
                              className="bg-[#0F0F11] h-full"
                              style={{ width: `${result.pillar_breakdown.ai_growth === -1 ? 0 : getScorePercentage(result.pillar_breakdown.ai_growth, data.jd_intelligence?.weight_profile?.ai || 10)}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Skills Alignment Section */}
                    <div className="border border-[#0F0F11]/10 bg-white rounded-[14px] p-6 space-y-6">
                      <h4 className="font-mono text-xs font-semibold text-[#0F0F11] uppercase tracking-widest">Profile Keyword Match</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Present Skills */}
                        <div className="space-y-2">
                          <p className="text-xs font-mono text-[#6F6F75] uppercase tracking-wider">Identified Keywords ({result.present_skills?.length || 0})</p>
                          <div className="flex flex-wrap gap-1.5">
                            {result.present_skills && result.present_skills.length > 0 ? (
                              result.present_skills.map((skill, idx) => (
                                <span key={idx} className="inline-block px-2.5 py-1 border border-[#0F0F11]/10 rounded-full text-xs font-mono text-[#0F0F11] bg-[#FAFAF8]">
                                  {skill}
                                </span>
                              ))
                            ) : (
                              <span className="text-xs text-[#A8A8AE]">No keywords matched</span>
                            )}
                          </div>
                        </div>

                        {/* Missing Skills */}
                        <div className="space-y-2">
                          <p className="text-xs font-mono text-[#6F6F75] uppercase tracking-wider">Gaps / Unmatched Keywords ({result.missing_skills?.length || 0})</p>
                          <div className="flex flex-wrap gap-1.5">
                            {result.missing_skills && result.missing_skills.length > 0 ? (
                              result.missing_skills.map((skill, idx) => (
                                <span key={idx} className="inline-block px-2.5 py-1 border border-[#0F0F11]/5 rounded-full text-xs font-mono text-[#A8A8AE] bg-transparent">
                                  {skill}
                                </span>
                              ))
                            ) : (
                              <span className="text-xs text-[#A8A8AE]">No gaps detected</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* AI Insights */}
                    {result.ai_insight && (
                      <div className="border border-[#0F0F11]/10 bg-white rounded-[14px] p-6 space-y-4">
                        <h4 className="font-mono text-xs font-semibold text-[#0F0F11] uppercase tracking-widest flex items-center gap-2">
                          <TrendingUp className="h-4 w-4 stroke-[1.5]" />
                          Heuristic AI Evaluation
                        </h4>
                        <p className="text-sm text-[#6F6F75] leading-relaxed">
                          {result.ai_insight}
                        </p>
                        {result.growth_reasoning && result.growth_reasoning !== 'N/A' && (
                          <div className="rounded-[10px] p-4 border border-[#0F0F11]/5 bg-[#FAFAF8] space-y-1">
                            <p className="text-xs font-mono text-[#A8A8AE] uppercase tracking-wider">Evaluation Narrative</p>
                            <p className="text-sm text-[#6F6F75] leading-relaxed">
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
