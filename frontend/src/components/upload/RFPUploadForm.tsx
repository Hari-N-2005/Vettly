import { ChangeEvent, useEffect, useState } from 'react'
import DocumentDropZone from './DocumentDropZone'
import FilePreview from './FilePreview'
import Button from '@/components/common/Button'
import { ExtractRequirementsResponse, UploadState } from '@/types'
import { extractRequirements, uploadRFPForExtraction } from '@/services/rfpService'
import SimulatedProgressBar from '@/components/common/SimulatedProgressBar'
import { useSimulatedProgress } from '@/hooks/useSimulatedProgress'

interface RFPUploadFormProps {
  onRequirementsExtracted?: (
    payload: ExtractRequirementsResponse & {
      projectName: string
    },
    file?: File
  ) => void
}

export default function RFPUploadForm({ onRequirementsExtracted }: RFPUploadFormProps) {
  const [uploadState, setUploadState] = useState<UploadState>({
    file: null,
    fileName: '',
    projectName: '',
    isUploading: false,
    progress: 0,
  })

  const [formErrors, setFormErrors] = useState<{ projectName?: string }>({})
  const [statusMessage, setStatusMessage] = useState<string | null>(null)
  const [statusError, setStatusError] = useState<string | null>(null)
  const { progress, complete, reset } = useSimulatedProgress({
    isActive: uploadState.isUploading,
    totalDurationMs: 21000,
  })

  useEffect(() => {
    if (uploadState.isUploading) {
      return
    }

    if (statusMessage && statusMessage.startsWith('Extracted')) {
      complete()
      const hideTimer = window.setTimeout(() => reset(), 1200)
      return () => window.clearTimeout(hideTimer)
    }

    if (statusError) {
      reset()
    }
  }, [complete, reset, statusError, statusMessage, uploadState.isUploading])

  const handleFileSelect = (file: File) => {
    setUploadState(prev => ({
      ...prev,
      file,
      fileName: file.name,
    }))
  }

  const handleProjectNameChange = (e: ChangeEvent<HTMLInputElement>) => {
    setUploadState(prev => ({
      ...prev,
      projectName: e.target.value,
    }))
    setFormErrors({})
    setStatusMessage(null)
    setStatusError(null)
  }

  const validateForm = (): boolean => {
    const errors: { projectName?: string } = {}

    if (!uploadState.projectName.trim()) {
      errors.projectName = 'Project name is required'
    }

    if (!uploadState.file) {
      errors.projectName = 'Please upload an RFP document'
    }

    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleAnalyseRFP = async () => {
    if (!validateForm()) return

    setUploadState(prev => ({
      ...prev,
      isUploading: true,
    }))
    setStatusMessage('Uploading RFP and extracting raw text...')
    setStatusError(null)

    try {
      if (!uploadState.file) {
        throw new Error('Please select an RFP file before continuing.')
      }

      const uploadResult = await uploadRFPForExtraction(uploadState.file)
      setStatusMessage('Extracting mandatory requirements...')

      const extractionResult = await extractRequirements(uploadResult.rawText)

      onRequirementsExtracted?.(
        {
          ...extractionResult,
          projectName: uploadState.projectName.trim(),
        },
        uploadState.file
      )

      setStatusMessage(`Extracted ${extractionResult.totalCount} requirement(s). Review them below.`)
      setUploadState(prev => ({
        ...prev,
        isUploading: false,
      }))
      complete()
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to extract requirements from this RFP.'

      setUploadState(prev => ({
        ...prev,
        isUploading: false,
      }))
      setStatusMessage(null)
      setStatusError(errorMessage)
      reset()
    }
  }

  return (
    <div className="bg-gradient-to-br from-legal-slate to-legal-dark rounded-xl p-8 border border-legal-blue border-opacity-30 shadow-2xl">
      <h2 className="text-2xl font-bold text-gray-100 mb-2">Start New Tender Review</h2>
      <p className="text-gray-400 text-sm mb-6">
        Upload your RFP document and we'll automatically extract requirements
      </p>

      <div className="space-y-6">
        {uploadState.isUploading && (
          <SimulatedProgressBar
            progress={progress}
            label="Extracting requirements"
            helperText="This is an estimated progress indicator while Gemini processes the PDF."
          />
        )}

        {/* Project Name Input */}
        <div>
          <label htmlFor="projectName" className="block text-sm font-semibold text-gray-200 mb-2">
            Project Name *
          </label>
          <input
            id="projectName"
            type="text"
            value={uploadState.projectName}
            onChange={handleProjectNameChange}
            placeholder="e.g., Enterprise Software License 2024"
            disabled={uploadState.isUploading}
            className="w-full px-4 py-3 bg-legal-dark border border-legal-blue rounded-lg text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-legal-accent focus:border-transparent transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          />
          {formErrors.projectName && (
            <p className="mt-2 text-sm text-red-400 flex items-center gap-1">
              <span>⚠️</span>
              {formErrors.projectName}
            </p>
          )}
        </div>

        {/* File Upload Zone */}
        <div>
          <label className="block text-sm font-semibold text-gray-200 mb-3">
            RFP Document *
          </label>
          <DocumentDropZone
            onFileSelect={handleFileSelect}
            isLoading={uploadState.isUploading}
            acceptedFormats={['.pdf']}
          />
        </div>

        {/* File Preview */}
        {uploadState.file && (
          <FilePreview
            fileName={uploadState.fileName}
            fileSize={uploadState.file.size}
            isUploading={uploadState.isUploading}
          />
        )}

        {/* Action Buttons */}
        <div className="flex gap-3 pt-4">
          <Button
            variant="primary"
            size="lg"
            onClick={handleAnalyseRFP}
            isLoading={uploadState.isUploading}
            disabled={!uploadState.file || !uploadState.projectName.trim()}
            className="flex-1"
          >
            Analyse RFP
          </Button>
          <Button
            variant="secondary"
            size="lg"
            onClick={() => {
              setUploadState({
                file: null,
                fileName: '',
                projectName: '',
                isUploading: false,
                progress: 0,
              })
              setFormErrors({})
              setStatusMessage(null)
              setStatusError(null)
            }}
            disabled={uploadState.isUploading}
          >
            Clear
          </Button>
        </div>

        {statusMessage && (
          <p className="text-sm text-emerald-300 bg-emerald-950/40 border border-emerald-700/40 rounded-lg px-3 py-2">
            {statusMessage}
          </p>
        )}

        {statusError && (
          <p className="text-sm text-red-300 bg-red-950/40 border border-red-700/40 rounded-lg px-3 py-2">
            {statusError}
          </p>
        )}
      </div>
    </div>
  )
}
