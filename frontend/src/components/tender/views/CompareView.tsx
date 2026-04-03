import { useTender } from '@/context/TenderContext'
import EmptyState from '@/components/common/EmptyState'

export default function CompareView() {
  const { state, dispatch } = useTender()

  return (
    <section className="rounded-xl border border-legal-blue/30 bg-legal-slate/50 p-5">
      <h3 className="text-xl font-semibold text-gray-100">Compare</h3>
      <p className="mt-1 text-sm text-gray-400">Read vendor results from global state for side-by-side analysis.</p>

      {state.vendors.length === 0 && (
        <div className="mt-4">
          <EmptyState
            variant="vendors"
            title="No vendors to compare"
            description="Add at least one vendor validation result in the previous step to start comparison."
            actionLabel="Back to Validate"
            onAction={() => dispatch({ type: 'SET_STEP', payload: 'validate' })}
          />
        </div>
      )}

      <ul className="mt-4 space-y-2 text-sm text-gray-300">
        {state.vendors.map(vendor => (
          <li key={vendor.id} className="rounded-lg border border-legal-blue/20 px-3 py-2">
            {vendor.vendorName}: {vendor.overallScore}% overall
          </li>
        ))}
      </ul>

      <button
        type="button"
        onClick={() => dispatch({ type: 'SET_STEP', payload: 'report' })}
        disabled={state.vendors.length === 0}
        className="mt-4 rounded-lg bg-legal-accent px-4 py-2 font-semibold text-white disabled:opacity-50"
      >
        Continue to Report
      </button>
    </section>
  )
}
