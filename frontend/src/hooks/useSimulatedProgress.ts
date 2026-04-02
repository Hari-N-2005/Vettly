import { useEffect, useRef, useState } from 'react'

const DEFAULT_STAGES = [10, 25, 45, 65, 82, 92, 98, 100]

interface UseSimulatedProgressOptions {
  isActive: boolean
  totalDurationMs?: number
  stages?: number[]
}

export function useSimulatedProgress({
  isActive,
  totalDurationMs = 21000,
  stages = DEFAULT_STAGES,
}: UseSimulatedProgressOptions) {
  const [progress, setProgress] = useState(0)
  const timersRef = useRef<number[]>([])

  useEffect(() => {
    const clearTimers = () => {
      timersRef.current.forEach(timerId => window.clearTimeout(timerId))
      timersRef.current = []
    }

    clearTimers()

    if (!isActive) {
      setProgress(0)
      return clearTimers
    }

    setProgress(stages[0] ?? 0)

    const baseDelays = [1800, 2900, 3400, 3200, 2800, 2500, 2300]
    const randomizedDelays = baseDelays.map(delay => {
      const jitter = 0.75 + Math.random() * 0.5
      return delay * jitter
    })

    const delaySum = randomizedDelays.reduce((sum, value) => sum + value, 0)
    const scale = totalDurationMs / delaySum
    const stageDelays = randomizedDelays.map(delay => Math.max(700, Math.round(delay * scale)))

    let elapsedMs = 0
    stages.slice(1).forEach((stage, index) => {
      const delay = stageDelays[index] ?? 1000
      elapsedMs += delay

      const timerId = window.setTimeout(() => {
        setProgress(stage)
      }, elapsedMs)

      timersRef.current.push(timerId)
    })

    return clearTimers
  }, [isActive, stages, totalDurationMs])

  const complete = () => {
    timersRef.current.forEach(timerId => window.clearTimeout(timerId))
    timersRef.current = []
    setProgress(100)
  }

  const reset = () => {
    timersRef.current.forEach(timerId => window.clearTimeout(timerId))
    timersRef.current = []
    setProgress(0)
  }

  return { progress, complete, reset }
}
