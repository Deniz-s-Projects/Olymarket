import { Link } from 'react-router-dom'

import { type WantedListing } from '../services/wantedListings'

type RoomOfferCardProps = {
  offer: WantedListing
  isCurrentUser?: boolean
}

const statusStyles: Record<WantedListing['status'], string> = {
  open: 'bg-emerald-100 text-emerald-700',
  matched: 'bg-amber-100 text-amber-700',
  fulfilled: 'bg-blue-100 text-blue-700',
  cancelled: 'bg-rose-100 text-rose-700',
}

const formatDate = (value: string | null) => (value ? new Date(value).toLocaleDateString() : null)

const RoomOfferCard = ({ offer, isCurrentUser }: RoomOfferCardProps) => {
  const expiresOn = formatDate(offer.expiresAt)
  const fulfilledOn = formatDate(offer.fulfilledAt)

  return (
    <article className="card flex flex-col gap-4 p-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-wide">
            <span className={`inline-flex items-center rounded-full px-2.5 py-1 ${statusStyles[offer.status]}`}>
              {offer.status}
            </span>
            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-slate-600">${offer.monthlyPrice}/mo</span>
            {expiresOn ? (
              <span className="rounded-full bg-amber-50 px-2.5 py-1 text-amber-700">Valid until {expiresOn}</span>
            ) : null}
          </div>
          <h3 className="text-xl font-semibold text-slate-900">{offer.title}</h3>
          {offer.details ? (
            <p className="text-sm text-slate-600">{offer.details}</p>
          ) : (
            <p className="text-sm text-slate-500 italic">No additional details provided.</p>
          )}
        </div>
        <div className="text-sm text-slate-500">
          <p>
            Host:{' '}
            <span className="font-semibold text-slate-700">{isCurrentUser ? 'You' : offer.buyer.name || 'Marketplace member'}</span>
          </p>
          {offer.conversation ? (
            <p>
              Conversation:{' '}
              <Link to="/messages" className="font-semibold text-primary hover:text-primary-accent">
                View in inbox
              </Link>
            </p>
          ) : null}
          {fulfilledOn ? <p>Fulfilled on {fulfilledOn}</p> : null}
        </div>
      </header>

      <div className="grid gap-4 rounded-xl bg-slate-50 p-4 text-sm text-slate-700 sm:grid-cols-2">
        <div className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Address</p>
          <p className="font-medium text-slate-800">{offer.address}</p>
        </div>
        <div className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Contact</p>
          <p className="font-medium text-slate-800">{offer.contactInfo}</p>
        </div>
      </div>
    </article>
  )
}

export default RoomOfferCard
