import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { fetchListings, type Listing, type ListingsQueryParams } from '../services/listings'

const DEFAULT_PAGE_SIZE = 12

export type ListingsFilters = {
  searchTerm?: string
  category?: string | null
  isFree?: boolean
  minPrice?: number | null
  maxPrice?: number | null
  sortBy?: 'price' | 'createdAt'
  sortOrder?: 'asc' | 'desc'
}

type UseListingsOptions = {
  limit?: number
}

type ListingsState = {
  listings: Listing[]
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

const buildQueryParams = (filters: ListingsFilters): Omit<ListingsQueryParams, 'page' | 'limit'> => {
  const {
    searchTerm,
    category,
    isFree,
    minPrice,
    maxPrice,
    sortBy,
    sortOrder,
  } = filters

  const normalized: Omit<ListingsQueryParams, 'page' | 'limit'> = {}

  if (typeof searchTerm === 'string') {
    const trimmed = searchTerm.trim()
    if (trimmed.length > 0) {
      normalized.q = trimmed
    }
  }

  if (typeof category === 'string') {
    const trimmedCategory = category.trim()
    if (trimmedCategory.length > 0) {
      normalized.category = trimmedCategory
    }
  }

  if (typeof isFree === 'boolean') {
    normalized.isFree = isFree
  }

  if (typeof minPrice === 'number' && Number.isFinite(minPrice)) {
    normalized.minPrice = minPrice
  }

  if (typeof maxPrice === 'number' && Number.isFinite(maxPrice)) {
    normalized.maxPrice = maxPrice
  }

  if (sortBy === 'price' || sortBy === 'createdAt') {
    normalized.sortBy = sortBy
  }

  if (sortOrder === 'asc' || sortOrder === 'desc') {
    normalized.sortOrder = sortOrder
  }

  return normalized
}

export const useListings = (
  filters?: ListingsFilters,
  options?: UseListingsOptions,
): ListingsState => {
  const resolvedOptions = options ?? {}
  const limit = resolvedOptions.limit ?? DEFAULT_PAGE_SIZE

  const [listings, setListings] = useState<Listing[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isFetchingMore, setIsFetchingMore] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [hasMore, setHasMore] = useState(false)
  const requestIdRef = useRef(0)

  const queryFilters = useMemo(() => buildQueryParams(filters ?? {}), [filters])

  const loadListings = useCallback(
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
        const params: ListingsQueryParams = {
          page: pageToLoad,
          limit,
          ...queryFilters,
        }

        const response = await fetchListings(params)

        if (requestId !== requestIdRef.current) {
          return
        }

        setListings((previous) => {
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
              : new Error('Something went wrong while fetching listings.')
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
    setListings([])
    setPage(1)
    setTotal(0)
    setHasMore(false)
    loadListings(1, false)
  }, [loadListings])

  const refetch = useCallback(async () => {
    await loadListings(1, false)
  }, [loadListings])

  const fetchNextPage = useCallback(async () => {
    if (!hasMore || isLoading || isFetchingMore) {
      return
    }
    await loadListings(page + 1, true)
  }, [hasMore, isFetchingMore, isLoading, loadListings, page])

  return useMemo(
    () => ({
      listings,
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
    [error, fetchNextPage, hasMore, isFetchingMore, isLoading, listings, page, refetch, total],
  )
}

export default useListings
