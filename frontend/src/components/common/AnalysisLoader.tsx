import { useEffect, useState } from 'react'

interface AnalysisLoaderProps {
  isVisible: boolean
  title?: string
  showPercentage?: boolean
  progress?: number
  backdropClassName?: string
  panelClassName?: string
}

export default function AnalysisLoader({
  isVisible,
  title = 'Running tender analysis',
  showPercentage = true,
  progress,
  backdropClassName = '',
  panelClassName = '',
}: AnalysisLoaderProps) {
  const [simulatedProgress, setSimulatedProgress] = useState(0)

  useEffect(() => {
    if (!isVisible) {
      setSimulatedProgress(0)
      return
    }

    const timer = window.setInterval(() => {
      setSimulatedProgress(prev => {
        if (prev >= 92) {
          return 92
        }

        const nextStep = prev < 35 ? 3 : prev < 70 ? 2 : 1
        return Math.min(92, prev + nextStep)
      })
    }, 500)

    return () => window.clearInterval(timer)
  }, [isVisible])

  const computedProgress =
    typeof progress === 'number' ? Math.max(0, Math.min(100, progress)) : simulatedProgress

  if (!isVisible) {
    return null
  }

  return (
    <div
      role="status"
      aria-live="polite"
      className={`fixed inset-0 z-[120] flex items-center justify-center bg-legal-dark/80 backdrop-blur-sm ${backdropClassName}`}
    >
      <div className={`w-full max-w-xl rounded-2xl border border-legal-blue/30 bg-legal-slate/95 p-6 shadow-2xl ${panelClassName}`}>
        <div className="mb-4 flex items-center gap-3">
          <div className="h-8 w-8 rounded-full border-2 border-legal-accent border-t-transparent animate-spin" />
          <div>
            <p className="text-lg font-semibold text-gray-100">{title}</p>
            <p className="text-xs text-gray-400">Please wait while AI processes your tender data.</p>
          </div>
        </div>

        <div className="mb-3 h-2 overflow-hidden rounded-full border border-legal-blue/20 bg-legal-dark">
          <div
            className="h-full rounded-full bg-gradient-to-r from-legal-accent via-cyan-400 to-legal-gold transition-all duration-700"
            style={{ width: `${computedProgress}%` }}
          />
        </div>

        <div className="mb-4 flex items-center justify-between text-xs text-gray-400">
          <span>Analysis progress</span>
          {showPercentage && <span className="font-semibold text-legal-accent">{computedProgress}%</span>}
        </div>

        <div className="rounded-lg border border-legal-blue/20 bg-legal-dark/50 px-3 py-2 text-sm text-gray-400">
          Processing document and generating analysis...
        </div>
      </div>
    </div>
  )
}
