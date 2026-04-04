import { useEffect, useMemo, useState } from 'react'
import EmptyState from '@/components/common/EmptyState'
import VendorComparisonTable, { VendorComparisonVendor } from '@/components/proposals/VendorComparisonTable'
import { useProjectStore } from '@/stores/projectStore'
import { ComplianceStatus, RequirementCategory } from '@/types'

const normalizeCategory = (category?: string): RequirementCategory => {
  if (
    category === 'Technical' ||
    category === 'Legal' ||
    category === 'Financial' ||
    category === 'Operational' ||
    category === 'Environmental'
  ) {
    return category
  }

  return 'Operational'
}

export default function VendorComparisonPage() {
  const { currentProject } = useProjectStore()
  const [selectedComparisonVendorIds, setSelectedComparisonVendorIds] = useState<string[]>([])

  useEffect(() => {
    if (!currentProject?.proposals?.length) {
      setSelectedComparisonVendorIds([])
      return
    }

    setSelectedComparisonVendorIds(currentProject.proposals.map(proposal => proposal.id))
  }, [currentProject])

  const requirementsForComparison = useMemo(() => {
    if (currentProject?.requirements?.length) {
      return currentProject.requirements.map(requirement => ({
        id: requirement.id,
        requirementText: requirement.text ?? '',
        category: normalizeCategory(requirement.category),
      }))
    }

    const snapshot = currentProject?.proposals?.[0]?.requirementsSnapshot
    if (!Array.isArray(snapshot)) {
      return []
    }

    return snapshot.map((requirement: any) => ({
      id: requirement.id,
      requirementText: requirement.text ?? '',
      category: normalizeCategory(requirement.category),
    }))
  }, [currentProject])

  const comparisonCategories = useMemo(() => {
    const uniqueCategories = new Set<string>()
    requirementsForComparison.forEach(requirement => {
      uniqueCategories.add(normalizeCategory(requirement.category))
    })
    return Array.from(uniqueCategories)
  }, [requirementsForComparison])

  const buildCategoryStatuses = (resultsByRequirement: Map<string, any>) => {
    const categoryStatuses: VendorComparisonVendor['categoryStatuses'] = {}

    const categoryBuckets = new Map<
      string,
      Array<{
        requirement: any
        result: any
      }>
    >()

    requirementsForComparison.forEach(requirement => {
      const category = normalizeCategory(requirement.category)
      const matchedResult = resultsByRequirement.get(requirement.id)

      const bucket = categoryBuckets.get(category) ?? []
      bucket.push({ requirement, result: matchedResult })
      categoryBuckets.set(category, bucket)
    })

    categoryBuckets.forEach((entries, category) => {
      const metCount = entries.filter(entry => entry.result?.status === 'Met').length
      const partialCount = entries.filter(entry => entry.result?.status === 'Partially Met').length
      const missingCount = entries.filter(entry => !entry.result || entry.result.status === 'Missing').length

      let status: ComplianceStatus = 'Missing'
      if (metCount === entries.length) {
        status = 'Met'
      } else if (missingCount === 0 && partialCount > 0) {
        status = 'Partially Met'
      } else if (metCount > 0 || partialCount > 0) {
        status = 'Partially Met'
      }

      const representativeEntry =
        entries.find(entry => entry.result?.status === 'Met') ||
        entries.find(entry => entry.result?.status === 'Partially Met') ||
        entries[0]

      const representativeResult = representativeEntry.result ?? {
        requirementId: representativeEntry.requirement.id,
        status: 'Missing' as ComplianceStatus,
        confidenceScore: 0,
        matchedExcerpt: null,
        explanation: 'No detailed explanation returned.',
      }

      categoryStatuses[category] = {
        status,
        deepDive: {
          result: representativeResult,
          requirementText: representativeEntry.requirement.requirementText,
          categoryRequirementResults: entries.map(entry => ({
            requirementId: entry.requirement.id,
            requirementText: entry.requirement.requirementText,
            result:
              entry.result ?? {
                requirementId: entry.requirement.id,
                status: 'Missing' as ComplianceStatus,
                confidenceScore: 0,
                matchedExcerpt: null,
                explanation: 'No detailed explanation returned.',
              },
          })),
        },
      }
    })

    return categoryStatuses
  }

  const comparisonVendors = useMemo<VendorComparisonVendor[]>(() => {
    if (!currentProject?.proposals?.length || selectedComparisonVendorIds.length === 0) {
      return []
    }

    const selectedProposals = currentProject.proposals.filter(proposal =>
      selectedComparisonVendorIds.includes(proposal.id)
    )

    return selectedProposals.map((proposal: any) => {
      const normalizedResults = Array.isArray(proposal.complianceResults)
        ? proposal.complianceResults.map((result: any) => ({
            requirementId: result.requirementId,
            status:
              result.status === 'Met' || result.status === 'Partially Met' || result.status === 'Missing'
                ? result.status
                : ('Missing' as ComplianceStatus),
            confidenceScore: result.confidence ?? 0,
            matchedExcerpt: result.matchedExcerpt ?? null,
            explanation: result.explanation || 'No detailed explanation returned.',
            suggestedFollowUp: result.suggestedFollowUp || undefined,
          }))
        : []

      const resultsByRequirement = new Map<string, any>()
      normalizedResults.forEach((result: any) => {
        resultsByRequirement.set(result.requirementId, result)
      })

      const metCount =
        typeof proposal.metCount === 'number'
          ? proposal.metCount
          : normalizedResults.filter((result: any) => result.status === 'Met').length
      const partialCount =
        typeof proposal.partialCount === 'number'
          ? proposal.partialCount
          : normalizedResults.filter((result: any) => result.status === 'Partially Met').length
      const missingCount =
        typeof proposal.missingCount === 'number'
          ? proposal.missingCount
          : normalizedResults.filter((result: any) => result.status === 'Missing').length

      return {
        vendorId: proposal.id,
        vendorName: proposal.vendorName || 'Saved Vendor',
        complianceScore: proposal.overallScore ?? 0,
        metCount,
        partialCount,
        missingCount,
        risks: {
          total: 0,
          high: 0,
          medium: 0,
          low: 0,
        },
        categoryStatuses: buildCategoryStatuses(resultsByRequirement),
      }
    })
  }, [buildCategoryStatuses, currentProject, selectedComparisonVendorIds])

  const toggleComparisonVendor = (proposalId: string) => {
    setSelectedComparisonVendorIds(prev =>
      prev.includes(proposalId)
        ? prev.filter(id => id !== proposalId)
        : [...prev, proposalId]
    )
  }

  if (!currentProject) {
    return (
      <EmptyState
        variant="vendors"
        title="No active project selected"
        description="Open a project and save vendor validation results to compare vendors."
      />
    )
  }

  if (!currentProject.proposals?.length) {
    return (
      <EmptyState
        variant="vendors"
        title="No vendor proposals saved"
        description="Run vendor validation from RFP Uploads and save vendor details to unlock comparison insights."
      />
    )
  }

  return (
    <div className="space-y-6">
      <section className="rounded-xl border border-cyan-500/30 bg-gradient-to-r from-slate-900 via-cyan-900/20 to-slate-900 p-5">
        <h2 className="flex items-center gap-2 text-2xl font-semibold text-slate-100">
          <span className="h-2.5 w-2.5 rounded-full bg-cyan-300" />
          Vendor Comparison
        </h2>
        <p className="mt-1 text-sm text-slate-400">
          Compare vendor compliance performance for {currentProject.name} with the same deep-dive view from RFP Uploads.
        </p>
      </section>

      <section className="rounded-xl border border-cyan-500/20 bg-slate-900/95 p-5">
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-lg font-semibold text-cyan-100">Included Vendors</h3>
          <p className="text-sm text-slate-400">{selectedComparisonVendorIds.length} selected</p>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
          {currentProject.proposals.map(proposal => (
            <article key={proposal.id} className="rounded-lg border border-cyan-500/18 bg-gradient-to-b from-slate-900 to-slate-950 p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h4 className="text-lg font-semibold text-slate-100">{proposal.vendorName}</h4>
                  <p className="text-xs text-slate-400 mt-1">
                    Saved {new Date(proposal.validatedAt || proposal.uploadedAt).toLocaleString()}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-slate-400">Overall Score</p>
                  <p className="text-xl font-bold text-amber-300">{proposal.overallScore ?? 0}%</p>
                </div>
              </div>

              <div className="mt-3 text-sm text-slate-300 grid grid-cols-3 gap-2">
                <p>
                  Met: <span className="text-emerald-300 font-semibold">{proposal.metCount ?? 0}</span>
                </p>
                <p>
                  Partial: <span className="text-amber-300 font-semibold">{proposal.partialCount ?? 0}</span>
                </p>
                <p>
                  Missing: <span className="text-rose-300 font-semibold">{proposal.missingCount ?? 0}</span>
                </p>
              </div>

              <div className="mt-4">
                <button
                  type="button"
                  onClick={() => toggleComparisonVendor(proposal.id)}
                  className={`w-full rounded-lg border px-3 py-2 text-sm font-semibold transition-colors ${
                    selectedComparisonVendorIds.includes(proposal.id)
                      ? 'border-emerald-400/50 bg-emerald-500/20 text-emerald-200'
                      : 'border-slate-600 bg-slate-900 text-slate-200 hover:bg-slate-800'
                  }`}
                >
                  {selectedComparisonVendorIds.includes(proposal.id)
                    ? 'Added To Comparison'
                    : 'Use For Comparison'}
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>

      {comparisonVendors.length > 0 ? (
        <VendorComparisonTable
          vendors={comparisonVendors}
          categories={comparisonCategories}
          onFlagForReview={({ vendorName, category, requirementId, note }) => {
            console.log('Flagged for review:', {
              vendor: vendorName,
              category,
              requirementId,
              note,
            })
            alert(`Flagged ${requirementId} (${category}) for review.`)
          }}
        />
      ) : (
        <EmptyState
          variant="vendors"
          title="No vendors selected for comparison"
          description="Select one or more vendors above to display the full comparison matrix."
        />
      )}
    </div>
  )
}
