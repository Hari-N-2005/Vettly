import { useMemo, useState } from 'react'
import ComplianceDeepDive from '@/components/compliance/ComplianceDeepDive'
import { ComplianceResult, ComplianceStatus } from '@/types'

type Recommendation = 'Recommend' | 'Review' | 'Reject'

interface VendorCategoryCell {
  status: ComplianceStatus
  deepDive?: {
    result: ComplianceResult
    requirementText: string
    categoryRequirementResults?: Array<{
      requirementId: string
      requirementText: string
      result: ComplianceResult
    }>
  }
}

interface VendorRiskBreakdown {
  total: number
  high: number
  medium: number
  low: number
}

export interface VendorComparisonVendor {
  vendorId: string
  vendorName: string
  complianceScore: number
  metCount: number
  partialCount: number
  missingCount: number
  risks: VendorRiskBreakdown
  categoryStatuses: Record<string, VendorCategoryCell>
}

interface VendorComparisonTableProps {
  vendors: VendorComparisonVendor[]
  categories?: string[]
  onFlagForReview?: (payload: {
    vendorId: string
    vendorName: string
    category: string
    requirementId: string
    note: string
  }) => void
}

const statusIconStyles: Record<ComplianceStatus, string> = {
  Met: 'bg-emerald-500/20 text-emerald-300 border-emerald-400/40',
  'Partially Met': 'bg-amber-500/20 text-amber-300 border-amber-400/40',
  Missing: 'bg-rose-500/20 text-rose-300 border-rose-400/40',
}

const recommendationStyles: Record<Recommendation, string> = {
  Recommend: 'bg-emerald-500/20 text-emerald-300 border-emerald-400/40',
  Review: 'bg-amber-500/20 text-amber-300 border-amber-400/40',
  Reject: 'bg-rose-500/20 text-rose-300 border-rose-400/40',
}

const getRecommendation = (vendor: VendorComparisonVendor): Recommendation => {
  if (vendor.complianceScore >= 80 && vendor.risks.high === 0 && vendor.missingCount <= 2) {
    return 'Recommend'
  }

  if (vendor.complianceScore >= 60 && vendor.risks.high <= 2) {
    return 'Review'
  }

  return 'Reject'
}

const getStatusIcon = (status: ComplianceStatus) => {
  if (status === 'Met') {
    return '✓'
  }

  if (status === 'Partially Met') {
    return '~'
  }

  return '✕'
}

function ScoreRing({ score }: { score: number }) {
  const normalized = Math.max(0, Math.min(100, Math.round(score)))
  const radius = 34
  const circumference = 2 * Math.PI * radius
  const dashOffset = circumference - (normalized / 100) * circumference

  return (
    <div className="relative h-24 w-24">
      <svg className="h-24 w-24 -rotate-90" viewBox="0 0 84 84" aria-label="Compliance score ring">
        <circle cx="42" cy="42" r={radius} stroke="rgba(148, 163, 184, 0.25)" strokeWidth="8" fill="none" />
        <circle
          cx="42"
          cy="42"
          r={radius}
          stroke="rgb(45, 212, 191)"
          strokeWidth="8"
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="text-center">
          <p className="text-lg font-bold text-gray-100">{normalized}%</p>
        </div>
      </div>
    </div>
  )
}

function MiniStatusBars({ metCount, partialCount, missingCount }: { metCount: number; partialCount: number; missingCount: number }) {
  const maxCount = Math.max(metCount, partialCount, missingCount, 1)

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <span className="w-14 text-xs text-gray-400">Met</span>
        <div className="h-2 flex-1 rounded bg-legal-dark/70 overflow-hidden">
          <div className="h-full bg-emerald-400" style={{ width: `${(metCount / maxCount) * 100}%` }} />
        </div>
        <span className="w-6 text-right text-xs text-emerald-300">{metCount}</span>
      </div>
      <div className="flex items-center gap-2">
        <span className="w-14 text-xs text-gray-400">Partial</span>
        <div className="h-2 flex-1 rounded bg-legal-dark/70 overflow-hidden">
          <div className="h-full bg-amber-400" style={{ width: `${(partialCount / maxCount) * 100}%` }} />
        </div>
        <span className="w-6 text-right text-xs text-amber-300">{partialCount}</span>
      </div>
      <div className="flex items-center gap-2">
        <span className="w-14 text-xs text-gray-400">Missing</span>
        <div className="h-2 flex-1 rounded bg-legal-dark/70 overflow-hidden">
          <div className="h-full bg-rose-400" style={{ width: `${(missingCount / maxCount) * 100}%` }} />
        </div>
        <span className="w-6 text-right text-xs text-rose-300">{missingCount}</span>
      </div>
    </div>
  )
}

export default function VendorComparisonTable({
  vendors,
  categories,
  onFlagForReview,
}: VendorComparisonTableProps) {
  const [activeDeepDive, setActiveDeepDive] = useState<{
    vendorId: string
    vendorName: string
    category: string
    result: ComplianceResult
    requirementText: string
    categoryRequirementResults?: Array<{
      requirementId: string
      requirementText: string
      result: ComplianceResult
    }>
  } | null>(null)

  const rowCategories = useMemo(() => {
    if (categories && categories.length > 0) {
      return categories
    }

    const discovered = new Set<string>()
    vendors.forEach(vendor => {
      Object.keys(vendor.categoryStatuses).forEach(category => discovered.add(category))
    })

    return Array.from(discovered)
  }, [categories, vendors])

  const openDeepDive = (vendor: VendorComparisonVendor, category: string) => {
    const cell = vendor.categoryStatuses[category]
    if (!cell) {
      return
    }

    const fallbackResult: ComplianceResult = {
      requirementId: `${vendor.vendorId}:${category}`,
      status: cell.status,
      confidenceScore: 0,
      matchedExcerpt: null,
      explanation: `No detailed explanation provided for ${category}.`,
    }

    setActiveDeepDive({
      vendorId: vendor.vendorId,
      vendorName: vendor.vendorName,
      category,
      result: cell.deepDive?.result ?? fallbackResult,
      requirementText: cell.deepDive?.requirementText ?? `${category} requirements summary`,
      categoryRequirementResults: cell.deepDive?.categoryRequirementResults,
    })
  }

  if (vendors.length === 0) {
    return (
      <section className="rounded-xl border border-legal-blue/30 bg-legal-slate/40 p-6 text-center">
        <p className="text-gray-300">No vendor comparison data available yet.</p>
      </section>
    )
  }

  return (
    <>
      <section className="rounded-xl border border-legal-blue/30 bg-legal-slate/40 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-[980px] w-full">
            <thead className="bg-legal-dark/80 border-b border-legal-blue/20">
              <tr>
                <th className="text-left align-top px-4 py-4 w-56">
                  <p className="text-xs uppercase tracking-wide text-gray-400">Requirement Category</p>
                </th>
                {vendors.map(vendor => {
                  const recommendation = getRecommendation(vendor)

                  return (
                    <th key={vendor.vendorId} className="align-top px-4 py-4 min-w-[290px] border-l border-legal-blue/20">
                      <div className="space-y-4">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-sm font-semibold text-gray-100">{vendor.vendorName}</p>
                            <span
                              className={`inline-flex mt-2 px-2.5 py-1 rounded-full border text-xs ${recommendationStyles[recommendation]}`}
                            >
                              {recommendation}
                            </span>
                          </div>
                          <ScoreRing score={vendor.complianceScore} />
                        </div>

                        <MiniStatusBars
                          metCount={vendor.metCount}
                          partialCount={vendor.partialCount}
                          missingCount={vendor.missingCount}
                        />

                        <div className="rounded-lg border border-legal-blue/30 bg-legal-dark/40 px-3 py-2">
                          <p className="text-xs text-gray-400">Risk Flags</p>
                          <p className="text-base font-semibold text-gray-100 mt-1">{vendor.risks.total}</p>
                          <p className="text-xs text-gray-400 mt-1">
                            <span className="text-rose-300">H {vendor.risks.high}</span>
                            <span className="mx-2 text-gray-600">|</span>
                            <span className="text-amber-300">M {vendor.risks.medium}</span>
                            <span className="mx-2 text-gray-600">|</span>
                            <span className="text-emerald-300">L {vendor.risks.low}</span>
                          </p>
                        </div>
                      </div>
                    </th>
                  )
                })}
              </tr>
            </thead>

            <tbody>
              {rowCategories.map(category => (
                <tr key={category} className="border-t border-legal-blue/20">
                  <td className="px-4 py-3 text-sm font-medium text-gray-200 bg-legal-dark/20">{category}</td>
                  {vendors.map(vendor => {
                    const cell = vendor.categoryStatuses[category]
                    const status = cell?.status ?? 'Missing'

                    return (
                      <td key={`${vendor.vendorId}:${category}`} className="px-3 py-3 border-l border-legal-blue/20">
                        <button
                          type="button"
                          onClick={() => openDeepDive(vendor, category)}
                          className="w-full inline-flex items-center justify-center gap-2 rounded-lg border border-legal-blue/30 bg-legal-dark/40 px-3 py-2 text-sm hover:bg-legal-dark/70 transition-colors"
                        >
                          <span className={`inline-flex items-center justify-center h-6 w-6 rounded-full border text-xs ${statusIconStyles[status]}`}>
                            {getStatusIcon(status)}
                          </span>
                          <span className="text-gray-200">{status}</span>
                        </button>
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <ComplianceDeepDive
        isOpen={Boolean(activeDeepDive)}
        result={activeDeepDive?.result ?? null}
        requirementText={activeDeepDive?.requirementText ?? ''}
        categoryRequirementResults={activeDeepDive?.categoryRequirementResults}
        onClose={() => setActiveDeepDive(null)}
        onFlagForReview={({ requirementId, note }) => {
          if (!activeDeepDive || !onFlagForReview) {
            return
          }

          onFlagForReview({
            vendorId: activeDeepDive.vendorId,
            vendorName: activeDeepDive.vendorName,
            category: activeDeepDive.category,
            requirementId,
            note,
          })
        }}
      />
    </>
  )
}
