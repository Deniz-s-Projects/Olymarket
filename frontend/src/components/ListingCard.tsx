import type { FC } from 'react'
import { Link } from 'react-router-dom'

import type { Listing } from '../services/listings'
import { getListingPublicContactLabel } from '../utils/listingContact'
import { LISTING_CONDITION_CONFIG, DEFAULT_LISTING_CONDITION } from '../constants/listingConditions'

type ListingWithMedia = Listing & { imageUrl?: string | null }

const currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'EUR',
  maximumFractionDigits: 0,
})

const formatPrice = (price: string, isFree: boolean) => {
  if (isFree) {
    return 'FREE'
  }

  const numericValue = Number.parseFloat(price)
  if (Number.isNaN(numericValue)) {
    return price
  }

  return currencyFormatter.format(numericValue)
}

const formatDateLabel = (value: string) => {
  const parsed = new Date(value)

  if (Number.isNaN(parsed.getTime())) {
    return 'Just now'
  }

  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(parsed)
}

const getInitials = (title: string) => {
  const parts = title.trim().split(/\s+/)

  if (parts.length === 0) {
    return 'OLY'
  }

  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase()
  }

  return `${parts[0][0]}${parts[1][0]}`.toUpperCase()
}

type ListingCardProps = {
  listing: ListingWithMedia
}

const ListingCard: FC<ListingCardProps> = ({ listing }) => {
  const {
    id,
    title,
    description,
    price,
    isFree,
    owner,
    category,
    createdAt,
    images,
    availability,
    condition,
  } = listing
  const imageUrl = images?.[0] ?? ('imageUrl' in listing ? listing.imageUrl : null)
  const categoryLabel = category?.name ?? 'Uncategorized'
  const ownerName = owner?.name ?? 'Marketplace partner'
  const availabilityLabel = availability?.trim() ?? ''
  const contactLabel = getListingPublicContactLabel(listing)
  const conditionDetails =
    LISTING_CONDITION_CONFIG[condition] ?? LISTING_CONDITION_CONFIG[DEFAULT_LISTING_CONDITION]

  return (
    <article className="card group h-full overflow-hidden">
      <div className="relative aspect-[4/3] overflow-hidden">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={title}
            className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200 text-3xl font-semibold text-slate-400">
            {getInitials(title)}
          </div>
        )}
        {isFree ? (
          <span className="absolute left-3 top-3 rounded-full bg-green-600 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-white shadow-lg">
            🎁 Free
          </span>
        ) : (
          <span className="absolute left-3 top-3 rounded-full bg-black/60 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-white">
            {categoryLabel}
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-3 p-5">
        <div className="flex items-center justify-between text-sm text-slate-500">
          <span>{ownerName}</span>
          <time dateTime={createdAt}>{formatDateLabel(createdAt)}</time>
        </div>
        <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
        <div className="mt-1 inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-700">
          <span aria-hidden="true">{conditionDetails.icon}</span>
          {conditionDetails.label}
        </div>
        <p className="text-sm text-slate-600 line-clamp-3">{description}</p>
        {(availabilityLabel || contactLabel) && (
          <div className="space-y-1 text-xs text-slate-500">
            {availabilityLabel ? (
              <p className="line-clamp-1">
                <span className="font-semibold text-slate-600">Availability:</span> {availabilityLabel}
              </p>
            ) : null}
            {contactLabel ? (
              <p className="line-clamp-1">
                <span className="font-semibold text-slate-600">Contact:</span> {contactLabel}
              </p>
            ) : null}
          </div>
        )}
        <div className="mt-auto flex items-center justify-between pt-3">
          <span className={`text-lg font-semibold ${isFree ? 'text-green-600' : 'text-primary'}`}>
            {formatPrice(price, isFree)}
          </span>
          <Link
            to={`/listings/${id}`}
            className="btn-primary inline-flex rounded-full px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:-translate-y-0.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary/80"
          >
            View details
          </Link>
        </div>
      </div>
    </article>
  )
}

export default ListingCard
