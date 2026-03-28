import { useCallback } from 'react'

/**
 * Custom hook for handling form submissions
 * @param onSubmit - Function to call on form submit
 * @param onSuccess - Optional callback on success
 * @param onError - Optional callback on error
 * @returns Object with isLoading and handleSubmit
 */
export const useFormSubmit = <T,>(
  onSubmit: () => Promise<T>,
  onSuccess?: (data: T) => void,
  onError?: (error: Error) => void
) => {
  const [isLoading, setIsLoading] = React.useState(false)
  const [error, setError] = React.useState<Error | null>(null)

  const handleSubmit = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const data = await onSubmit()
      setIsLoading(false)
      onSuccess?.(data)
      return data
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error')
      setError(error)
      setIsLoading(false)
      onError?.(error)
      throw error
    }
  }, [onSubmit, onSuccess, onError])

  return { isLoading, error, handleSubmit }
}

import React from 'react'
