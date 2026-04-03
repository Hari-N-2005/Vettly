import { useTender } from '@/context/TenderContext'
import EmptyState from '@/components/common/EmptyState'

export default function ReportView() {
  const { state, dispatch } = useTender()

  return (
    <section className="rounded-xl border border-legal-blue/30 bg-legal-slate/50 p-5">
      <h3 className="text-xl font-semibold text-gray-100">Report</h3>
      <p className="mt-1 text-sm text-gray-400">Build final output using global project, requirement, and vendor state.</p>

      {state.vendors.length === 0 && (
        <div className="mt-4">
          <EmptyState
            variant="vendors"
            title="No report data yet"
            description="Validate and compare vendors to generate meaningful report output."
            actionLabel="Go to Validate"
            onAction={() => dispatch({ type: 'SET_STEP', payload: 'validate' })}
          />
        </div>
      )}

      <div className="mt-4 space-y-1 text-sm text-gray-300">
        <p>Project: {state.projectName || 'N/A'}</p>
        <p>RFP file: {state.rfpDocument?.name || 'N/A'}</p>
        <p>Requirements: {state.requirements.length}</p>
        <p>Vendors compared: {state.vendors.length}</p>
      </div>

      <button
        type="button"
        onClick={() => dispatch({ type: 'RESET' })}
        className="mt-4 rounded-lg border border-rose-500/50 bg-rose-500/20 px-4 py-2 font-semibold text-rose-200"
      >
        Reset Workflow
      </button>
    </section>
  )
}
