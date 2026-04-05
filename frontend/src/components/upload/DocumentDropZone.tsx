import React, { useRef, useState } from 'react'

interface DocumentDropZoneProps {
  onFileSelect: (file: File) => void
  isLoading?: boolean
  acceptedFormats?: string[]
}

export default function DocumentDropZone({
  onFileSelect,
  isLoading = false,
  acceptedFormats = ['.pdf', '.docx', '.doc', '.txt'],
}: DocumentDropZoneProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const validateFile = (file: File): boolean => {
    const maxFileSize = 50 * 1024 * 1024 // 50MB
    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase()

    if (file.size > maxFileSize) {
      setError('File size exceeds 50MB limit')
      return false
    }

    if (!acceptedFormats.some(fmt => fileExtension.endsWith(fmt.toLowerCase()))) {
      setError(`Unsupported file type. Accepted: ${acceptedFormats.join(', ')}`)
      return false
    }

    setError(null)
    return true
  }

  const handleFileSelection = (file: File) => {
    if (validateFile(file)) {
      onFileSelect(file)
    }
  }

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)

    const files = e.dataTransfer.files
    if (files.length > 0) {
      handleFileSelection(files[0])
    }
  }

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.currentTarget.files
    if (files && files.length > 0) {
      handleFileSelection(files[0])
    }
  }

  const handleClick = () => {
    fileInputRef.current?.click()
  }

  return (
    <div className="w-full">
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={handleClick}
        className={`relative border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all duration-300 ${
          isDragging
            ? 'border-legal-accent bg-legal-accent bg-opacity-10'
            : 'border-legal-blue hover:border-legal-accent hover:bg-legal-slate hover:bg-opacity-30'
        } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        <input
          ref={fileInputRef}
          type="file"
          onChange={handleFileInputChange}
          accept={acceptedFormats.join(',')}
          disabled={isLoading}
          className="hidden"
          aria-label="Upload RFP document"
        />

        <div className="flex flex-col items-center gap-3">
          {/* Upload Icon */}
          <div className="text-4xl">
            {isLoading ? <span>Uploading</span> : <span>📄</span>}
          </div>

          <div>
            <p className="text-lg font-semibold text-gray-100">
              {isDragging ? 'Drop your RFP document here' : 'Drag & drop RFP document'}
            </p>
            <p className="text-sm text-gray-400 mt-1">or click to browse</p>
          </div>

          <p className="text-xs text-gray-500">
            Supported formats: PDF, DOCX, DOC, TXT (Max 50MB)
          </p>
        </div>
      </div>

      {error && (
        <div className="mt-3 p-3 bg-red-900 bg-opacity-30 border border-red-700 rounded-lg text-red-300 text-sm flex items-start gap-2">
          <span className="text-lg">⚠️</span>
          <div>{error}</div>
        </div>
      )}
    </div>
  )
}
