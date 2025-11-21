import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import {
  fetchWantedListings,
  type PaginatedWantedListings,
  type WantedListing,
  type WantedListingStatus,
  type WantedListingsQueryParams,
} from '../services/wantedListings'

const DEFAULT_PAGE_SIZE = 12

type WantedListingsFilters = {
  searchTerm?: string
  category?: string | null
  status?: WantedListingStatus | 'all'
  minPrice?: number | null
  maxPrice?: number | null
}

type UseWantedListingsOptions = {
  limit?: number
}

type WantedListingsState = {
  requests: WantedListing[]
  isLoading: boolean
  isFetchingMore: boolean
  isError: boolean
  error: Error | null
  hasMore: boolean
  page: number
  total: number
  refetch: () => Promise<void>
  fetchNextPage: () => Promise<void>
}

const buildQueryParams = (
  filters: WantedListingsFilters,
): Omit<WantedListingsQueryParams, 'page' | 'limit'> => {
  const query: Omit<WantedListingsQueryParams, 'page' | 'limit'> = {}

  if (typeof filters.searchTerm === 'string') {
    const trimmed = filters.searchTerm.trim()
    if (trimmed.length > 0) {
      query.q = trimmed
    }
  }

  if (typeof filters.category === 'string') {
    const trimmedCategory = filters.category.trim()
    if (trimmedCategory.length > 0) {
      query.category = trimmedCategory
    }
  }

  if (filters.status && filters.status !== 'all') {
    query.status = filters.status
  }

  if (typeof filters.minPrice === 'number' && Number.isFinite(filters.minPrice)) {
    query.minPrice = filters.minPrice
  }

  if (typeof filters.maxPrice === 'number' && Number.isFinite(filters.maxPrice)) {
    query.maxPrice = filters.maxPrice
  }

  return query
}

export const useWantedListings = (
  filters: WantedListingsFilters = {},
  options: UseWantedListingsOptions = {},
): WantedListingsState => {
  const limit = options.limit ?? DEFAULT_PAGE_SIZE
  const [requests, setRequests] = useState<WantedListing[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isFetchingMore, setIsFetchingMore] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [hasMore, setHasMore] = useState(false)
  const requestIdRef = useRef(0)

  const queryFilters = useMemo(() => buildQueryParams(filters), [filters])

  const loadRequests = useCallback(
    async (pageToLoad: number, append: boolean) => {
      const requestId = requestIdRef.current + 1
      requestIdRef.current = requestId

      if (append) {
        setIsFetchingMore(true)
      } else {
        setIsLoading(true)
      }
      setError(null)

      try {
        const params: WantedListingsQueryParams = {
          page: pageToLoad,
          limit,
          ...queryFilters,
        }

        const response: PaginatedWantedListings = await fetchWantedListings(params)

        if (requestId !== requestIdRef.current) {
          return
        }

        setRequests((previous) => {
          if (!append) {
            return response.data
          }

          const existingIds = new Set(previous.map((item) => item.id))
          const newItems = response.data.filter((item) => !existingIds.has(item.id))
          return [...previous, ...newItems]
        })

        setPage(response.meta.page)
        setTotal(response.meta.total)
        setHasMore(response.meta.hasMore)
      } catch (caughtError) {
        if (requestId === requestIdRef.current) {
          const normalizedError =
            caughtError instanceof Error
              ? caughtError
              : new Error('Something went wrong while fetching room offers.')
          setError(normalizedError)
        }
      } finally {
        if (requestId === requestIdRef.current) {
          if (append) {
            setIsFetchingMore(false)
          } else {
            setIsLoading(false)
          }
        }
      }
    },
    [limit, queryFilters],
  )

  useEffect(() => {
    setRequests([])
    setPage(1)
    setTotal(0)
    setHasMore(false)
    loadRequests(1, false)
  }, [loadRequests])

  const refetch = useCallback(async () => {
    await loadRequests(1, false)
  }, [loadRequests])

  const fetchNextPage = useCallback(async () => {
    if (!hasMore || isLoading || isFetchingMore) {
      return
    }
    await loadRequests(page + 1, true)
  }, [hasMore, isFetchingMore, isLoading, loadRequests, page])

  return useMemo(
    () => ({
      requests,
      isLoading,
      isFetchingMore,
      isError: Boolean(error),
      error,
      hasMore,
      page,
      total,
      refetch,
      fetchNextPage,
    }),
    [error, fetchNextPage, hasMore, isFetchingMore, isLoading, page, refetch, requests, total],
  )
}

export type { WantedListingsFilters }
