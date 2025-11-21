import { type WantedListingStatus } from '../services/wantedListings'

type WantedBoardFiltersProps = {
  searchTerm: string
  onSearchTermChange: (value: string) => void
  categoryOptions: string[]
  selectedCategory: string | null
  onCategoryChange: (value: string | null) => void
  status: WantedListingStatus | 'all'
  onStatusChange: (value: WantedListingStatus | 'all') => void
  minPrice: string
  maxPrice: string
  onMinPriceChange: (value: string) => void
  onMaxPriceChange: (value: string) => void
  onReset: () => void
}

const statusOptions: Array<{ value: WantedListingStatus | 'all'; label: string }> = [
  { value: 'all', label: 'All statuses' },
  { value: 'open', label: 'Open' },
  { value: 'matched', label: 'Matched' },
  { value: 'fulfilled', label: 'Fulfilled' },
  { value: 'cancelled', label: 'Cancelled' },
]

const WantedBoardFilters = ({
  searchTerm,
  onSearchTermChange,
  categoryOptions,
  selectedCategory,
  onCategoryChange,
  status,
  onStatusChange,
  minPrice,
  maxPrice,
  onMinPriceChange,
  onMaxPriceChange,
  onReset,
}: WantedBoardFiltersProps) => {
  return (
    <aside className="space-y-6 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-100">
      <div className="space-y-3">
        <label className="flex flex-col gap-2">
          <span className="text-sm font-semibold uppercase tracking-wide text-slate-500">Search offers</span>
          <div className="relative">
            <span className="pointer-events-none absolute left-3 top-2.5 text-slate-400">🔎</span>
            <input
              type="search"
              value={searchTerm}
              onChange={(event) => onSearchTermChange(event.target.value)}
              placeholder="Find rooms by location, price, or host"
              className="w-full rounded-full border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm text-slate-700 shadow-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
          </div>
        </label>
        <button
          type="button"
          onClick={onReset}
          className="text-sm font-semibold text-primary transition hover:text-primary-accent"
        >
          Reset filters
        </button>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Status</h3>
          <div className="rounded-xl border border-slate-200">
            <select
              value={status}
              onChange={(event) => onStatusChange(event.target.value as WantedListingStatus | 'all')}
              className="w-full rounded-xl border-0 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:ring-2 focus:ring-primary/20"
            >
              {statusOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="space-y-2">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Category</h3>
          <div className="rounded-xl border border-slate-200">
            <select
              value={selectedCategory ?? ''}
              onChange={(event) => {
                const value = event.target.value
                onCategoryChange(value.length > 0 ? value : null)
              }}
              className="w-full rounded-xl border-0 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:ring-2 focus:ring-primary/20"
            >
              <option value="">All categories</option>
              {categoryOptions.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="space-y-2">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Monthly price range</h3>
          <div className="grid grid-cols-2 gap-3">
            <label className="flex flex-col gap-1 text-xs font-semibold text-slate-500">
              Minimum
              <input
                type="number"
                min={0}
                step={1}
                value={minPrice}
                onChange={(event) => onMinPriceChange(event.target.value)}
                className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </label>
            <label className="flex flex-col gap-1 text-xs font-semibold text-slate-500">
              Maximum
              <input
                type="number"
                min={0}
                step={1}
                value={maxPrice}
                onChange={(event) => onMaxPriceChange(event.target.value)}
                className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </label>
          </div>
        </div>
      </div>
    </aside>
  )
}

export default WantedBoardFilters
