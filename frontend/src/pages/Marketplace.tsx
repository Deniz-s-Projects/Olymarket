import { useEffect, useMemo, useState } from 'react'

import CategoryFilter from '../components/CategoryFilter'
import ListingCard from '../components/ListingCard'
import PriceRangeFilter, { type PriceRangeOption } from '../components/PriceRangeFilter'
import { useListings, type ListingsFilters } from '../hooks/useListings'
import { fetchListingCategories } from '../services/listings'

const priceRangeOptions: PriceRangeOption[] = [
  { id: 'all', label: 'Any budget', min: 0 },
  { id: 'under-50', label: 'Under $50', min: 0, max: 50 },
  { id: '50-150', label: '$50 – $150', min: 50, max: 150 },
  { id: '150-plus', label: '$150 and up', min: 150 },
]

const Marketplace = () => {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [selectedPriceRangeId, setSelectedPriceRangeId] = useState<string>(priceRangeOptions[0].id)
  const [showFreeOnly, setShowFreeOnly] = useState(false)
  const [availableCategories, setAvailableCategories] = useState<string[]>([])

  useEffect(() => {
    let isMounted = true

    const loadCategories = async () => {
      try {
        const categories = await fetchListingCategories()
        if (!isMounted) return
        const categoryNames = categories
          .map((category) => category.name?.trim())
          .filter((name): name is string => Boolean(name && name.length > 0))
        const uniqueNames = Array.from(new Set(categoryNames)).sort((a, b) => a.localeCompare(b))
        setAvailableCategories(uniqueNames)
      } catch (caughtError) {
        console.error('Unable to load listing categories', caughtError)
      }
    }

    void loadCategories()

    return () => {
      isMounted = false
    }
  }, [])

  const selectedPriceRange = useMemo(
    () => priceRangeOptions.find((option) => option.id === selectedPriceRangeId) ?? priceRangeOptions[0],
    [selectedPriceRangeId],
  )

  const listingsFilters = useMemo<ListingsFilters>(() => {
    const filters: ListingsFilters = {
      searchTerm,
      category: selectedCategory,
    }

    if (showFreeOnly) {
      filters.isFree = true
    }

    if (selectedPriceRangeId !== priceRangeOptions[0].id) {
      if (typeof selectedPriceRange.min === 'number' && Number.isFinite(selectedPriceRange.min)) {
        filters.minPrice = selectedPriceRange.min
      }
      if (typeof selectedPriceRange.max === 'number' && Number.isFinite(selectedPriceRange.max)) {
        filters.maxPrice = selectedPriceRange.max
      }
    }

    return filters
  }, [searchTerm, selectedCategory, selectedPriceRange, selectedPriceRangeId, showFreeOnly])

  const { listings, isLoading, isFetchingMore, isError, error, refetch, fetchNextPage, hasMore, total } =
    useListings(listingsFilters)

  const fallbackCategories = useMemo(() => {
    const names = listings
      .map((listing) => listing.category?.name?.trim())
      .filter((name): name is string => Boolean(name && name.length > 0))

    return Array.from(new Set(names)).sort((a, b) => a.localeCompare(b))
  }, [listings])

  const categories = availableCategories.length > 0 ? availableCategories : fallbackCategories

  const showEmptyState = !isLoading && !isError && listings.length === 0

  const handleResetFilters = () => {
    setSearchTerm('')
    setSelectedCategory(null)
    setSelectedPriceRangeId(priceRangeOptions[0].id)
    setShowFreeOnly(false)
  }

  const headerMessage = isLoading
    ? 'Fetching the latest marketplace updates...'
    : isError
      ? 'We were unable to load listings. Please try again.'
      : total === 0
        ? 'No listings match your filters yet.'
        : `${total} result${total === 1 ? '' : 's'} ready for review.`

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-10 px-4 py-12 lg:px-8">
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-primary to-primary-accent text-white shadow-xl">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.2),_transparent_60%)]" aria-hidden="true" />
        <div className="relative grid gap-6 p-10 sm:p-12 md:grid-cols-[1.1fr_0.9fr] md:items-center">
          <div className="space-y-5">
            <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em]">
              Olymarket Marketplace
            </span>
            <h1 className="text-3xl font-semibold leading-tight sm:text-4xl md:text-5xl">
              Discover experiences crafted for the Olympic community
            </h1>
            <p className="max-w-xl text-base text-white/90 sm:text-lg">
              Browse curated listings from trusted hosts, service providers, and local experts ready to elevate every
              moment of the Games.
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                className="btn-primary inline-flex items-center justify-center rounded-full px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-black/20 transition hover:-translate-y-0.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white/70"
              >
                Explore listings
              </button>
              <button
                type="button"
                className="inline-flex items-center justify-center rounded-full border border-white/40 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white/70"
              >
                Become a partner
              </button>
            </div>
          </div>
          <div className="hidden md:block">
            <div className="rounded-2xl bg-white/10 p-5 shadow-inner backdrop-blur">
              <ul className="space-y-3 text-sm text-white/90">
                <li className="flex items-start gap-3">
                  <span className="mt-1 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white/20 text-xs font-semibold">
                    1
                  </span>
                  Hand-picked listings to inspire your Olympic journey.
                </li>
                <li className="flex items-start gap-3">
                  <span className="mt-1 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white/20 text-xs font-semibold">
                    2
                  </span>
                  Flexible booking and service options designed for teams and fans alike.
                </li>
                <li className="flex items-start gap-3">
                  <span className="mt-1 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white/20 text-xs font-semibold">
                    3
                  </span>
                  Collaborate with vetted partners and locals who know the city best.
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      <div className="grid gap-8 lg:grid-cols-[260px_1fr] lg:items-start">
        <aside className="space-y-8">
          <div className="space-y-3 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-100">
            <label className="flex flex-col gap-2">
              <span className="text-sm font-semibold uppercase tracking-wide text-slate-500">Search</span>
              <div className="relative">
                <span className="pointer-events-none absolute left-3 top-2.5 text-slate-400">🔍</span>
                <input
                  type="search"
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  placeholder="Find tickets, stays, services..."
                  className="w-full rounded-full border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm text-slate-700 shadow-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
              </div>
            </label>
            <button
              type="button"
              onClick={handleResetFilters}
              className="text-sm font-semibold text-primary transition hover:text-primary-accent"
            >
              Reset filters
            </button>
          </div>

          <div className="space-y-6 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-100">
            <div className="space-y-3">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Free Items</h3>
              <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-slate-200 p-3 transition hover:border-green-300 hover:bg-green-50">
                <input
                  type="checkbox"
                  checked={showFreeOnly}
                  onChange={(event) => setShowFreeOnly(event.target.checked)}
                  className="h-5 w-5 rounded border-slate-300 text-green-600 focus:ring-2 focus:ring-green-500"
                />
                <div className="flex-1">
                  <span className="text-sm font-medium text-slate-700">Show free items only</span>
                  <p className="text-xs text-slate-500">Items being given away for free</p>
                </div>
              </label>
            </div>
            <CategoryFilter categories={categories} selected={selectedCategory} onSelect={setSelectedCategory} />
            <PriceRangeFilter
              options={priceRangeOptions}
              selectedId={selectedPriceRangeId}
              onSelect={(option) => setSelectedPriceRangeId(option.id)}
            />
          </div>
        </aside>

        <section className="space-y-6">
          <header className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-2xl font-semibold text-slate-900">Featured listings</h2>
              <p className="text-sm text-slate-500">{headerMessage}</p>
            </div>
            <button
              type="button"
              className="inline-flex items-center rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-slate-600 transition hover:border-primary hover:text-primary"
            >
              Save this search
            </button>
          </header>

          {isError && (
            <div className="card flex flex-col gap-4 p-8">
              <div className="flex items-center gap-3 text-slate-900">
                <span className="text-2xl">⚠️</span>
                <div>
                  <h3 className="text-lg font-semibold">We couldn't load the latest listings</h3>
                  <p className="text-sm text-slate-600">
                    {error?.message ?? 'Please refresh the page or try again in a moment.'}
                  </p>
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
          )}

          {isLoading && (
            <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: 6 }).map((_, index) => (
                <div key={index} className="card h-full animate-pulse overflow-hidden">
                  <div className="h-40 bg-slate-200" />
                  <div className="space-y-3 p-5">
                    <div className="h-4 w-1/2 rounded-full bg-slate-200" />
                    <div className="h-6 w-3/4 rounded-full bg-slate-200" />
                    <div className="h-4 w-full rounded-full bg-slate-200" />
                    <div className="h-4 w-5/6 rounded-full bg-slate-200" />
                    <div className="h-6 w-24 rounded-full bg-slate-200" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {showEmptyState && (
            <div className="card flex flex-col items-center gap-4 p-10 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 text-3xl">🕊️</div>
              <div className="space-y-2">
                <h3 className="text-xl font-semibold text-slate-900">No listings match your filters yet</h3>
                <p className="text-sm text-slate-600">
                  Try adjusting your filters or resetting them to explore the full selection of marketplace listings.
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
          )}

          {!isLoading && !isError && !showEmptyState && (
            <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
              {listings.map((listing) => (
                <ListingCard key={listing.id} listing={listing} />
              ))}
            </div>
          )}

          {!isLoading && !isError && hasMore && (
            <div className="flex justify-center pt-4">
              <button
                type="button"
                onClick={() => void fetchNextPage()}
                disabled={isFetchingMore}
                className="inline-flex items-center rounded-full border border-slate-200 px-5 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isFetchingMore ? 'Loading more listings…' : 'Load more listings'}
              </button>
            </div>
          )}
        </section>
      </div>
    </div>
  )
}

export default Marketplace
