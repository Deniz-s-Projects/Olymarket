import { useState } from 'react'

export type ProfileListingRow = {
  id: string
  title: string
  categoryLabel: string
  priceLabel: string
  statusLabel: string
  updatedAtLabel: string
}

type ListingTableProps = {
  listings: ProfileListingRow[]
  title: string
  emptyMessage?: string
}

const ListingTable = ({ listings, title, emptyMessage }: ListingTableProps) => {
  const [isOpen, setIsOpen] = useState(true)

  const toggleVisibility = () => {
    setIsOpen((current) => !current)
  }

  const containerClasses =
    'rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition'

  const contentWrapperClasses = `${isOpen ? 'mt-4 block' : 'hidden'} md:mt-4 md:block`

  return (
    <section className={containerClasses}>
      <header className="flex items-center justify-between gap-2">
        <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
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
      {listings.length === 0 ? (
        <p className={`${isOpen ? 'mt-4' : 'hidden'} text-sm text-slate-500 md:mt-4 md:block`}>
          {emptyMessage ?? 'No listings available yet.'}
        </p>
      ) : (
        <div className={contentWrapperClasses}>
          <div className="hidden overflow-x-auto md:block">
            <table className="min-w-full divide-y divide-slate-200">
              <thead>
                <tr className="text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  <th className="px-3 py-2">Listing</th>
                  <th className="px-3 py-2">Category</th>
                  <th className="px-3 py-2">Price</th>
                  <th className="px-3 py-2">Status</th>
                  <th className="px-3 py-2">Updated</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
                {listings.map((listing) => (
                  <tr key={listing.id} className="hover:bg-slate-50">
                    <td className="px-3 py-3 font-medium text-slate-900">{listing.title}</td>
                    <td className="px-3 py-3">{listing.categoryLabel}</td>
                    <td className="px-3 py-3 font-semibold text-slate-900">{listing.priceLabel}</td>
                    <td className="px-3 py-3 capitalize">{listing.statusLabel}</td>
                    <td className="px-3 py-3 text-slate-500">{listing.updatedAtLabel}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex flex-col gap-4 md:hidden">
            {listings.map((listing) => (
              <article
                key={listing.id}
                className="rounded-xl border border-slate-100 bg-slate-50 p-4 shadow-sm"
              >
                <header className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-base font-semibold text-slate-900">{listing.title}</h3>
                    <p className="text-xs uppercase tracking-wide text-slate-500">
                      {listing.categoryLabel}
                    </p>
                  </div>
                  <span className="text-sm font-semibold text-primary">
                    {listing.priceLabel}
                  </span>
                </header>
                <dl className="mt-3 grid grid-cols-2 gap-2 text-xs text-slate-600">
                  <div>
                    <dt className="font-semibold text-slate-500">Status</dt>
                    <dd className="capitalize text-slate-700">{listing.statusLabel}</dd>
                  </div>
                  <div>
                    <dt className="font-semibold text-slate-500">Updated</dt>
                    <dd>{listing.updatedAtLabel}</dd>
                  </div>
                </dl>
              </article>
            ))}
          </div>
        </div>
      )}
    </section>
  )
}

export default ListingTable
