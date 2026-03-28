import { useState, useCallback } from 'react'

interface FetchState<T> {
  data: T | null
  loading: boolean
  error: Error | null
}

interface UseFetchReturn<T> extends FetchState<T> {
  refetch: () => Promise<void>
}

/**
 * Custom hook for fetching data
 * @param fetchFn - Function that returns a promise
 * @param dependencies - Dependencies array for useCallback
 * @returns Object with data, loading, error, and refetch
 */
export const useFetch = <T,>(
  fetchFn: () => Promise<T>,
  dependencies: React.DependencyList = []
): UseFetchReturn<T> => {
  const [state, setState] = useState<FetchState<T>>({
    data: null,
    loading: true,
    error: null,
  })

  const refetch = useCallback(async () => {
    setState({ data: null, loading: true, error: null })
    try {
      const result = await fetchFn()
      setState({ data: result, loading: false, error: null })
    } catch (err) {
      setState({
        data: null,
        loading: false,
        error: err instanceof Error ? err : new Error('Unknown error'),
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, dependencies)

  // Initial fetch
  useState(() => {
    refetch()
  })

  return { ...state, refetch }
}
