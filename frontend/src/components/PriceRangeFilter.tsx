import type { FC } from 'react'

export type PriceRangeOption = {
  id: string
  label: string
  min: number
  max?: number
}

type PriceRangeFilterProps = {
  options: PriceRangeOption[]
  selectedId: string
  onSelect: (option: PriceRangeOption) => void
}

const PriceRangeFilter: FC<PriceRangeFilterProps> = ({ options, selectedId, onSelect }) => {
  return (
    <div className="space-y-3">
      <div>
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Budget</h2>
        <p className="text-sm text-slate-500">Pick a price range that fits your plans.</p>
      </div>
      <div className="grid gap-2">
        {options.map((option) => {
          const isActive = option.id === selectedId

          return (
            <button
              key={option.id}
              type="button"
              onClick={() => onSelect(option)}
              className={`filter-tile ${isActive ? 'filter-tile-active' : ''}`}
            >
              {option.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}

export default PriceRangeFilter
