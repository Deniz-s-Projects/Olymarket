import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import WantedBoardFilters from '../components/WantedBoardFilters'
import WantedRequestCard from '../components/WantedRequestCard'
import { useWantedListings, type WantedListingsFilters } from '../hooks/useWantedListings'
import { fetchListingCategories } from '../services/listings'
import {
  respondToWantedListing,
  type RespondToWantedListingPayload,
  type WantedListingStatus,
} from '../services/wantedListings'
import { useAuth } from '../context/useAuth'

const parseBudgetInput = (value: string): number | null => {
  if (!value || value.trim().length === 0) {
    return null
  }
  const parsed = Number(value)
  if (Number.isFinite(parsed) && parsed >= 0) {
    return parsed
  }
  return null
}

const WantedBoard = () => {
  const navigate = useNavigate()
  const { user, token } = useAuth()
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState<WantedListingStatus | 'all'>('open')
  const [minBudget, setMinBudget] = useState('')
  const [maxBudget, setMaxBudget] = useState('')
  const [availableCategories, setAvailableCategories] = useState<string[]>([])
  const [feedback, setFeedback] = useState<{
    type: 'success' | 'error'
    message: string
  } | null>(null)
  const [respondingId, setRespondingId] = useState<string | null>(null)

  useEffect(() => {
    let isMounted = true

    const loadCategories = async () => {
      try {
        const categories = await fetchListingCategories()
        if (!isMounted) return
        const names = categories
          .map((category) => category.name?.trim())
          .filter((name): name is string => Boolean(name && name.length > 0))
        const unique = Array.from(new Set(names)).sort((a, b) => a.localeCompare(b))
        setAvailableCategories(unique)
      } catch (caughtError) {
        console.error('Unable to load categories for buyer requests', caughtError)
      }
    }

    void loadCategories()

    return () => {
      isMounted = false
    }
  }, [])

  useEffect(() => {
    if (!feedback) {
      return
    }

    const timeoutId = window.setTimeout(() => setFeedback(null), 5000)
    return () => window.clearTimeout(timeoutId)
  }, [feedback])

  const filters = useMemo(() => {
    const filter: WantedListingsFilters = {
      searchTerm,
      category: selectedCategory,
    }

    if (statusFilter && statusFilter !== 'all') {
      filter.status = statusFilter
    }

    const min = parseBudgetInput(minBudget)
    if (min !== null) {
      filter.minBudget = min
    }

    const max = parseBudgetInput(maxBudget)
    if (max !== null) {
      filter.maxBudget = max
    }

    return filter
  }, [maxBudget, minBudget, searchTerm, selectedCategory, statusFilter])

  const { requests, isLoading, isFetchingMore, isError, error, hasMore, total, fetchNextPage, refetch } =
    useWantedListings(filters)

  const fallbackCategories = useMemo(() => {
    const names = requests
      .map((request) => request.category?.name?.trim())
      .filter((name): name is string => Boolean(name && name.length > 0))
    return Array.from(new Set(names)).sort((a, b) => a.localeCompare(b))
  }, [requests])

  const categories = availableCategories.length > 0 ? availableCategories : fallbackCategories

  const handleResetFilters = () => {
    setSearchTerm('')
    setSelectedCategory(null)
    setStatusFilter('open')
    setMinBudget('')
    setMaxBudget('')
  }

  const handleRespond = useCallback(
    async (id: string, payload: RespondToWantedListingPayload) => {
      if (!token) {
        navigate('/auth', {
          state: {
            from: '/wanted',
            message: 'Please sign in to respond to buyer requests.',
          },
        })
        throw new Error('Please sign in to respond to buyer requests.')
      }

      setRespondingId(id)
      setFeedback(null)

      try {
        const response = await respondToWantedListing(id, payload)
        setFeedback({
          type: 'success',
          message: response.conversation
            ? 'We opened a conversation in your inbox so you can coordinate the details.'
            : 'Response sent to the buyer.',
        })
        await refetch()
      } catch (caughtError) {
        const normalizedError =
          caughtError instanceof Error
            ? caughtError
            : new Error('Unable to send your response. Please try again later.')
        setFeedback({ type: 'error', message: normalizedError.message })
        throw normalizedError
      } finally {
        setRespondingId(null)
      }
    },
    [navigate, refetch, token],
  )

  const headerMessage = isLoading
    ? 'Fetching active buyer requests...'
    : isError
      ? 'We were unable to load buyer requests. Please try again.'
      : total === 0
        ? 'No buyer requests match your filters yet.'
        : `${total} open request${total === 1 ? '' : 's'} ready for responses.`

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-10 px-4 py-12 lg:px-8">
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-indigo-600 to-primary text-white shadow-xl">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.18),_transparent_65%)]" aria-hidden="true" />
        <div className="relative grid gap-6 p-10 sm:p-12 md:grid-cols-[1.1fr_0.9fr] md:items-center">
          <div className="space-y-5">
            <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em]">
              Buyer Match Board
            </span>
            <h1 className="text-3xl font-semibold leading-tight sm:text-4xl md:text-5xl">
              Connect with buyers looking for your expertise
            </h1>
            <p className="max-w-xl text-base text-white/90 sm:text-lg">
              Browse active requests from Olympic fans, teams, and partners searching for trusted sellers. Offer solutions
              that fit their needs and start a conversation instantly.
            </p>
            <div className="flex flex-wrap items-center gap-3 text-sm text-white/90">
              <span>• Respond directly with tailored offers</span>
              <span>• Convert matches into conversations</span>
              <span>• Build relationships across the community</span>
            </div>
          </div>
          <div className="hidden md:block">
            <div className="rounded-2xl bg-white/10 p-6 shadow-inner backdrop-blur">
              <ul className="space-y-3 text-sm text-white/90">
                <li className="flex items-start gap-3">
                  <span className="mt-1 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white/20 text-xs font-semibold">
                    1
                  </span>
                  Discover needs from verified buyers in real time.
                </li>
                <li className="flex items-start gap-3">
                  <span className="mt-1 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white/20 text-xs font-semibold">
                    2
                  </span>
                  Share proposals, pricing, or introductions with a single response.
                </li>
                <li className="flex items-start gap-3">
                  <span className="mt-1 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white/20 text-xs font-semibold">
                    3
                  </span>
                  Turn a match into a conversation and close the loop faster.
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      <div className="grid gap-8 lg:grid-cols-[260px_1fr] lg:items-start">
        <WantedBoardFilters
          searchTerm={searchTerm}
          onSearchTermChange={setSearchTerm}
          categoryOptions={categories}
          selectedCategory={selectedCategory}
          onCategoryChange={setSelectedCategory}
          status={statusFilter}
          onStatusChange={setStatusFilter}
          minBudget={minBudget}
          maxBudget={maxBudget}
          onMinBudgetChange={setMinBudget}
          onMaxBudgetChange={setMaxBudget}
          onReset={handleResetFilters}
        />

        <section className="space-y-6">
          <header className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-2xl font-semibold text-slate-900">Active buyer requests</h2>
              <p className="text-sm text-slate-500">{headerMessage}</p>
            </div>
          </header>

          <div aria-live="polite" className="min-h-[1.5rem] text-sm">
            {feedback ? (
              <span className={feedback.type === 'success' ? 'text-emerald-600' : 'text-red-600'}>{feedback.message}</span>
            ) : null}
          </div>

          {isError ? (
            <div className="card flex flex-col gap-4 p-8">
              <div className="flex items-center gap-3 text-slate-900">
                <span className="text-2xl">⚠️</span>
                <div>
                  <h3 className="text-lg font-semibold">We couldn't load buyer requests</h3>
                  <p className="text-sm text-slate-600">{error?.message ?? 'Please refresh the page or try again shortly.'}</p>
                </div>
              </div>
              <div>
                <button
                  type="button"
                  onClick={() => void refetch()}
                  className="btn-primary inline-flex items-center rounded-full px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary/60"
                >
                  Try again
                </button>
              </div>
            </div>
          ) : null}

          {isLoading ? (
            <div className="grid gap-6 sm:grid-cols-2">
              {Array.from({ length: 4 }).map((_, index) => (
                <div key={index} className="card h-full animate-pulse p-6">
                  <div className="h-4 w-1/3 rounded-full bg-slate-200" />
                  <div className="mt-4 space-y-3">
                    <div className="h-6 w-3/4 rounded-full bg-slate-200" />
                    <div className="h-4 w-full rounded-full bg-slate-200" />
                    <div className="h-4 w-5/6 rounded-full bg-slate-200" />
                    <div className="h-10 w-full rounded-xl bg-slate-200" />
                  </div>
                </div>
              ))}
            </div>
          ) : null}

          {!isLoading && !isError && requests.length === 0 ? (
            <div className="card flex flex-col items-center gap-4 p-10 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 text-3xl">🛎️</div>
              <div className="space-y-2">
                <h3 className="text-xl font-semibold text-slate-900">No buyer requests fit your filters yet</h3>
                <p className="text-sm text-slate-600">
                  Try adjusting your filters or check back soon—new requests arrive throughout the day.
                </p>
              </div>
              <button
                type="button"
                onClick={handleResetFilters}
                className="btn-primary inline-flex items-center rounded-full px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary/60"
              >
                Reset filters
              </button>
            </div>
          ) : null}

          {!isLoading && !isError && requests.length > 0 ? (
            <div className="grid gap-6 sm:grid-cols-2">
              {requests.map((request) => (
                <WantedRequestCard
                  key={request.id}
                  request={request}
                  isResponding={respondingId === request.id}
                  onRespond={handleRespond}
                  currentUserId={user?.id}
                />
              ))}
            </div>
          ) : null}

          {!isLoading && !isError && hasMore ? (
            <div className="flex justify-center pt-4">
              <button
                type="button"
                onClick={() => void fetchNextPage()}
                disabled={isFetchingMore}
                className="inline-flex items-center rounded-full border border-slate-200 px-5 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isFetchingMore ? 'Loading more requests…' : 'Load more requests'}
              </button>
            </div>
          ) : null}
        </section>
      </div>
    </div>
  )
}

export default WantedBoard
