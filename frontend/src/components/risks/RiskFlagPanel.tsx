import { useMemo, useState } from 'react'
import { RiskFlag, RiskSeverity, RiskType } from '@/types'

interface RiskFlagPanelProps {
  vendorName: string
  riskFlags: RiskFlag[]
  overallToneScore: number
}

const severityOrder: Record<RiskSeverity, number> = {
  High: 0,
  Medium: 1,
  Low: 2,
}

const severityBadgeStyles: Record<RiskSeverity, string> = {
  High: 'bg-rose-500/20 text-rose-300 border-rose-400/40',
  Medium: 'bg-amber-500/20 text-amber-300 border-amber-400/40',
  Low: 'bg-emerald-500/20 text-emerald-300 border-emerald-400/40',
}

const riskTypeChipStyles: Record<RiskType, string> = {
  Liability: 'bg-red-500/15 text-red-200 border-red-500/35',
  'Cost Escalation': 'bg-orange-500/15 text-orange-200 border-orange-500/35',
  'Vague Commitment': 'bg-yellow-500/15 text-yellow-200 border-yellow-500/35',
  'Approval Dependency': 'bg-blue-500/15 text-blue-200 border-blue-500/35',
  'Scope Creep': 'bg-purple-500/15 text-purple-200 border-purple-500/35',
}

const SEVERITY_FILTERS: Array<'All' | RiskSeverity> = ['All', 'High', 'Medium', 'Low']
const RISK_TYPE_FILTERS: Array<'All' | RiskType> = [
  'All',
  'Liability',
  'Cost Escalation',
  'Vague Commitment',
  'Approval Dependency',
  'Scope Creep',
]

const clampToneScore = (value: number): number => {
  return Math.max(0, Math.min(10, Math.round(value)))
}

const toneBarColorClass = (score: number): string => {
  if (score <= 3) return 'bg-rose-500'
  if (score <= 6) return 'bg-amber-500'
  return 'bg-emerald-500'
}

export default function RiskFlagPanel({ vendorName, riskFlags, overallToneScore }: RiskFlagPanelProps) {
  const [severityFilter, setSeverityFilter] = useState<'All' | RiskSeverity>('All')
  const [riskTypeFilter, setRiskTypeFilter] = useState<'All' | RiskType>('All')
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set())

  const score = clampToneScore(overallToneScore)
  const tonePercent = (score / 10) * 100

  const filteredRiskFlags = useMemo(() => {
    return [...riskFlags]
      .filter(item => severityFilter === 'All' || item.severity === severityFilter)
      .filter(item => riskTypeFilter === 'All' || item.riskType === riskTypeFilter)
      .sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity])
  }, [riskFlags, severityFilter, riskTypeFilter])

  const summary = useMemo(() => {
    const high = riskFlags.filter(item => item.severity === 'High').length
    const medium = riskFlags.filter(item => item.severity === 'Medium').length
    const low = riskFlags.filter(item => item.severity === 'Low').length

    return {
      total: riskFlags.length,
      high,
      medium,
      low,
    }
  }, [riskFlags])

  const toggleExpanded = (riskId: string) => {
    setExpandedIds(prev => {
      const next = new Set(prev)
      if (next.has(riskId)) {
        next.delete(riskId)
      } else {
        next.add(riskId)
      }
      return next
    })
  }

  return (
    <section className="rounded-xl border border-legal-blue/30 bg-legal-slate/50 shadow-xl overflow-hidden">
      <header className="px-6 py-5 border-b border-legal-blue/20">
        <h2 className="text-2xl font-bold text-gray-100">Risk Flag Panel</h2>
        <p className="text-sm text-gray-400 mt-1">
          Vendor: <span className="text-gray-200">{vendorName}</span>
        </p>

        <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="rounded-lg border border-legal-blue/30 bg-legal-dark/70 p-3">
            <p className="text-xs text-gray-400">Total Risks</p>
            <p className="text-xl font-bold text-gray-100 mt-1">{summary.total}</p>
          </div>
          <div className="rounded-lg border border-rose-500/30 bg-rose-950/20 p-3">
            <p className="text-xs text-gray-400">High</p>
            <p className="text-xl font-bold text-rose-300 mt-1">{summary.high}</p>
          </div>
          <div className="rounded-lg border border-amber-500/30 bg-amber-950/20 p-3">
            <p className="text-xs text-gray-400">Medium</p>
            <p className="text-xl font-bold text-amber-300 mt-1">{summary.medium}</p>
          </div>
          <div className="rounded-lg border border-emerald-500/30 bg-emerald-950/20 p-3">
            <p className="text-xs text-gray-400">Low</p>
            <p className="text-xl font-bold text-emerald-300 mt-1">{summary.low}</p>
          </div>
        </div>

        <div className="mt-5 rounded-lg border border-legal-blue/30 bg-legal-dark/70 p-4">
          <div className="flex items-center justify-between gap-4 mb-2">
            <p className="text-sm font-semibold text-gray-200">Overall Tone Score</p>
            <p className="text-sm text-gray-300">
              <span className="font-bold text-gray-100">{score}</span> / 10
            </p>
          </div>

          <div className="h-3 w-full bg-slate-700/70 rounded-full overflow-hidden">
            <div
              className={`h-full ${toneBarColorClass(score)} transition-all duration-500`}
              style={{ width: `${tonePercent}%` }}
              aria-label="Overall tone score bar"
            />
          </div>

          <div className="mt-2 flex justify-between text-[11px] text-gray-500">
            <span>0 (Evasive)</span>
            <span>10 (Committed)</span>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label htmlFor="risk-severity-filter" className="block text-xs font-semibold uppercase tracking-wide text-gray-400 mb-1.5">
              Filter by Severity
            </label>
            <select
              id="risk-severity-filter"
              value={severityFilter}
              onChange={event => setSeverityFilter(event.target.value as 'All' | RiskSeverity)}
              className="w-full px-3 py-2 bg-legal-dark border border-legal-blue/40 rounded-lg text-sm text-gray-100 focus:outline-none focus:ring-2 focus:ring-legal-accent"
            >
              {SEVERITY_FILTERS.map(option => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="risk-type-filter" className="block text-xs font-semibold uppercase tracking-wide text-gray-400 mb-1.5">
              Filter by Risk Type
            </label>
            <select
              id="risk-type-filter"
              value={riskTypeFilter}
              onChange={event => setRiskTypeFilter(event.target.value as 'All' | RiskType)}
              className="w-full px-3 py-2 bg-legal-dark border border-legal-blue/40 rounded-lg text-sm text-gray-100 focus:outline-none focus:ring-2 focus:ring-legal-accent"
            >
              {RISK_TYPE_FILTERS.map(option => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>
        </div>
      </header>

      <div className="p-6 space-y-4">
        {filteredRiskFlags.length === 0 ? (
          <div className="rounded-lg border border-legal-blue/30 bg-legal-dark/60 p-5 text-center text-sm text-gray-400">
            No risk flags match the selected filters.
          </div>
        ) : (
          filteredRiskFlags.map(flag => {
            const isExpanded = expandedIds.has(flag.riskId)

            return (
              <article key={flag.riskId} className="rounded-lg border border-legal-blue/30 bg-legal-dark/60 p-4">
                <div className="flex flex-wrap items-center gap-2 mb-3">
                  <span className="text-xs text-gray-500">{flag.riskId}</span>
                  <span className={`inline-flex px-2.5 py-1 rounded-full text-xs border ${severityBadgeStyles[flag.severity]}`}>
                    {flag.severity}
                  </span>
                  <span className={`inline-flex px-2.5 py-1 rounded-full text-xs border ${riskTypeChipStyles[flag.riskType]}`}>
                    {flag.riskType}
                  </span>
                  <span className="inline-flex px-2.5 py-1 rounded-full text-xs border border-slate-500/35 bg-slate-500/15 text-slate-200">
                    {flag.toneAssessment}
                  </span>
                </div>

                <div className="rounded-md border border-amber-400/30 bg-amber-500/10 px-3 py-2">
                  <p className="text-sm text-amber-100">"{flag.flaggedText}"</p>
                </div>

                <div className="mt-3">
                  <button
                    type="button"
                    onClick={() => toggleExpanded(flag.riskId)}
                    className="text-sm font-medium text-legal-accent hover:text-legal-gold"
                  >
                    {isExpanded ? 'Hide impact summary' : 'Show impact summary'}
                  </button>

                  {isExpanded && (
                    <p className="mt-2 text-sm text-gray-300 whitespace-pre-wrap">{flag.impactSummary}</p>
                  )}
                </div>
              </article>
            )
          })
        )}
      </div>
    </section>
  )
}
