import { useEffect, useMemo, useState } from 'react'

import ListingTable from './ListingTable'
import type {
  ProfileListingStatusGroup,
  ProfileListingsOverview,
} from '../../types/profile'

type ProfileListingsTabProps = {
  listings: ProfileListingsOverview
  isLoading?: boolean
}

type StatusFilterOption = {
  id: 'all' | ProfileListingStatusGroup['id']
  label: string
  count: number
}

const DEFAULT_CREATE_URL = '/listings/new'

const ProfileListingsTab = ({ listings, isLoading = false }: ProfileListingsTabProps) => {
  const groups = listings.groups ?? []
  const [activeFilter, setActiveFilter] = useState<StatusFilterOption['id']>('all')
  const createListingUrl = listings.createListingUrl ?? DEFAULT_CREATE_URL

  useEffect(() => {
    if (activeFilter === 'all') {
      return
    }

    const hasActiveFilter = groups.some((group) => group.id === activeFilter)

    if (!hasActiveFilter) {
      setActiveFilter(groups[0]?.id ?? 'all')
    }
  }, [activeFilter, groups])

  const totalListings = useMemo(
    () => groups.reduce((total, group) => total + group.listings.length, 0),
    [groups],
  )

  const filterOptions = useMemo<StatusFilterOption[]>(
    () => [
      { id: 'all', label: 'All', count: totalListings },
      ...groups.map((group) => ({ id: group.id, label: group.label, count: group.listings.length })),
    ],
    [groups, totalListings],
  )

  const filteredListings = useMemo(() => {
    if (activeFilter === 'all') {
      return groups.flatMap((group) => group.listings)
    }

    return groups.find((group) => group.id === activeFilter)?.listings ?? []
  }, [activeFilter, groups])

  const activeGroup = useMemo(() => {
    if (activeFilter === 'all') {
      return undefined
    }

    return groups.find((group) => group.id === activeFilter)
  }, [activeFilter, groups])

  const hasAnyListings = totalListings > 0
  const shouldShowTable = filteredListings.length > 0 || isLoading

  const emptyTitle = activeGroup?.emptyState?.title ?? (hasAnyListings ? 'No listings for this status' : 'No listings yet')
  const emptyDescription =
    activeGroup?.emptyState?.description ??
    (hasAnyListings
      ? 'You have no listings that match this status. Try selecting a different filter or creating a new listing.'
      : 'Create your first listing to start reaching buyers on Olymarket.')
  const emptyAction = activeGroup?.emptyState?.action

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Listings</h2>
          <p className="text-sm text-slate-600">
            {activeGroup?.description ?? 'Manage and organize all of your listings from a single place.'}
          </p>
        </div>
        <a
          href={createListingUrl}
          className="inline-flex items-center justify-center rounded-full bg-primary px-4 py-2 text-sm font-semibold text-white transition hover:bg-primary/90"
        >
          Create listing
        </a>
      </header>

      <div className="mt-6 flex flex-wrap items-center gap-2">
        {filterOptions.map((option) => {
          const isActive = option.id === activeFilter
          const baseClasses =
            'inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary'
          const activeClasses = 'border-transparent bg-primary text-white shadow-sm'
          const inactiveClasses = 'border-slate-200 text-slate-600 hover:border-primary/40 hover:text-slate-900'

          return (
            <button
              key={option.id}
              type="button"
              onClick={() => setActiveFilter(option.id)}
              className={`${baseClasses} ${isActive ? activeClasses : inactiveClasses}`}
            >
              <span>{option.label}</span>
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-600">
                {option.count}
              </span>
            </button>
          )
        })}
      </div>

      {shouldShowTable ? (
        <div className="mt-6">
          <ListingTable
            listings={filteredListings}
            title={activeFilter === 'all' ? 'All Listings' : `${activeGroup?.label ?? 'Listings'}`}
            emptyMessage={emptyDescription}
            isLoading={isLoading}
          />
        </div>
      ) : (
        <div className="mt-10 flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-slate-200 bg-slate-50 p-10 text-center">
          <h3 className="text-lg font-semibold text-slate-900">{emptyTitle}</h3>
          <p className="max-w-md text-sm text-slate-600">{emptyDescription}</p>
          <a
            href={emptyAction?.url ?? createListingUrl}
            className="inline-flex items-center justify-center rounded-full border border-primary px-4 py-2 text-sm font-semibold text-primary transition hover:bg-primary hover:text-white"
          >
            {emptyAction?.label ?? 'Create your first listing'}
          </a>
        </div>
      )}
    </section>
  )
}

export default ProfileListingsTab
