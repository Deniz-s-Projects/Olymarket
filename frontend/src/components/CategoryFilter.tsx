import type { FC } from 'react'

export type CategoryOption = {
  label: string
  value: string
}

type CategoryFilterProps = {
  options: CategoryOption[]
  selected: string | null
  onSelect: (category: string | null) => void
  isLoading?: boolean
  errorMessage?: string | null
}

const CategoryFilter: FC<CategoryFilterProps> = ({ options, selected, onSelect, isLoading = false, errorMessage }) => {
  return (
    <div className="space-y-3">
      <div>
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Category</h2>
        <p className="text-sm text-slate-500">Refine the listings by area of interest.</p>
      </div>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => onSelect(null)}
          className={`filter-pill ${selected === null ? 'filter-pill-active' : ''}`}
        >
          All
        </button>
        {isLoading && options.length === 0 ? (
          <span className="text-sm text-slate-500">Loading categories...</span>
        ) : null}
        {options.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => onSelect(option.value)}
            className={`filter-pill ${selected === option.value ? 'filter-pill-active' : ''}`}
          >
            {option.label}
          </button>
        ))}
      </div>
      {errorMessage ? <p className="text-xs text-red-600">{errorMessage}</p> : null}
    </div>
  )
}

export default CategoryFilter
