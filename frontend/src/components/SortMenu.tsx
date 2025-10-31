import { SORT_OPTIONS, getSortOptionId, type SortBy, type SortOrder } from './sortOptions'

type SortMenuProps = {
  sortBy: SortBy
  sortOrder: SortOrder
  onChange: (value: { sortBy: SortBy; sortOrder: SortOrder }) => void
  className?: string
}

const SortMenu = ({ sortBy, sortOrder, onChange, className = '' }: SortMenuProps) => {
  const selectedId = getSortOptionId(sortBy, sortOrder)

  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Sort</span>
      <div className="hidden gap-2 sm:flex">
        {SORT_OPTIONS.map((option) => {
          const isActive = option.id === selectedId
          return (
            <button
              type="button"
              key={option.id}
              aria-pressed={isActive}
              onClick={() => onChange({ sortBy: option.sortBy, sortOrder: option.sortOrder })}
              className={`rounded-full border px-3 py-1.5 text-sm font-medium transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary/60 ${
                isActive
                  ? 'border-primary bg-primary text-white shadow-sm'
                  : 'border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50'
              }`}
            >
              {option.label}
            </button>
          )
        })}
      </div>
      <label className="sm:hidden">
        <span className="sr-only">Sort listings</span>
        <select
          value={selectedId}
          onChange={(event) => {
            const option = SORT_OPTIONS.find((candidate) => candidate.id === event.target.value)
            if (option) {
              onChange({ sortBy: option.sortBy, sortOrder: option.sortOrder })
            }
          }}
          className="w-full rounded-full border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
        >
          {SORT_OPTIONS.map((option) => (
            <option key={option.id} value={option.id}>
              {option.label}
            </option>
          ))}
        </select>
      </label>
    </div>
  )
}

export default SortMenu
