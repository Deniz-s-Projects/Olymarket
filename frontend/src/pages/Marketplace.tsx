import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'

import CategoryFilter from '../components/CategoryFilter'
import ListingCard from '../components/ListingCard'
import PriceRangeFilter, { type PriceRangeOption } from '../components/PriceRangeFilter'
import { getSortOptionSummary } from '../components/sortOptions'
import { useListings } from '../hooks/useListings'
import { type FC } from 'react'
import { fetchListingCategories, type ListingCategory } from '../services/listings'

const priceRangeOptions: PriceRangeOption[] = [
  { id: 'all', label: 'Any budget', min: 0 },
  { id: 'under-50', label: 'Under $50', min: 0, max: 50 },
  { id: '50-150', label: '$50 – $150', min: 50, max: 150 },
  { id: '150-plus', label: '$150 and up', min: 150 },
]

const parsePrice = (value: string) => {
  const numericValue = Number.parseFloat(value)
  return Number.isNaN(numericValue) ? null : numericValue
}

// Small inline sort button group for clearer options
type SortProps = {
  sortBy: 'createdAt' | 'price'
  sortOrder: 'asc' | 'desc'
  onChange: (next: { sortBy: SortProps['sortBy']; sortOrder: SortProps['sortOrder'] }) => void
  className?: string
}

const SortButtons: FC<SortProps> = ({ sortBy, sortOrder, onChange, className = '' }) => {
  const options: { id: string; label: string; sortBy: SortProps['sortBy']; sortOrder: SortProps['sortOrder'] }[] = [
    { id: 'newest', label: 'Newest first', sortBy: 'createdAt', sortOrder: 'desc' },
    { id: 'oldest', label: 'Oldest first', sortBy: 'createdAt', sortOrder: 'asc' },
    { id: 'low-high', label: 'Price: low → high', sortBy: 'price', sortOrder: 'asc' },
    { id: 'high-low', label: 'Price: high → low', sortBy: 'price', sortOrder: 'desc' },
  ]

  return (
    <div className={`inline-flex flex-wrap items-center gap-2 ${className}`}>
      {options.map((opt) => {
        const selected = opt.sortBy === sortBy && opt.sortOrder === sortOrder
        return (
          <button
            key={opt.id}
            type="button"
            onClick={() => onChange({ sortBy: opt.sortBy, sortOrder: opt.sortOrder })}
            className={`text-xs font-semibold rounded-full px-3 py-1 transition-border focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2
              ${selected ? 'bg-primary text-white shadow-sm' : 'border border-slate-200 bg-white text-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700'}
            `}
            aria-pressed={selected}
          >
            {opt.label}
          </button>
        )
      })}
    </div>
  )
}

const Marketplace = () => {
  const [sortBy, setSortBy] = useState<'createdAt' | 'price'>('createdAt')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [selectedCategorySlug, setSelectedCategorySlug] = useState<string | null>(null)
  const [fetchedCategories, setFetchedCategories] = useState<ListingCategory[]>([])
  const [isLoadingCategories, setIsLoadingCategories] = useState(false)
  const [categoryError, setCategoryError] = useState<Error | null>(null)

  const listingsParams = useMemo(
    () => ({
      sortBy,
      sortOrder,
      category: selectedCategorySlug,
    }),
    [selectedCategorySlug, sortBy, sortOrder],
  )

  const {
    listings,
    isLoading,
    isError,
    error,
    refetch,
    hasMore,
    isFetchingMore,
    fetchNextPage,
    total,
  } = useListings(listingsParams)

  const [searchTerm, setSearchTerm] = useState('')
  const [selectedPriceRangeId, setSelectedPriceRangeId] = useState<string>(priceRangeOptions[0].id)
  const [showFreeOnly, setShowFreeOnly] = useState(false)
  const listingsRef = useRef<HTMLElement | null>(null)

  useEffect(() => {
    let isMounted = true

    const loadCategories = async () => {
      setIsLoadingCategories(true)
      setCategoryError(null)

      try {
        const result = await fetchListingCategories()
        if (!isMounted) {
          return
        }

        const uniqueBySlug = new Map<string, ListingCategory>()
        result.forEach((category) => {
          const slug = category.slug?.trim()
          const name = category.name?.trim()
          if (!slug || !name) {
            return
          }
          uniqueBySlug.set(slug, { ...category, slug, name })
        })

        const sorted = Array.from(uniqueBySlug.values()).sort((a, b) => a.name.localeCompare(b.name))
        setFetchedCategories(sorted)
      } catch (caughtError) {
        if (!isMounted) {
          return
        }
        const normalizedError =
          caughtError instanceof Error
            ? caughtError
            : new Error('Something went wrong while loading listing categories.')
        setCategoryError(normalizedError)
      } finally {
        if (isMounted) {
          setIsLoadingCategories(false)
        }
      }
    }

    void loadCategories()

    return () => {
      isMounted = false
    }
  }, [])

  const fallbackCategories = useMemo(() => {
    const uniqueBySlug = new Map<string, ListingCategory>()
    listings.forEach((listing) => {
      const category = listing.category
      if (!category) {
        return
      }
      const slug = category.slug?.trim()
      const name = category.name?.trim()
      if (!slug || !name) {
        return
      }
      uniqueBySlug.set(slug, { ...category, slug, name })
    })

    return Array.from(uniqueBySlug.values()).sort((a, b) => a.name.localeCompare(b.name))
  }, [listings])

  const categoryOptions = useMemo(() => {
    const source = fetchedCategories.length > 0 ? fetchedCategories : fallbackCategories
    return source.map((category) => ({ label: category.name, value: category.slug }))
  }, [fallbackCategories, fetchedCategories])

  const selectedPriceRange = useMemo(
    () => priceRangeOptions.find((option) => option.id === selectedPriceRangeId) ?? priceRangeOptions[0],
    [selectedPriceRangeId],
  )

  const filteredListings = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase()
    const maxPrice = selectedPriceRange.max ?? Number.POSITIVE_INFINITY

    return listings.filter((listing) => {
      const priceValue = parsePrice(listing.price)
      if (showFreeOnly) {
        if (listing.isFree) return true
        if (priceValue !== null && priceValue === 0) return true
        return false
      }

      const matchesPrice =
        listing.isFree || priceValue === null ? true : priceValue >= selectedPriceRange.min && priceValue <= maxPrice

      const categoryName = listing.category?.name ?? ''
      const categorySlug = listing.category?.slug ?? ''
      const ownerName = listing.owner?.name ?? ''

      const matchesCategory = !selectedCategorySlug || categorySlug === selectedCategorySlug

      const matchesSearch =
        normalizedSearch.length === 0 ||
        [listing.title, listing.description, categoryName, ownerName]
          .map((value) => value.toLowerCase())
          .some((value) => value.includes(normalizedSearch))

      return matchesSearch && matchesCategory && matchesPrice
    })
  }, [listings, searchTerm, selectedCategorySlug, selectedPriceRange, showFreeOnly])

  const showEmptyState = !isLoading && !isError && filteredListings.length === 0

  const handleResetFilters = () => {
    setSearchTerm('')
    setSelectedCategorySlug(null)
    setSelectedPriceRangeId(priceRangeOptions[0].id)
    setShowFreeOnly(false)
    setSortBy('createdAt')
    setSortOrder('desc')
  }

  const selectedSortOption = useMemo(() => getSortOptionSummary(sortBy, sortOrder), [sortBy, sortOrder])

  const headerMessage = isLoading
    ? 'Fetching marketplace listings...'
    : isError
      ? 'We were unable to load listings. Please try again.'
      : `Showing ${filteredListings.length} of ${total} total result${total === 1 ? '' : 's'} ready for review, sorted by ${selectedSortOption.description}.`

  const handleSortChange = (next: { sortBy: typeof sortBy; sortOrder: typeof sortOrder }) => {
    setSortBy(next.sortBy)
    setSortOrder(next.sortOrder)
  }

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
              Free-of-charge Olydorf marketplace!
            </h1>
            <p className="max-w-xl text-base text-white/90 sm:text-lg">
              Browse curated listings from trusted hosts, service providers, and local residents.
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <a>
                <Link
                to="/listings/new"
                className="inline-flex items-center justify-center rounded-full border border-white/40 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white/70"
              >
                Create listing
              </Link>
              </a>
              <Link
                to="/auth"
                className="inline-flex items-center justify-center rounded-full border border-white/40 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white/70"
              >
                Sign up
              </Link>
            </div>
          </div>
          <div className="hidden md:block">
            <div className="rounded-2xl bg-white/10 p-5 shadow-inner backdrop-blur">
              <ul className="space-y-3 text-sm text-white/90">
                <li className="flex items-start gap-3">
                  <span className="mt-1 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white/20 text-xs font-semibold">
                    1
                  </span>
                  Hand-picked listings to buy or sell, or acquire/trade for free
                </li>
                <li className="flex items-start gap-3">
                  <span className="mt-1 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white/20 text-xs font-semibold">
                    2
                  </span>
                  Easy communication via messages, all hosted here in OlyDorf by Olynet!
                </li>
                <li className="flex items-start gap-3">
                  <span className="mt-1 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white/20 text-xs font-semibold">
                    3
                  </span>
                  No ads, No trackers, No third-party cookies. Provided to OlyDorf residents for free.
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      <div className="grid gap-8 lg:grid-cols-[260px_1fr] lg:items-start">
        <aside className="space-y-8">
          <div className="space-y-3 rounded-2xl bg-white dark:bg-slate-800 p-5 shadow-sm ring-1 ring-slate-100 dark:ring-slate-700">
            <label className="flex flex-col gap-2">
              <span className="text-sm font-semibold uppercase tracking-wide text-slate-500">Search</span>
              <div className="relative">
                <span className="pointer-events-none absolute left-3 top-2.5 text-slate-400">🔍</span>
                <input
                  type="search"
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  placeholder="Find tickets, stays, services..."
                  className="w-full rounded-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-700 py-2.5 pl-10 pr-4 text-sm text-slate-700 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-400 shadow-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
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

          <div className="space-y-6 rounded-2xl bg-white dark:bg-slate-800 p-5 shadow-sm ring-1 ring-slate-100 dark:ring-slate-700">
            <div className="space-y-3">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Free Items</h3>
              <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-slate-200 dark:border-slate-700 p-3 transition hover:border-green-300 dark:hover:border-green-400 hover:bg-green-50 dark:hover:bg-green-900">
                <input
                  type="checkbox"
                  checked={showFreeOnly}
                  onChange={(e) => setShowFreeOnly(e.target.checked)}
                  className="h-5 w-5 rounded border-slate-300 dark:border-slate-600 text-green-600 focus:ring-2 focus:ring-green-500"
                />
                <div className="flex-1">
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-100">Show free items only</span>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Items being given away for free</p>
                </div>
              </label>
            </div>
            <CategoryFilter
              options={categoryOptions}
              selected={selectedCategorySlug}
              onSelect={setSelectedCategorySlug}
              isLoading={isLoadingCategories}
              errorMessage={categoryError?.message ?? null}
            />
            <PriceRangeFilter
              options={priceRangeOptions}
              selectedId={selectedPriceRangeId}
              onSelect={(option) => setSelectedPriceRangeId(option.id)}
            />
            {/* Sort buttons placed under the budget picker */}
            <div className="mt-4">
              <SortButtons sortBy={sortBy} sortOrder={sortOrder} onChange={handleSortChange} className="w-full" />
            </div>
          </div>
        </aside>

        <section id="listings" ref={listingsRef} className="space-y-6">
          <header className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-2xl font-semibold text-slate-900">Featured listings</h2>
              <p className="text-sm text-slate-500">{headerMessage}</p>
            </div>
            <div className="flex flex-col items-stretch gap-2 lg:flex-row lg:items-center lg:gap-4">
              <button
                type="button"
                className="inline-flex items-center justify-center rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-slate-600 transition hover:border-primary hover:text-primary"
              >
                Save this search
              </button>
            </div>
          </header>

          {isError && (
            <div className="card flex flex-col gap-4 p-8">
              <div className="flex items-center gap-3 text-slate-900">
                <span className="text-2xl">⚠️</span>
                <div>
                  <h3 className="text-lg font-semibold">We couldn't load the marketplace listings</h3>
                  <p className="text-sm text-slate-600">
                    {error?.message ?? 'Please refresh the page or try again in a moment.'}
                  </p>
                </div>
              </div>
              <div>
                <button
                  type="button"
                  onClick={refetch}
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
            <>
              <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
                {filteredListings.map((listing) => (
                  <ListingCard key={listing.id} listing={listing} />
                ))}
              </div>
              {hasMore && (
                <div className="flex justify-center pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      void fetchNextPage()
                    }}
                    disabled={isFetchingMore}
                    className="btn-primary inline-flex items-center rounded-full px-6 py-2 text-sm font-semibold text-white shadow-sm transition disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isFetchingMore ? 'Loading more listings...' : 'Load more listings'}
                  </button>
                </div>
              )}
            </>
          )}
        </section>
      </div>
    </div>
  )
}

export default Marketplace
