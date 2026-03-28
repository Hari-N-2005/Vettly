import React, { useState } from 'react'
import DocumentDropZone from './DocumentDropZone'
import FilePreview from './FilePreview'
import Button from '@/components/common/Button'
import { UploadState } from '@/types'

export default function RFPUploadForm() {
  const [uploadState, setUploadState] = useState<UploadState>({
    file: null,
    fileName: '',
    projectName: '',
    isUploading: false,
    progress: 0,
  })

  const [formErrors, setFormErrors] = useState<{ projectName?: string }>({})

  const handleFileSelect = (file: File) => {
    setUploadState(prev => ({
      ...prev,
      file,
      fileName: file.name,
    }))
  }

  const handleProjectNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUploadState(prev => ({
      ...prev,
      projectName: e.target.value,
    }))
    setFormErrors({})
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

  const handleAnalyseRFP = () => {
    if (!validateForm()) return

    setUploadState(prev => ({
      ...prev,
      isUploading: true,
    }))

    // Simulate API call
    setTimeout(() => {
      console.log('Analysing RFP:', {
        projectName: uploadState.projectName,
        fileName: uploadState.fileName,
        fileSize: uploadState.file?.size,
      })

      setUploadState(prev => ({
        ...prev,
        isUploading: false,
      }))

      // Here you would typically navigate to the requirements review page
      alert(`✅ RFP "${uploadState.projectName}" uploaded successfully!\n\nWould navigate to requirements extraction page.`)

      // Reset form
      setUploadState({
        file: null,
        fileName: '',
        projectName: '',
        isUploading: false,
        progress: 0,
      })
    }, 1500)
  }

  return (
    <div className="bg-gradient-to-br from-legal-slate to-legal-dark rounded-xl p-8 border border-legal-blue border-opacity-30 shadow-2xl">
      <h2 className="text-2xl font-bold text-gray-100 mb-2">Start New Tender Review</h2>
      <p className="text-gray-400 text-sm mb-6">
        Upload your RFP document and we'll automatically extract requirements
      </p>

      <div className="space-y-6">
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
          <DocumentDropZone onFileSelect={handleFileSelect} isLoading={uploadState.isUploading} />
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
            }}
            disabled={uploadState.isUploading}
          >
            Clear
          </Button>
        </div>
      </div>
    </div>
  )
}
