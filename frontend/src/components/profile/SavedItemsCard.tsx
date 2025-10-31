import { useCallback, useState } from 'react'
import type { ProfileSavedItemSummary } from '../../types/profile'

type SavedItemState = {
  isRemoving: boolean
  error: string | null
}

type SavedItemsCardProps = {
  items: ProfileSavedItemSummary[]
  isLoading?: boolean
  onRemove?: (id: string) => Promise<void>
}

const SavedItemsCard = ({ items, isLoading = false, onRemove }: SavedItemsCardProps) => {
  const [isOpen, setIsOpen] = useState(true)
  const [itemStates, setItemStates] = useState<Record<string, SavedItemState>>({})

  const toggleVisibility = () => {
    setIsOpen((current) => !current)
  }

  const handleRemove = useCallback(
    async (id: string) => {
      if (!onRemove) {
        return
      }

      setItemStates((current) => ({
        ...current,
        [id]: { isRemoving: true, error: null },
      }))

      try {
        await onRemove(id)

        setItemStates((current) => {
          const next = { ...current }
          delete next[id]
          return next
        })
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : 'We could not remove this saved item. Please try again.'

        setItemStates((current) => ({
          ...current,
          [id]: {
            isRemoving: false,
            error: message,
          },
        }))
      }
    },
    [onRemove],
  )

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
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-base font-semibold text-slate-900">{item.title}</h3>
                  <p className="text-xs uppercase tracking-wide text-slate-500">{item.category}</p>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      void handleRemove(item.id)
                    }}
                    className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600 transition hover:border-slate-300 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                    disabled={itemStates[item.id]?.isRemoving || !onRemove}
                    aria-disabled={itemStates[item.id]?.isRemoving || !onRemove}
                    aria-busy={itemStates[item.id]?.isRemoving || undefined}
                  >
                    {itemStates[item.id]?.isRemoving ? (
                      <>
                        <svg
                          className="h-4 w-4 animate-spin text-slate-500"
                          viewBox="0 0 24 24"
                          fill="none"
                          aria-hidden="true"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          />
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                          />
                        </svg>
                        <span>Removing…</span>
                      </>
                    ) : (
                      <span>Remove</span>
                    )}
                  </button>
                </div>
              </div>
              <div>
                <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
                  <span className="font-semibold text-primary">
                    {item.currency}
                    {item.price.toLocaleString()}
                  </span>
                  <span className="text-xs text-slate-500">Saved {item.favoritedAt}</span>
                </div>
              </div>
              {itemStates[item.id]?.error ? (
                <p className="text-xs text-red-600" role="alert" aria-live="polite">
                  {itemStates[item.id]?.error}
                </p>
              ) : null}
            </article>
          ))}
        </div>
      )}
    </section>
  )
}

export default SavedItemsCard
