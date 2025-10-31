import { useState } from 'react'
import { Link } from 'react-router-dom'
import type { ProfileListingStatus, ProfileListingWithActions } from '../../types/profile'

type ListingTableProps = {
  listings: ProfileListingWithActions[]
  title: string
  emptyMessage?: string
  isLoading?: boolean
  pendingListingId?: string | null
  onStatusChange?: (listingId: string, status: ProfileListingStatus) => Promise<void> | void
}

const ListingTable = ({
  listings,
  title,
  emptyMessage,
  isLoading = false,
  pendingListingId,
  onStatusChange,
}: ListingTableProps) => {
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
      {isLoading && listings.length === 0 ? (
        <p className={`${isOpen ? 'mt-4' : 'hidden'} text-sm text-slate-500 md:mt-4 md:block`}>
          Loading your listings…
        </p>
      ) : listings.length === 0 ? (
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
                  <th className="px-3 py-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
                {listings.map((listing) => (
                  <tr key={listing.id} className="hover:bg-slate-50">
                    <td className="px-3 py-3 font-medium text-slate-900">{listing.title}</td>
                    <td className="px-3 py-3">{listing.category}</td>
                    <td className="px-3 py-3 font-semibold text-slate-900">
                      {listing.currency}
                      {listing.price.toLocaleString()}
                    </td>
                    <td className="px-3 py-3 capitalize">{listing.status}</td>
                    <td className="px-3 py-3 text-slate-500">{listing.updatedAt}</td>
                    <td className="px-3 py-3">
                      <div className="flex flex-wrap items-center justify-end gap-2 text-sm">
                        <Link
                          to={listing.actions.editUrl}
                          className="inline-flex items-center justify-center rounded-full border border-slate-200 px-3 py-1 text-xs font-medium text-slate-600 transition hover:border-primary/40 hover:text-primary"
                        >
                          Edit
                        </Link>
                        {listing.actions.statusOptions?.map((option) => {
                          const isPending = pendingListingId === listing.id
                          const baseClasses =
                            'inline-flex items-center justify-center rounded-full border px-3 py-1 text-xs font-medium transition'
                          const variantClasses =
                            option.status === 'sold'
                              ? 'border-red-200 text-red-600 hover:border-red-300 hover:bg-red-50'
                              : option.status === 'active'
                              ? 'border-emerald-200 text-emerald-600 hover:border-emerald-300 hover:bg-emerald-50'
                              : 'border-slate-200 text-slate-600 hover:border-primary/40 hover:text-primary'

                          return (
                            <button
                              key={`${listing.id}-${option.status}`}
                              type="button"
                              disabled={isPending}
                              className={`${baseClasses} ${variantClasses} disabled:cursor-not-allowed disabled:opacity-60`}
                              onClick={() => {
                                if (onStatusChange) {
                                  void onStatusChange(listing.id, option.status)
                                }
                              }}
                            >
                              {isPending ? 'Updating…' : option.label}
                            </button>
                          )
                        })}
                      </div>
                    </td>
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
                      {listing.category}
                    </p>
                  </div>
                  <span className="text-sm font-semibold text-primary">
                    {listing.currency}
                    {listing.price.toLocaleString()}
                  </span>
                </header>
                <dl className="mt-3 grid grid-cols-2 gap-2 text-xs text-slate-600">
                  <div>
                    <dt className="font-semibold text-slate-500">Status</dt>
                    <dd className="capitalize text-slate-700">{listing.status}</dd>
                  </div>
                  <div>
                    <dt className="font-semibold text-slate-500">Updated</dt>
                    <dd>{listing.updatedAt}</dd>
                  </div>
                  {listing.availability ? (
                    <div className="col-span-2">
                      <dt className="font-semibold text-slate-500">Availability</dt>
                      <dd className="text-slate-700">{listing.availability}</dd>
                    </div>
                  ) : null}
                  {listing.preferredContactMethod ? (
                    <div className="col-span-2">
                      <dt className="font-semibold text-slate-500">Preferred contact</dt>
                      <dd className="text-slate-700">{listing.preferredContactMethod}</dd>
                    </div>
                  ) : null}
                </dl>
                <div className="mt-4 flex flex-wrap items-center gap-2 text-xs font-medium">
                  <Link
                    to={listing.actions.editUrl}
                    className="inline-flex items-center justify-center rounded-full border border-slate-200 px-3 py-1 text-slate-600 transition hover:border-primary/40 hover:text-primary"
                  >
                    Edit listing
                  </Link>
                  {listing.actions.statusOptions?.map((option) => {
                    const isPending = pendingListingId === listing.id
                    const baseClasses =
                      'inline-flex items-center justify-center rounded-full border px-3 py-1 transition'
                    const variantClasses =
                      option.status === 'sold'
                        ? 'border-red-200 text-red-600 hover:border-red-300 hover:bg-red-50'
                        : option.status === 'active'
                        ? 'border-emerald-200 text-emerald-600 hover:border-emerald-300 hover:bg-emerald-50'
                        : 'border-slate-200 text-slate-600 hover:border-primary/40 hover:text-primary'

                    return (
                      <button
                        key={`${listing.id}-${option.status}`}
                        type="button"
                        disabled={isPending}
                        className={`${baseClasses} ${variantClasses} disabled:cursor-not-allowed disabled:opacity-60`}
                        onClick={() => {
                          if (onStatusChange) {
                            void onStatusChange(listing.id, option.status)
                          }
                        }}
                      >
                        {isPending ? 'Updating…' : option.label}
                      </button>
                    )
                  })}
                </div>
              </article>
            ))}
          </div>
        </div>
      )}
    </section>
  )
}

export default ListingTable
