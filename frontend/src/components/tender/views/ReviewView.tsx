import { Requirement } from '@/types'
import { useState } from 'react'
import { useTender } from '@/context/TenderContext'
import AnalysisLoader from '@/components/common/AnalysisLoader'
import ErrorToast from '@/components/common/ErrorToast'
import EmptyState from '@/components/common/EmptyState'
import { extractRequirements, uploadRFPForExtraction } from '@/services/rfpService'

export default function ReviewView() {
  const { state, dispatch } = useTender()
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  const handleConfirm = async () => {
    if (!state.projectName || !state.rfpDocument) {
      setErrorMessage('Upload project details first before confirming requirements.')
      return
    }

    setIsLoading(true)

    try {
      const extractionPayload = await uploadRFPForExtraction(state.rfpDocument)
      const extracted = await extractRequirements(extractionPayload.rawText)

      const requirements = Array.isArray(extracted.requirements)
        ? extracted.requirements
        : []

      if (requirements.length === 0) {
        setErrorMessage('No mandatory requirements were found in this RFP. Please verify the document content.')
        return
      }

      dispatch({ type: 'SET_REQUIREMENTS', payload: requirements as Requirement[] })
      dispatch({ type: 'SET_STEP', payload: 'validate' })
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to extract requirements from the uploaded RFP.'
      setErrorMessage(message)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <section className="rounded-xl border border-legal-blue/30 bg-legal-slate/50 p-5">
      <AnalysisLoader
        isVisible={isLoading}
        title="Confirming requirements"
        steps={['Reviewing extracted clauses...', 'Building requirement set...', 'Preparing validation phase...']}
      />

      <ErrorToast
        isVisible={Boolean(errorMessage)}
        title="Cannot confirm requirements"
        message={errorMessage}
        onDismiss={() => setErrorMessage('')}
      />

      <h3 className="text-xl font-semibold text-gray-100">Review</h3>
      <p className="mt-1 text-sm text-gray-400">
        Confirm extracted requirements and store them as the global requirements list.
      </p>

      {!state.rfpDocument && (
        <div className="mt-4">
          <EmptyState
            variant="requirements"
            title="No extraction context available"
            description="Go back to Upload and attach an RFP document before confirming requirements."
            actionLabel="Back to Upload"
            onAction={() => dispatch({ type: 'SET_STEP', payload: 'upload' })}
          />
        </div>
      )}

      <p className="mt-4 text-sm text-gray-300">
        Current confirmed requirements: <span className="font-semibold text-gray-100">{state.requirements.length}</span>
      </p>

      <button
        type="button"
        onClick={() => {
          void handleConfirm()
        }}
        disabled={isLoading}
        className="mt-4 rounded-lg bg-legal-accent px-4 py-2 font-semibold text-white"
      >
        {isLoading ? 'Extracting Requirements...' : 'Confirm Requirements'}
      </button>
    </section>
  )
}
