import type { FC } from 'react'

type CategoryFilterProps = {
  categories: string[]
  selected: string | null
  onSelect: (category: string | null) => void
}

const CategoryFilter: FC<CategoryFilterProps> = ({ categories, selected, onSelect }) => {
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
        {categories.map((category) => (
          <button
            key={category}
            type="button"
            onClick={() => onSelect(category)}
            className={`filter-pill ${selected === category ? 'filter-pill-active' : ''}`}
          >
            {category}
          </button>
        ))}
      </div>
    </div>
  )
}

export default CategoryFilter
