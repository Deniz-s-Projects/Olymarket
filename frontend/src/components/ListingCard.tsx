import type { FC } from 'react'

export type Listing = {
  id: string
  title: string
  description: string
  price: number
  category: string
  location: string
  imageUrl: string
  postedAt: string
}

const currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
})

type ListingCardProps = {
  listing: Listing
}

const ListingCard: FC<ListingCardProps> = ({ listing }) => {
  const { title, description, price, category, location, imageUrl, postedAt } = listing

  return (
    <article className="card group h-full overflow-hidden">
      <div className="relative aspect-[4/3] overflow-hidden">
        <img
          src={imageUrl}
          alt={title}
          className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
          loading="lazy"
        />
        <span className="absolute left-3 top-3 rounded-full bg-black/60 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-white">
          {category}
        </span>
      </div>
      <div className="flex flex-1 flex-col gap-3 p-5">
        <div className="flex items-center justify-between text-sm text-slate-500">
          <span>{location}</span>
          <time dateTime={postedAt}>{postedAt}</time>
        </div>
        <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
        <p className="text-sm text-slate-600">{description}</p>
        <div className="mt-auto flex items-center justify-between pt-3">
          <span className="text-lg font-semibold text-primary">{currencyFormatter.format(price)}</span>
          <button
            type="button"
            className="btn-primary hidden rounded-full px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:-translate-y-0.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary/80 sm:inline-flex"
          >
            View details
          </button>
        </div>
      </div>
    </article>
  )
}

export default ListingCard
