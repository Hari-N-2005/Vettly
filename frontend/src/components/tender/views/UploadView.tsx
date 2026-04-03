import { ChangeEvent, useState } from 'react'
import { useTender } from '@/context/TenderContext'
import ErrorToast from '@/components/common/ErrorToast'
import EmptyState from '@/components/common/EmptyState'

export default function UploadView() {
  const { state, dispatch } = useTender()
  const [projectName, setProjectName] = useState(state.projectName)
  const [rfpDocument, setRfpDocument] = useState<File | null>(state.rfpDocument)
  const [errorMessage, setErrorMessage] = useState('')

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    setRfpDocument(event.target.files?.[0] ?? null)
  }

  const handleContinue = () => {
    if (!projectName.trim() || !rfpDocument) {
      setErrorMessage('Enter a project name and choose an RFP file before continuing.')
      return
    }

    dispatch({
      type: 'SET_RFP',
      payload: {
        projectName: projectName.trim(),
        rfpDocument,
      },
    })
    dispatch({ type: 'SET_STEP', payload: 'review' })
  }

  return (
    <section className="rounded-xl border border-legal-blue/30 bg-legal-slate/50 p-5">
      <ErrorToast
        isVisible={Boolean(errorMessage)}
        title="Upload step blocked"
        message={errorMessage}
        onDismiss={() => setErrorMessage('')}
      />

      <h3 className="text-xl font-semibold text-gray-100">Upload</h3>
      <p className="mt-1 text-sm text-gray-400">Set the project name and RFP document in global tender state.</p>

      {!rfpDocument && (
        <div className="mt-4">
          <EmptyState
            variant="requirements"
            title="No RFP file selected"
            description="Upload an RFP PDF to begin extracting and reviewing requirements."
          />
        </div>
      )}

      <div className="mt-4 grid gap-3">
        <input
          type="text"
          value={projectName}
          onChange={(event) => setProjectName(event.target.value)}
          placeholder="Project name"
          className="w-full rounded-lg border border-legal-blue/40 bg-legal-dark px-3 py-2 text-gray-100"
        />

        <input
          type="file"
          accept=".pdf,application/pdf"
          onChange={handleFileChange}
          className="w-full text-sm text-gray-300"
        />
      </div>

      <button
        type="button"
        onClick={handleContinue}
        disabled={!projectName.trim() || !rfpDocument}
        className="mt-4 rounded-lg bg-legal-accent px-4 py-2 font-semibold text-white disabled:opacity-50"
      >
        Continue to Review
      </button>
    </section>
  )
}
