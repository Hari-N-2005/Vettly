import { useEffect } from 'react'

interface ErrorToastProps {
  isVisible: boolean
  message: string
  title?: string
  retryLabel?: string
  dismissLabel?: string
  autoHideMs?: number
  onRetry?: () => void
  onDismiss?: () => void
}

export default function ErrorToast({
  isVisible,
  message,
  title = 'Something went wrong',
  retryLabel = 'Retry',
  dismissLabel = 'Dismiss',
  autoHideMs,
  onRetry,
  onDismiss,
}: ErrorToastProps) {
  useEffect(() => {
    if (!isVisible || !autoHideMs || !onDismiss) {
      return
    }

    const timer = window.setTimeout(() => onDismiss(), autoHideMs)
    return () => window.clearTimeout(timer)
  }, [autoHideMs, isVisible, onDismiss])

  return (
    <div
      aria-live="assertive"
      className={`fixed right-4 top-4 z-[130] w-full max-w-md transform transition-all duration-300 ${
        isVisible ? 'translate-x-0 opacity-100' : 'translate-x-8 opacity-0 pointer-events-none'
      }`}
    >
      <div className="rounded-xl border border-rose-500/40 bg-rose-950/85 p-4 shadow-2xl backdrop-blur-sm">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 rounded-full border border-rose-300/50 bg-rose-400/20 p-1.5 text-rose-200">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          </div>

          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-rose-100">{title}</p>
            <p className="mt-1 text-sm text-rose-200/90">{message}</p>

            <div className="mt-3 flex flex-wrap gap-2">
              {onRetry && (
                <button
                  type="button"
                  onClick={onRetry}
                  className="rounded-lg border border-rose-300/40 bg-rose-400/20 px-3 py-1.5 text-xs font-semibold text-rose-100 hover:bg-rose-400/30"
                >
                  {retryLabel}
                </button>
              )}

              {onDismiss && (
                <button
                  type="button"
                  onClick={onDismiss}
                  className="rounded-lg border border-legal-blue/40 bg-legal-dark/60 px-3 py-1.5 text-xs font-semibold text-gray-200 hover:bg-legal-blue/20"
                >
                  {dismissLabel}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
