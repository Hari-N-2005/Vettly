import { useEffect, useMemo, useState } from 'react'
import { ComplianceResult } from '@/types'

interface ComplianceDeepDiveProps {
  isOpen: boolean
  result: ComplianceResult | null
  requirementText: string
  categoryRequirementResults?: Array<{
    requirementId: string
    requirementText: string
    result: ComplianceResult
  }>
  onClose: () => void
  onFlagForReview?: (payload: { requirementId: string; note: string }) => void
}

const statusBadgeStyles: Record<ComplianceResult['status'], string> = {
  Met: 'bg-emerald-500/20 text-emerald-300 border-emerald-400/40',
  'Partially Met': 'bg-amber-500/20 text-amber-300 border-amber-400/40',
  Missing: 'bg-rose-500/20 text-rose-300 border-rose-400/40',
}

export default function ComplianceDeepDive({
  isOpen,
  result,
  requirementText,
  categoryRequirementResults,
  onClose,
  onFlagForReview,
}: ComplianceDeepDiveProps) {
  const [manualNote, setManualNote] = useState('')
  const [selectedRequirementId, setSelectedRequirementId] = useState<string | null>(null)

  const selectedCategoryRequirement = useMemo(() => {
    if (!Array.isArray(categoryRequirementResults) || categoryRequirementResults.length === 0) {
      return null
    }

    return (
      categoryRequirementResults.find(item => item.requirementId === selectedRequirementId) ??
      categoryRequirementResults[0]
    )
  }, [categoryRequirementResults, selectedRequirementId])

  const displayedResult = selectedCategoryRequirement?.result ?? result
  const displayedRequirementText = selectedCategoryRequirement?.requirementText || requirementText

  useEffect(() => {
    if (categoryRequirementResults?.length && !selectedRequirementId) {
      setSelectedRequirementId(categoryRequirementResults[0].requirementId)
    }
    if (categoryRequirementResults?.length && selectedRequirementId) {
      const stillExists = categoryRequirementResults.some(item => item.requirementId === selectedRequirementId)
      if (!stillExists) {
        setSelectedRequirementId(categoryRequirementResults[0].requirementId)
      }
    }
    if (!categoryRequirementResults?.length && selectedRequirementId) {
      setSelectedRequirementId(null)
    }
  }, [categoryRequirementResults, selectedRequirementId])

  const gauge = useMemo(() => {
    const radius = 54
    const circumference = 2 * Math.PI * radius
    const confidenceValue = displayedResult ? Math.max(0, Math.min(100, Math.round(displayedResult.confidenceScore))) : 0
    const dashOffset = circumference - (confidenceValue / 100) * circumference

    return {
      radius,
      circumference,
      dashOffset,
    }
  }, [displayedResult])

  const handleFlagForReview = () => {
    if (!displayedResult) return
    onFlagForReview?.({ requirementId: displayedResult.requirementId, note: manualNote.trim() })
  }

  return (
    <div
      className={`fixed inset-0 z-[70] transition-all duration-300 ${
        isOpen ? 'pointer-events-auto' : 'pointer-events-none'
      }`}
      aria-hidden={!isOpen}
    >
      <div
        className={`absolute inset-0 bg-black/50 transition-opacity duration-300 ${
          isOpen ? 'opacity-100' : 'opacity-0'
        }`}
        onClick={onClose}
      />

      <aside
        className={`absolute right-0 top-0 h-full w-full max-w-3xl bg-legal-dark border-l border-legal-blue/30 shadow-2xl transform transition-transform duration-300 ease-out ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
        role="dialog"
        aria-modal="true"
        aria-label="Compliance deep dive"
      >
        <div className="h-full flex flex-col">
          <div className="px-6 py-5 border-b border-legal-blue/20 flex items-start justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-wide text-gray-400">Compliance Deep Dive</p>
              <h2 className="text-xl font-bold text-gray-100 mt-1">Requirement {displayedResult?.requirementId || '--'}</h2>
            </div>
            <div className="flex items-center gap-3">
              <span
                className={`inline-flex px-3 py-1.5 rounded-full text-xs border ${
                  displayedResult ? statusBadgeStyles[displayedResult.status] : 'bg-slate-500/20 text-slate-300 border-slate-400/30'
                }`}
              >
                {displayedResult?.status || 'Unknown'}
              </span>
              <button
                type="button"
                onClick={onClose}
                className="text-gray-400 hover:text-gray-200 text-sm"
              >
                Close
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
              <section className="rounded-xl border border-legal-blue/30 bg-legal-slate/40 p-4">
                <h3 className="text-sm font-semibold text-gray-200 mb-2">Original Requirement</h3>
                <p className="text-sm text-gray-300 whitespace-pre-wrap">
                  {displayedRequirementText || 'No requirement text available.'}
                </p>
              </section>

              <section className="rounded-xl border border-emerald-500/30 bg-emerald-950/20 p-4">
                <h3 className="text-sm font-semibold text-emerald-200 mb-2">Matched Vendor Excerpt</h3>
                {displayedResult?.matchedExcerpt ? (
                  <p className="text-sm text-emerald-100 whitespace-pre-wrap">
                    <span className="bg-emerald-400/20 rounded px-1 py-0.5">{displayedResult.matchedExcerpt}</span>
                  </p>
                ) : (
                  <p className="text-sm text-gray-400">No matching excerpt found.</p>
                )}
              </section>
            </div>

            <section className="rounded-xl border border-legal-blue/30 bg-legal-slate/40 p-4">
              <h3 className="text-sm font-semibold text-gray-200 mb-4">AI Confidence</h3>
              <div className="flex items-center gap-6">
                <div className="relative w-32 h-32">
                  <svg className="w-32 h-32 -rotate-90" viewBox="0 0 140 140" aria-label="Confidence score gauge">
                    <circle
                      cx="70"
                      cy="70"
                      r={gauge.radius}
                      stroke="rgba(148, 163, 184, 0.25)"
                      strokeWidth="12"
                      fill="none"
                    />
                    <circle
                      cx="70"
                      cy="70"
                      r={gauge.radius}
                      stroke="rgb(45, 212, 191)"
                      strokeWidth="12"
                      fill="none"
                      strokeLinecap="round"
                      strokeDasharray={gauge.circumference}
                      strokeDashoffset={gauge.dashOffset}
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-gray-100">
                        {displayedResult ? Math.max(0, Math.min(100, Math.round(displayedResult.confidenceScore))) : 0}
                      </p>
                      <p className="text-xs text-gray-400">/ 100</p>
                    </div>
                  </div>
                </div>

                <p className="text-sm text-gray-300 max-w-md">
                  Higher scores indicate stronger semantic alignment between the proposal evidence and the requirement intent.
                </p>
              </div>
            </section>

            <section className="rounded-xl border border-legal-blue/30 bg-legal-slate/40 p-4">
              <h3 className="text-sm font-semibold text-gray-200 mb-2">AI Explanation</h3>
              <p className="text-sm text-gray-300 whitespace-pre-wrap">{displayedResult?.explanation || 'No explanation returned.'}</p>
              {displayedResult?.suggestedFollowUp && (
                <p className="mt-3 text-sm text-amber-200 bg-amber-950/30 border border-amber-700/30 rounded-lg px-3 py-2">
                  Suggested follow-up: {displayedResult.suggestedFollowUp}
                </p>
              )}
            </section>

            {Array.isArray(categoryRequirementResults) && categoryRequirementResults.length > 0 && (
              <section className="rounded-xl border border-legal-blue/30 bg-legal-slate/40 p-4">
                <h3 className="text-sm font-semibold text-gray-200 mb-3">All Requirements in This Category</h3>
                <div className="space-y-3">
                  {categoryRequirementResults.map(item => (
                    <button
                      key={item.requirementId}
                      type="button"
                      onClick={() => setSelectedRequirementId(item.requirementId)}
                      className={`w-full text-left rounded-lg border p-3 transition-colors ${
                        selectedRequirementId === item.requirementId
                          ? 'border-legal-accent bg-legal-accent/10'
                          : 'border-legal-blue/20 bg-legal-dark/50 hover:bg-legal-dark/70'
                      }`}
                    >
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                        <p className="text-sm font-medium text-gray-100">{item.requirementText}</p>
                        <span
                          className={`inline-flex w-fit px-2.5 py-1 rounded-full text-[11px] border ${statusBadgeStyles[item.result.status]}`}
                        >
                          {item.result.status}
                        </span>
                      </div>
                      <p className="mt-2 text-xs text-gray-400">
                        Requirement ID: {item.requirementId} | Confidence: {item.result.confidenceScore}
                      </p>
                    </button>
                  ))}
                </div>
              </section>
            )}

            <section className="rounded-xl border border-legal-blue/30 bg-legal-slate/40 p-4">
              <h3 className="text-sm font-semibold text-gray-200 mb-2">Manual Review Note</h3>
              <textarea
                value={manualNote}
                onChange={event => setManualNote(event.target.value)}
                placeholder="Add your manual note for legal/procurement review..."
                rows={4}
                className="w-full px-3 py-2 bg-legal-dark border border-legal-blue/40 rounded-lg text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-legal-accent resize-y"
              />
              <div className="mt-3 flex justify-end">
                <button
                  type="button"
                  onClick={handleFlagForReview}
                  className="px-4 py-2 rounded-lg text-sm font-semibold bg-rose-500/20 text-rose-300 border border-rose-500/40 hover:bg-rose-500/30 transition-colors"
                >
                  Flag for Review
                </button>
              </div>
            </section>
          </div>
        </div>
      </aside>
    </div>
  )
}
