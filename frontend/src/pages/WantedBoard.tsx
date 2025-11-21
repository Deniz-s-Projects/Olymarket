import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import RoomOfferCard from '../components/RoomOfferCard'
import WantedBoardFilters from '../components/WantedBoardFilters'
import { useWantedListings, type WantedListingsFilters } from '../hooks/useWantedListings'
import { fetchListingCategories } from '../services/listings'
import { createWantedListing, type WantedListingStatus } from '../services/wantedListings'
import { useAuth } from '../context/useAuth'

const parsePriceInput = (value: string): number | null => {
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
  const [minPrice, setMinPrice] = useState('')
  const [maxPrice, setMaxPrice] = useState('')
  const [availableCategories, setAvailableCategories] = useState<string[]>([])
  const [formFeedback, setFormFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null)
  const [formIsSubmitting, setFormIsSubmitting] = useState(false)

  const [offerTitle, setOfferTitle] = useState('')
  const [offerPrice, setOfferPrice] = useState('')
  const [offerAddress, setOfferAddress] = useState('')
  const [offerContact, setOfferContact] = useState('')
  const [offerExpiry, setOfferExpiry] = useState('')
  const [offerDetails, setOfferDetails] = useState('')

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
        console.error('Unable to load categories for room offers', caughtError)
      }
    }

    void loadCategories()

    return () => {
      isMounted = false
    }
  }, [])

  useEffect(() => {
    if (!formFeedback) {
      return
    }

    const timeoutId = window.setTimeout(() => setFormFeedback(null), 5000)
    return () => window.clearTimeout(timeoutId)
  }, [formFeedback])

  const filters = useMemo(() => {
    const filter: WantedListingsFilters = {
      searchTerm,
      category: selectedCategory,
    }

    if (statusFilter && statusFilter !== 'all') {
      filter.status = statusFilter
    }

    const min = parsePriceInput(minPrice)
    if (min !== null) {
      filter.minPrice = min
    }

    const max = parsePriceInput(maxPrice)
    if (max !== null) {
      filter.maxPrice = max
    }

    return filter
  }, [maxPrice, minPrice, searchTerm, selectedCategory, statusFilter])

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
    setMinPrice('')
    setMaxPrice('')
  }

  const handleSubmitOffer = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!token) {
      navigate('/auth', {
        state: {
          from: '/wanted',
          message: 'Please sign in to post a room offer.',
        },
      })
      return
    }

    setFormIsSubmitting(true)
    setFormFeedback(null)

    try {
      const expiresAt = new Date(offerExpiry)

      await createWantedListing({
        title: offerTitle,
        details: offerDetails || undefined,
        monthlyPrice: offerPrice,
        address: offerAddress,
        contactInfo: offerContact,
        expiresAt: expiresAt.toISOString(),
      })

      setFormFeedback({ type: 'success', message: 'Room offer posted. We added it to the list below.' })
      setOfferTitle('')
      setOfferDetails('')
      setOfferPrice('')
      setOfferAddress('')
      setOfferContact('')
      setOfferExpiry('')
      await refetch()
    } catch (caughtError) {
      const normalizedError =
        caughtError instanceof Error
          ? caughtError.message
          : 'Unable to save your room offer. Please try again later.'
      setFormFeedback({ type: 'error', message: normalizedError })
    } finally {
      setFormIsSubmitting(false)
    }
  }

  const headerMessage = isLoading
    ? 'Fetching active room offers...'
    : isError
      ? 'We were unable to load room offers. Please try again.'
      : total === 0
        ? 'No room offers match your filters yet.'
        : `${total} offer${total === 1 ? '' : 's'} available right now.`

  const today = new Date().toISOString().split('T')[0]

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-10 px-4 py-12 lg:px-8">
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-indigo-600 to-primary text-white shadow-xl">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.18),_transparent_65%)]" aria-hidden="true" />
        <div className="relative grid gap-6 p-10 sm:p-12 md:grid-cols-[1.1fr_0.9fr] md:items-center">
          <div className="space-y-5">
            <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em]">
              Room Offers
            </span>
            <h1 className="text-3xl font-semibold leading-tight sm:text-4xl md:text-5xl">
              Share open rooms with the Olymarket community
            </h1>
            <p className="max-w-xl text-base text-white/90 sm:text-lg">
              Post your room availability with pricing, address details, and direct contact info so residents can reach you
              quickly.
            </p>
            <div className="flex flex-wrap items-center gap-3 text-sm text-white/90">
              <span>• Highlight availability windows</span>
              <span>• Keep pricing transparent</span>
              <span>• Connect directly with members</span>
            </div>
          </div>
          <div className="hidden md:block">
            <div className="rounded-2xl bg-white/10 p-6 shadow-inner backdrop-blur">
              <ul className="space-y-3 text-sm text-white/90">
                <li className="flex items-start gap-3">
                  <span className="mt-1 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white/20 text-xs font-semibold">
                    1
                  </span>
                  Add your room details, contact info, and the last day the offer is available.
                </li>
                <li className="flex items-start gap-3">
                  <span className="mt-1 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white/20 text-xs font-semibold">
                    2
                  </span>
                  Residents can reach out directly using your preferred contact method.
                </li>
                <li className="flex items-start gap-3">
                  <span className="mt-1 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white/20 text-xs font-semibold">
                    3
                  </span>
                  Update or close the offer anytime from your profile if it fills.
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800 shadow-sm">
        <strong className="font-semibold">Please note:</strong> Olymarket facilitates the exchange, but STWM has the final say on
        whether the subcontract of the room is valid.
      </div>

      <div className="grid gap-8 lg:grid-cols-[300px_1fr] lg:items-start">
        <div className="space-y-6">
          <section className="space-y-4 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Post a room offer</p>
                <h2 className="text-lg font-semibold text-slate-900">Share availability</h2>
              </div>
              {!token ? <span className="text-xs text-slate-500">Sign in to post</span> : null}
            </div>

            <form className="space-y-4" onSubmit={handleSubmitOffer}>
              <label className="flex flex-col gap-2 text-sm">
                <span className="font-semibold text-slate-700">Title</span>
                <input
                  value={offerTitle}
                  onChange={(event) => setOfferTitle(event.target.value)}
                  required
                  placeholder="Cozy room near campus"
                  className="rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
              </label>

              <div className="grid gap-3 sm:grid-cols-2">
                <label className="flex flex-col gap-2 text-sm">
                  <span className="font-semibold text-slate-700">Monthly price</span>
                  <input
                    type="number"
                    min={0}
                    step="0.01"
                    value={offerPrice}
                    onChange={(event) => setOfferPrice(event.target.value)}
                    required
                    placeholder="550"
                    className="rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                  />
                </label>

                <label className="flex flex-col gap-2 text-sm">
                  <span className="font-semibold text-slate-700">Offer valid until</span>
                  <input
                    type="date"
                    min={today}
                    value={offerExpiry}
                    onChange={(event) => setOfferExpiry(event.target.value)}
                    required
                    className="rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                  />
                </label>
              </div>

              <label className="flex flex-col gap-2 text-sm">
                <span className="font-semibold text-slate-700">Address</span>
                <input
                  value={offerAddress}
                  onChange={(event) => setOfferAddress(event.target.value)}
                  required
                  placeholder="123 Market St, Olympia"
                  className="rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
              </label>

              <label className="flex flex-col gap-2 text-sm">
                <span className="font-semibold text-slate-700">Contact info</span>
                <input
                  value={offerContact}
                  onChange={(event) => setOfferContact(event.target.value)}
                  required
                  placeholder="Email, phone, or messaging handle"
                  className="rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
              </label>

              <label className="flex flex-col gap-2 text-sm">
                <span className="font-semibold text-slate-700">Description</span>
                <textarea
                  value={offerDetails}
                  onChange={(event) => setOfferDetails(event.target.value)}
                  rows={3}
                  placeholder="Share move-in dates, utilities, house rules, and anything else residents should know."
                  className="rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
              </label>

              {formFeedback ? (
                <p className={formFeedback.type === 'success' ? 'text-sm text-emerald-600' : 'text-sm text-red-600'}>
                  {formFeedback.message}
                </p>
              ) : null}

              <button
                type="submit"
                disabled={formIsSubmitting}
                className="btn-primary inline-flex w-full items-center justify-center rounded-full px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary/60 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {formIsSubmitting ? 'Posting...' : 'Publish offer'}
              </button>
            </form>
          </section>

          <WantedBoardFilters
            searchTerm={searchTerm}
            onSearchTermChange={setSearchTerm}
            categoryOptions={categories}
            selectedCategory={selectedCategory}
            onCategoryChange={setSelectedCategory}
            status={statusFilter}
            onStatusChange={setStatusFilter}
            minPrice={minPrice}
            maxPrice={maxPrice}
            onMinPriceChange={setMinPrice}
            onMaxPriceChange={setMaxPrice}
            onReset={handleResetFilters}
          />
        </div>

        <section className="space-y-6">
          <header className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-2xl font-semibold text-slate-900">Available room offers</h2>
              <p className="text-sm text-slate-500">{headerMessage}</p>
            </div>
          </header>

          {isError ? (
            <div className="card flex flex-col gap-4 p-8">
              <div className="flex items-center gap-3 text-slate-900">
                <span className="text-2xl">⚠️</span>
                <div>
                  <h3 className="text-lg font-semibold">We couldn't load room offers</h3>
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
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 text-3xl">🏠</div>
              <div className="space-y-2">
                <h3 className="text-xl font-semibold text-slate-900">No room offers fit your filters yet</h3>
                <p className="text-sm text-slate-600">
                  Try adjusting your filters or check back soon—new offers arrive throughout the day.
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
                <RoomOfferCard key={request.id} offer={request} isCurrentUser={user?.id === request.buyer.id} />
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
                {isFetchingMore ? 'Loading more offers…' : 'Load more offers'}
              </button>
            </div>
          ) : null}
        </section>
      </div>
    </div>
  )
}

export default WantedBoard
