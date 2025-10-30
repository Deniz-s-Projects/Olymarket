import type { FC } from 'react'
import { Link } from 'react-router-dom'

import type { Listing } from '../services/listings'

type ListingWithMedia = Listing & { imageUrl?: string | null }

const currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'EUR',
  maximumFractionDigits: 0,
})

const formatPrice = (price: string) => {
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
  const { id, title, description, price, owner, category, createdAt, images } = listing
  const imageUrl = images?.[0] ?? ('imageUrl' in listing ? listing.imageUrl : null)
  const categoryLabel = category?.name ?? 'Uncategorized'
  const ownerName = owner?.name ?? 'Marketplace partner'

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
        <span className="absolute left-3 top-3 rounded-full bg-black/60 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-white">
          {categoryLabel}
        </span>
      </div>
      <div className="flex flex-1 flex-col gap-3 p-5">
        <div className="flex items-center justify-between text-sm text-slate-500">
          <span>{ownerName}</span>
          <time dateTime={createdAt}>{formatDateLabel(createdAt)}</time>
        </div>
        <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
        <p className="text-sm text-slate-600 line-clamp-3">{description}</p>
        <div className="mt-auto flex items-center justify-between pt-3">
          <span className="text-lg font-semibold text-primary">{formatPrice(price)}</span>
          <Link
            to={`/listings/${id}`}
            className="btn-primary hidden rounded-full px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:-translate-y-0.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary/80 sm:inline-flex"
          >
            View details
          </Link>
        </div>
      </div>
    </article>
  )
}

export default ListingCard
