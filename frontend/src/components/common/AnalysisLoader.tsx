import { useEffect, useMemo, useState } from 'react'

interface AnalysisLoaderProps {
  isVisible: boolean
  title?: string
  steps?: string[]
  intervalMs?: number
  showPercentage?: boolean
  progress?: number
  backdropClassName?: string
  panelClassName?: string
}

const defaultSteps = [
  'Extracting text...',
  'Identifying requirements...',
  'Categorising clauses...',
  'Cross-checking obligations...',
  'Preparing analysis results...',
]

export default function AnalysisLoader({
  isVisible,
  title = 'Running tender analysis',
  steps = defaultSteps,
  intervalMs = 1400,
  showPercentage = true,
  progress,
  backdropClassName = '',
  panelClassName = '',
}: AnalysisLoaderProps) {
  const [activeStepIndex, setActiveStepIndex] = useState(0)

  const safeSteps = useMemo(() => (steps.length > 0 ? steps : defaultSteps), [steps])

  useEffect(() => {
    if (!isVisible) {
      setActiveStepIndex(0)
      return
    }

    const timer = window.setInterval(() => {
      setActiveStepIndex(prev => (prev + 1) % safeSteps.length)
    }, intervalMs)

    return () => window.clearInterval(timer)
  }, [intervalMs, isVisible, safeSteps.length])

  if (!isVisible) {
    return null
  }

  const computedProgress =
    typeof progress === 'number'
      ? Math.max(0, Math.min(100, progress))
      : Math.round(((activeStepIndex + 1) / safeSteps.length) * 100)

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

        <ul className="space-y-2">
          {safeSteps.map((step, index) => {
            const isActive = index === activeStepIndex
            const isCompleted = index < activeStepIndex

            return (
              <li
                key={`${step}-${index}`}
                className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-all ${
                  isActive
                    ? 'border-legal-accent/50 bg-legal-accent/15 text-legal-accent'
                    : isCompleted
                      ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300'
                      : 'border-legal-blue/20 bg-legal-dark/50 text-gray-400'
                }`}
              >
                <span className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-current text-[11px] font-semibold">
                  {isCompleted ? 'OK' : index + 1}
                </span>
                <span>{step}</span>
              </li>
            )
          })}
        </ul>
      </div>
    </div>
  )
}
