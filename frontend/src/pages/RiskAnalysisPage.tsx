import EmptyState from '@/components/common/EmptyState'
import { useProjectStore } from '@/stores/projectStore'

const riskBadge = (missingCount: number) => {
  if (missingCount >= 8) {
    return { label: 'High Risk', classes: 'bg-rose-500/15 text-rose-200 border-rose-400/40' }
  }

  if (missingCount >= 3) {
    return { label: 'Medium Risk', classes: 'bg-amber-500/15 text-amber-200 border-amber-400/40' }
  }

  return { label: 'Low Risk', classes: 'bg-emerald-500/15 text-emerald-200 border-emerald-400/40' }
}

export default function RiskAnalysisPage() {
  const { currentProject } = useProjectStore()

  if (!currentProject) {
    return (
      <EmptyState
        variant="generic"
        title="No active project selected"
        description="Open a project and validate at least one vendor to view risk indicators."
      />
    )
  }

  if (!currentProject.proposals?.length) {
    return (
      <EmptyState
        variant="generic"
        title="No risk data available"
        description="Validate and save vendor proposals to populate risk indicators."
      />
    )
  }

  return (
    <div className="space-y-6">
      <section className="rounded-xl border border-amber-500/30 bg-gradient-to-r from-slate-900 via-amber-900/20 to-slate-900 p-5">
        <h2 className="flex items-center gap-2 text-2xl font-semibold text-slate-100">
          <span className="h-2.5 w-2.5 rounded-full bg-amber-300" />
          Risk Analysis
        </h2>
        <p className="mt-1 text-sm text-slate-400">
          Compliance gap risk indicators based on missing requirements for {currentProject.name}.
        </p>
      </section>

      <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {currentProject.proposals.map(proposal => {
          const badge = riskBadge(proposal.missingCount || 0)

          return (
            <article key={proposal.id} className="rounded-xl border border-amber-500/20 bg-slate-900/95 p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-slate-100">{proposal.vendorName}</h3>
                <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${badge.classes}`}>
                  {badge.label}
                </span>
              </div>

              <div className="mt-4 grid grid-cols-3 gap-3 text-sm">
                <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-3">
                  <p className="text-slate-400">Met</p>
                  <p className="mt-1 text-emerald-300 font-semibold">{proposal.metCount ?? 0}</p>
                </div>
                <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-3">
                  <p className="text-slate-400">Partial</p>
                  <p className="mt-1 text-amber-300 font-semibold">{proposal.partialCount ?? 0}</p>
                </div>
                <div className="rounded-lg border border-rose-500/20 bg-rose-500/5 p-3">
                  <p className="text-slate-400">Missing</p>
                  <p className="mt-1 text-rose-300 font-semibold">{proposal.missingCount ?? 0}</p>
                </div>
              </div>

              <p className="mt-4 text-sm text-slate-400">
                Higher missing counts indicate elevated compliance and delivery risk.
              </p>
            </article>
          )
        })}
      </section>
    </div>
  )
}
