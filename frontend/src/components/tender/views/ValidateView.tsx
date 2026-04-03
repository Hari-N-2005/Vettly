import { useTender, VendorResult } from '@/context/TenderContext'
import { useState } from 'react'
import AnalysisLoader from '@/components/common/AnalysisLoader'
import ErrorToast from '@/components/common/ErrorToast'
import EmptyState from '@/components/common/EmptyState'
import { validateVendorProposal } from '@/services/proposalService'
import { ValidateVendorResponse } from '@/types'

export default function ValidateView() {
  const { state, dispatch } = useTender()
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [vendorName, setVendorName] = useState('')
  const [vendorProposalFile, setVendorProposalFile] = useState<File | null>(null)
  const [validationResult, setValidationResult] = useState<ValidateVendorResponse | null>(null)

  const handleAddVendor = async () => {
    if (state.requirements.length === 0) {
      setErrorMessage('Confirm requirements first to generate vendor validation results.')
      return
    }

    if (!vendorProposalFile) {
      setErrorMessage('Upload a vendor proposal file before running validation.')
      return
    }

    setIsLoading(true)

    try {
      const result = await validateVendorProposal(
        vendorProposalFile,
        state.requirements,
        vendorName || undefined
      )

      setValidationResult(result)

      const vendorResult: VendorResult = {
        id: `${result.vendorName || vendorName || 'vendor'}-${Date.now()}`,
        vendorName: result.vendorName || vendorName || 'Unknown Vendor',
        complianceResults: result.complianceResults,
        overallScore: result.overallScore,
        metCount: result.metCount,
        partialCount: result.partialCount,
        missingCount: result.missingCount,
      }

      dispatch({ type: 'ADD_VENDOR_RESULT', payload: vendorResult })
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to validate this vendor proposal.'
      setErrorMessage(message)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <section className="rounded-xl border border-legal-blue/30 bg-legal-slate/50 p-5">
      <AnalysisLoader
        isVisible={isLoading}
        title="Validating vendor"
        steps={['Mapping requirement evidence...', 'Scoring compliance...', 'Preparing comparison-ready result...']}
      />

      <ErrorToast
        isVisible={Boolean(errorMessage)}
        title="Validation unavailable"
        message={errorMessage}
        onDismiss={() => setErrorMessage('')}
      />

      <h3 className="text-xl font-semibold text-gray-100">Validate</h3>
      <p className="mt-1 text-sm text-gray-400">Add vendor validation output into global state.vendors.</p>

      {state.requirements.length === 0 && (
        <div className="mt-4">
          <EmptyState
            variant="requirements"
            title="No confirmed requirements"
            description="Return to Review and confirm requirements before validating vendors."
            actionLabel="Back to Review"
            onAction={() => dispatch({ type: 'SET_STEP', payload: 'review' })}
          />
        </div>
      )}

      <p className="mt-4 text-sm text-gray-300">
        Confirmed requirements: <span className="font-semibold text-gray-100">{state.requirements.length}</span>
      </p>

      {validationResult && (
        <div className="mt-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4">
          <p className="text-sm font-semibold text-emerald-200">Validation result ready</p>
          <div className="mt-2 grid grid-cols-2 gap-3 text-sm text-emerald-50 sm:grid-cols-4">
            <div>
              <p className="text-emerald-200/70">Vendor</p>
              <p className="font-semibold">{validationResult.vendorName}</p>
            </div>
            <div>
              <p className="text-emerald-200/70">Score</p>
              <p className="font-semibold">{validationResult.overallScore}%</p>
            </div>
            <div>
              <p className="text-emerald-200/70">Met</p>
              <p className="font-semibold">{validationResult.metCount}</p>
            </div>
            <div>
              <p className="text-emerald-200/70">Partial / Missing</p>
              <p className="font-semibold">
                {validationResult.partialCount} / {validationResult.missingCount}
              </p>
            </div>
          </div>
          <p className="mt-3 text-sm text-emerald-100/90">
            The result is now visible here. Use the button below to continue to comparison.
          </p>
        </div>
      )}

      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <input
          type="text"
          value={vendorName}
          onChange={(event) => setVendorName(event.target.value)}
          placeholder="Vendor name (optional)"
          className="w-full rounded-lg border border-legal-blue/40 bg-legal-dark px-3 py-2 text-gray-100"
        />

        <input
          type="file"
          accept=".pdf,application/pdf"
          onChange={(event) => setVendorProposalFile(event.target.files?.[0] ?? null)}
          className="w-full text-sm text-gray-300"
        />
      </div>

      {!vendorProposalFile && (
        <div className="mt-4">
          <EmptyState
            variant="vendors"
            title="No vendor proposal uploaded"
            description="Attach a vendor PDF proposal to run real compliance validation."
          />
        </div>
      )}

      <button
        type="button"
        onClick={() => {
          if (validationResult) {
            dispatch({ type: 'SET_STEP', payload: 'compare' })
            return
          }

          void handleAddVendor()
        }}
        disabled={isLoading || !vendorProposalFile}
        className="mt-4 rounded-lg bg-legal-accent px-4 py-2 font-semibold text-white disabled:opacity-50"
      >
        {validationResult ? 'Continue to Comparison' : isLoading ? 'Validating Vendor...' : 'Validate Vendor Proposal'}
      </button>
    </section>
  )
}
