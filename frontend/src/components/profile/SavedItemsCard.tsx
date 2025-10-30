import { useState } from 'react'
import type { ProfileSavedItemSummary } from '../../types/profile'

type SavedItemsCardProps = {
  items: ProfileSavedItemSummary[]
  isLoading?: boolean
}

const SavedItemsCard = ({ items, isLoading = false }: SavedItemsCardProps) => {
  const [isOpen, setIsOpen] = useState(true)

  const toggleVisibility = () => {
    setIsOpen((current) => !current)
  }

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <header className="flex items-center justify-between gap-2">
        <h2 className="text-lg font-semibold text-slate-900">Saved &amp; Favorited</h2>
        <button
          type="button"
          className="inline-flex items-center gap-2 text-sm font-medium text-primary md:hidden"
          onClick={toggleVisibility}
          aria-expanded={isOpen}
        >
          {isOpen ? 'Hide' : 'Show'}
          <span aria-hidden="true">▾</span>
        </button>
      </header>
      {isLoading && items.length === 0 ? (
        <p className={`${isOpen ? 'mt-4' : 'hidden'} text-sm text-slate-500 md:mt-4 md:block`}>
          Loading your saved items…
        </p>
      ) : items.length === 0 ? (
        <p className={`${isOpen ? 'mt-4' : 'hidden'} text-sm text-slate-500 md:mt-4 md:block`}>
          You have not saved any listings yet.
        </p>
      ) : (
        <div className={`${isOpen ? 'mt-4 grid gap-4 sm:grid-cols-2' : 'hidden'} md:mt-4 md:grid`}>
          {items.map((item) => (
            <article
              key={item.id}
              className="flex flex-col gap-3 rounded-xl border border-slate-100 bg-slate-50 p-4 shadow-sm"
            >
              <div>
                <h3 className="text-base font-semibold text-slate-900">{item.title}</h3>
                <p className="text-xs uppercase tracking-wide text-slate-500">{item.category}</p>
              </div>
              <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
                <span className="font-semibold text-primary">
                  {item.currency}
                  {item.price.toLocaleString()}
                </span>
                <span className="text-xs text-slate-500">Saved {item.favoritedAt}</span>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  )
}

export default SavedItemsCard
