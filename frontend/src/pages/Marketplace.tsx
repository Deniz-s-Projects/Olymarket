import { useEffect, useMemo, useState } from 'react'

import CategoryFilter from '../components/CategoryFilter'
import ListingCard, { type Listing } from '../components/ListingCard'
import PriceRangeFilter, { type PriceRangeOption } from '../components/PriceRangeFilter'

const priceRangeOptions: PriceRangeOption[] = [
  { id: 'all', label: 'Any budget', min: 0 },
  { id: 'under-50', label: 'Under $50', min: 0, max: 50 },
  { id: '50-150', label: '$50 – $150', min: 50, max: 150 },
  { id: '150-plus', label: '$150 and up', min: 150 },
]

const mockedListings: Listing[] = [
  {
    id: '1',
    title: 'Opening Ceremony Tickets',
    description:
      'Secure seats for the spectacular opening ceremony with a panoramic view of the stadium and live performances.',
    price: 320,
    category: 'Tickets',
    location: 'Paris, France',
    imageUrl: 'https://images.unsplash.com/photo-1542337585-4abf19f93674?auto=format&fit=crop&w=800&q=80',
    postedAt: '3 days ago',
  },
  {
    id: '2',
    title: 'Athlete Village Studio',
    description:
      'Modern studio located five minutes from the Olympic Village with flexible booking options for teams or solo travelers.',
    price: 140,
    category: 'Accommodation',
    location: 'Saint-Denis, France',
    imageUrl: 'https://images.unsplash.com/photo-1505691723518-36a5ac3be353?auto=format&fit=crop&w=800&q=80',
    postedAt: '2 days ago',
  },
  {
    id: '3',
    title: 'Guided Seine River Cruise',
    description:
      'Evening cruise tailored for Olympic visitors featuring iconic landmarks, music, and refreshments on board.',
    price: 65,
    category: 'Experiences',
    location: 'Paris, France',
    imageUrl: 'https://images.unsplash.com/photo-1522096823084-2d1aa1c4fbd0?auto=format&fit=crop&w=800&q=80',
    postedAt: '5 hours ago',
  },
  {
    id: '4',
    title: 'Team Logistics Coordinator',
    description:
      'On-the-ground specialist to support transport, scheduling, and venue access throughout the competition week.',
    price: 480,
    category: 'Services',
    location: 'Paris, France',
    imageUrl: 'https://images.unsplash.com/photo-1505843513577-22bb7d21e455?auto=format&fit=crop&w=800&q=80',
    postedAt: '1 day ago',
  },
  {
    id: '5',
    title: 'Training Facility Rental',
    description:
      'Reserve a private indoor training facility complete with physio room, recovery stations, and secure storage.',
    price: 260,
    category: 'Facilities',
    location: 'Aubervilliers, France',
    imageUrl: 'https://images.unsplash.com/photo-1517649763962-0c623066013b?auto=format&fit=crop&w=800&q=80',
    postedAt: '6 hours ago',
  },
  {
    id: '6',
    title: 'Local Guide Day Pass',
    description:
      'Hire a multilingual guide to navigate venues, cultural highlights, and fan zones with tailored itineraries.',
    price: 95,
    category: 'Services',
    location: 'Paris, France',
    imageUrl: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=800&q=80',
    postedAt: '8 hours ago',
  },
]

const Marketplace = () => {
  const [isLoading, setIsLoading] = useState(true)
  const [listings, setListings] = useState<Listing[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [selectedPriceRangeId, setSelectedPriceRangeId] = useState<string>('all')

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setListings(mockedListings)
      setIsLoading(false)
    }, 600)

    return () => window.clearTimeout(timeoutId)
  }, [])

  const categories = useMemo(
    () => Array.from(new Set(listings.map((listing) => listing.category))).sort(),
    [listings],
  )

  const selectedPriceRange = useMemo(
    () => priceRangeOptions.find((option) => option.id === selectedPriceRangeId) ?? priceRangeOptions[0],
    [selectedPriceRangeId],
  )

  const filteredListings = useMemo(() => {
    const searchValue = searchTerm.trim().toLowerCase()

    return listings.filter((listing) => {
      const matchesSearch =
        searchValue.length === 0 ||
        listing.title.toLowerCase().includes(searchValue) ||
        listing.description.toLowerCase().includes(searchValue) ||
        listing.location.toLowerCase().includes(searchValue)

      const matchesCategory = !selectedCategory || listing.category === selectedCategory

      const maxPrice = selectedPriceRange.max ?? Number.POSITIVE_INFINITY
      const matchesPrice = listing.price >= selectedPriceRange.min && listing.price <= maxPrice

      return matchesSearch && matchesCategory && matchesPrice
    })
  }, [listings, searchTerm, selectedCategory, selectedPriceRange])

  const showEmptyState = !isLoading && filteredListings.length === 0

  const handleResetFilters = () => {
    setSearchTerm('')
    setSelectedCategory(null)
    setSelectedPriceRangeId('all')
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
            <CategoryFilter categories={categories} selected={selectedCategory} onSelect={setSelectedCategory} />
            <PriceRangeFilter
              options={priceRangeOptions}
              selectedId={selectedPriceRange.id}
              onSelect={(option) => setSelectedPriceRangeId(option.id)}
            />
          </div>
        </aside>

        <section className="space-y-6">
          <header className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-2xl font-semibold text-slate-900">Featured listings</h2>
              <p className="text-sm text-slate-500">
                {isLoading
                  ? 'Fetching the latest marketplace updates...'
                  : `${filteredListings.length} result${filteredListings.length === 1 ? '' : 's'} ready for review.`}
              </p>
            </div>
            <button
              type="button"
              className="inline-flex items-center rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-slate-600 transition hover:border-primary hover:text-primary"
            >
              Save this search
            </button>
          </header>

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

          {!isLoading && !showEmptyState && (
            <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
              {filteredListings.map((listing) => (
                <ListingCard key={listing.id} listing={listing} />
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  )
}

export default Marketplace
