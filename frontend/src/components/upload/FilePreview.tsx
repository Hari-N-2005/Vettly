import React from 'react'

interface FilePreviewProps {
  fileName: string
  fileSize: number
  isUploading?: boolean
}

export default function FilePreview({
  fileName,
  fileSize,
  isUploading = false,
}: FilePreviewProps) {
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i]
  }

  return (
    <div className="mt-4 p-4 bg-legal-slate rounded-lg border border-legal-blue border-opacity-50">
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3 flex-1">
          <div className="text-2xl mt-1">📄</div>
          <div className="flex-1 min-w-0">
            <h4 className="font-semibold text-gray-100 truncate text-sm">{fileName}</h4>
            <p className="text-xs text-gray-400 mt-1">
              File size: {formatFileSize(fileSize)}
            </p>
            {isUploading && (
              <div className="mt-2">
                <div className="w-full bg-legal-slate rounded-full h-2">
                  <div className="bg-legal-accent h-2 rounded-full animate-pulse w-3/4" />
                </div>
                <p className="text-xs text-gray-400 mt-1">Uploading...</p>
              </div>
            )}
          </div>
        </div>
        <div className="ml-2 text-legal-gold text-lg">✓</div>
      </div>
    </div>
  )
}
