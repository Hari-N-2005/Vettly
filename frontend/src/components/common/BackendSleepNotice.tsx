import { useEffect, useState } from 'react'

interface BackendSleepNoticeProps {
  isActive: boolean
  delayMs?: number
  title?: string
  message?: string
}

export default function BackendSleepNotice({
  isActive,
  delayMs = 5000,
  title = 'Backend is waking up',
  message = 'The free-tier backend may sleep after inactivity. Please wait 50-60 seconds while it starts.',
}: BackendSleepNoticeProps) {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    if (!isActive) {
      setIsVisible(false)
      return
    }

    const timer = window.setTimeout(() => {
      setIsVisible(true)
    }, delayMs)

    return () => {
      window.clearTimeout(timer)
    }
  }, [delayMs, isActive])

  if (!isVisible) {
    return null
  }

  return (
    <div className="fixed bottom-4 right-4 z-[140] max-w-sm rounded-lg border border-amber-500/40 bg-amber-950/95 px-4 py-3 text-amber-100 shadow-2xl backdrop-blur-sm">
      <p className="text-sm font-semibold">{title}</p>
      <p className="mt-1 text-xs leading-relaxed text-amber-200">{message}</p>
    </div>
  )
}
