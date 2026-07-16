/* eslint-disable react/prop-types */
import { TrendingUp, Layers, CheckCircle2, User, AlertCircle } from 'lucide-react'

export default function CohortAnalytics({ results = [] }) {
  if (!results || results.length === 0) {
    return (
      <div className="q-card text-center p-12">
        <p className="text-sm text-[#6F6F75]">No cohort data available. Complete a batch analysis to view metrics.</p>
      </div>
    )
  }

  const total = results.length
  const eligible = results.filter(r => r.eligible).length
  const qualified = results.filter(r => r.tier === 'Qualified').length
  const potential = results.filter(r => r.tier === 'Potential').length
  const needsTraining = total - qualified - potential

  // Calculate top aggregated skill gaps
  const gapCounts = {}
  results.forEach(r => {
    if (r.missing_skills) {
      r.missing_skills.forEach(skill => {
        gapCounts[skill] = (gapCounts[skill] || 0) + 1
      })
    }
  })

  const topGaps = Object.entries(gapCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)

  return (
    <div className="space-y-12">
      {/* Analytics Overview */}
      <div className="q-card space-y-8">
        <div>
          <h2 className="text-2xl font-medium tracking-tight text-[#0F0F11]">Cohort Placement Insights</h2>
          <p className="text-sm text-[#6F6F75] mt-1">Aggregated statistics mapping cohort strength, general skill gaps, and parameters.</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div className="border border-[#0F0F11]/10 rounded-[14px] p-5 bg-[#FAFAF8]">
            <div className="text-xs font-mono text-[#A8A8AE] uppercase tracking-wider">Total Class Size</div>
            <div className="text-3xl font-medium text-[#0F0F11] mt-1">{total}</div>
          </div>
          <div className="border border-[#0F0F11]/10 rounded-[14px] p-5 bg-[#FAFAF8]">
            <div className="text-xs font-mono text-[#A8A8AE] uppercase tracking-wider">Eligible Ratio</div>
            <div className="text-3xl font-medium text-[#0F0F11] mt-1">
              {((eligible / total) * 100).toFixed(0)}%
            </div>
          </div>
          <div className="border border-[#0F0F11]/10 rounded-[14px] p-5 bg-[#FAFAF8]">
            <div className="text-xs font-mono text-[#A8A8AE] uppercase tracking-wider">Qualified Count</div>
            <div className="text-3xl font-medium text-[#0F0F11] mt-1">{qualified}</div>
          </div>
          <div className="border border-[#0F0F11]/10 rounded-[14px] p-5 bg-[#FAFAF8]">
            <div className="text-xs font-mono text-[#A8A8AE] uppercase tracking-wider">Needs Support</div>
            <div className="text-3xl font-medium text-[#0F0F11] mt-1">{needsTraining}</div>
          </div>
        </div>
      </div>

      {/* Overarching Skill Gaps */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Skill Gap Chart */}
        <div className="q-card space-y-6">
          <h3 className="text-lg font-medium tracking-tight flex items-center gap-2">
            <TrendingUp className="h-4 w-4 stroke-[1.5]" />
            Top Cohort Skill Gaps
          </h3>
          <div className="space-y-4">
            {topGaps.length > 0 ? (
              topGaps.map(([skill, count]) => (
                <div key={skill} className="space-y-1.5">
                  <div className="flex justify-between text-xs font-mono text-[#6F6F75]">
                    <span className="capitalize">{skill}</span>
                    <span>{((count / total) * 100).toFixed(0)}% of cohort</span>
                  </div>
                  <div className="w-full bg-[#FAFAF8] border border-[#0F0F11]/5 rounded-full h-1.5 overflow-hidden">
                    <div
                      className="bg-[#0F0F11] h-full"
                      style={{ width: `${(count / total) * 100}%` }}
                    />
                  </div>
                </div>
              ))
            ) : (
              <p className="text-xs text-[#A8A8AE]">No significant skill gaps found across this cohort.</p>
            )}
          </div>
        </div>

        {/* Tier Distribution List */}
        <div className="q-card space-y-6">
          <h3 className="text-lg font-medium tracking-tight flex items-center gap-2">
            <Layers className="h-4 w-4 stroke-[1.5]" />
            Cohort Distribution
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-[#FAFAF8] rounded-[10px] border border-[#0F0F11]/5">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="h-4 w-4 text-[#0F0F11]" />
                <span className="text-sm font-medium text-[#0F0F11]">Qualified Tier</span>
              </div>
              <span className="text-sm font-mono text-[#6F6F75]">{qualified} students</span>
            </div>
            <div className="flex items-center justify-between p-4 bg-[#FAFAF8] rounded-[10px] border border-[#0F0F11]/5">
              <div className="flex items-center gap-3">
                <User className="h-4 w-4 text-[#6F6F75]" />
                <span className="text-sm font-medium text-[#0F0F11]">Potential Tier</span>
              </div>
              <span className="text-sm font-mono text-[#6F6F75]">{potential} students</span>
            </div>
            <div className="flex items-center justify-between p-4 bg-[#FAFAF8] rounded-[10px] border border-[#0F0F11]/5">
              <div className="flex items-center gap-3">
                <AlertCircle className="h-4 w-4 text-[#A8A8AE]" />
                <span className="text-sm font-medium text-[#0F0F11]">Needs Training</span>
              </div>
              <span className="text-sm font-mono text-[#6F6F75]">{needsTraining} students</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
