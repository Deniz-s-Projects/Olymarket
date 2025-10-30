import { useCallback, useEffect, useMemo, useState } from 'react'

import { fetchListings, type Listing } from '../services/listings'

type ListingsState = {
  listings: Listing[]
  isLoading: boolean
  isError: boolean
  error: Error | null
  refetch: () => Promise<void>
}

export const useListings = (): ListingsState => {
  const [listings, setListings] = useState<Listing[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const loadListings = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const data = await fetchListings()
      setListings(data)
    } catch (error) {
      const normalizedError =
        error instanceof Error
          ? error
          : new Error('Something went wrong while fetching listings.')
      setError(normalizedError)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    loadListings()
  }, [loadListings])

  return useMemo(
    () => ({
      listings,
      isLoading,
      isError: Boolean(error),
      error,
      refetch: loadListings,
    }),
    [error, isLoading, listings, loadListings],
  )
}

export default useListings
