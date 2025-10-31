import { useState } from 'react'
import { Link } from 'react-router-dom'

import {
  type RespondToWantedListingPayload,
  type WantedListing,
} from '../services/wantedListings'

type WantedRequestCardProps = {
  request: WantedListing
  isResponding: boolean
  onRespond: (id: string, payload: RespondToWantedListingPayload) => Promise<void>
  currentUserId?: string | null
}

const statusStyles: Record<WantedListing['status'], string> = {
  open: 'bg-emerald-100 text-emerald-700',
  matched: 'bg-amber-100 text-amber-700',
  fulfilled: 'bg-blue-100 text-blue-700',
  cancelled: 'bg-rose-100 text-rose-700',
}

const WantedRequestCard = ({ request, isResponding, onRespond, currentUserId }: WantedRequestCardProps) => {
  const [isFormVisible, setIsFormVisible] = useState(false)
  const [message, setMessage] = useState('')
  const [markFulfilled, setMarkFulfilled] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  const isOwner = currentUserId === request.buyer.id
  const canRespond = !isOwner && !['fulfilled', 'cancelled'].includes(request.status)

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!canRespond) {
      return
    }

    setError(null)
    setSuccessMessage(null)

    try {
      await onRespond(request.id, { message, markFulfilled })
      setSuccessMessage(
        markFulfilled
          ? 'Great! We let the buyer know this request can be fulfilled. Check your inbox for next steps.'
          : 'Thanks for reaching out! Your message was sent via conversations.',
      )
      setMessage('')
      setMarkFulfilled(false)
      setIsFormVisible(false)
    } catch (caughtError) {
      const normalizedError =
        caughtError instanceof Error ? caughtError.message : 'We could not send your response. Please try again.'
      setError(normalizedError)
    }
  }

  return (
    <article className="card flex flex-col gap-4 p-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-wide">
            <span className={`inline-flex items-center rounded-full px-2.5 py-1 ${statusStyles[request.status]}`}>
              {request.status}
            </span>
            {request.category ? (
              <span className="rounded-full bg-slate-100 px-2.5 py-1 text-slate-600">
                {request.category.name}
              </span>
            ) : null}
            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-slate-600">Budget up to ${request.budget}</span>
          </div>
          <h3 className="text-xl font-semibold text-slate-900">{request.title}</h3>
          {request.details ? (
            <p className="text-sm text-slate-600">{request.details}</p>
          ) : (
            <p className="text-sm text-slate-500 italic">No additional details provided.</p>
          )}
        </div>
        <div className="text-sm text-slate-500">
          <p>
            Buyer:{' '}
            <span className="font-semibold text-slate-700">
              {isOwner ? 'You' : request.buyer.name}
            </span>
          </p>
          {request.fulfillingSeller ? (
            <p>
              Matched with <span className="font-semibold text-slate-700">{request.fulfillingSeller.name}</span>
            </p>
          ) : null}
          {request.fulfilledAt ? (
            <p>Fulfilled on {new Date(request.fulfilledAt).toLocaleDateString()}</p>
          ) : null}
          {request.conversation ? (
            <p>
              Conversation:{' '}
              <Link to="/messages" className="font-semibold text-primary hover:text-primary-accent">
                View in inbox
              </Link>
            </p>
          ) : null}
        </div>
      </header>

      {canRespond ? (
        <div className="space-y-3">
          {!isFormVisible ? (
            <div className="space-y-2">
              <button
                type="button"
                onClick={() => {
                  setIsFormVisible(true)
                  setError(null)
                  setSuccessMessage(null)
                }}
                className="btn-primary inline-flex items-center rounded-full px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary/60"
              >
                Respond to buyer
              </button>
              {successMessage ? <p className="text-sm text-emerald-600">{successMessage}</p> : null}
            </div>
          ) : (
            <form className="space-y-4" onSubmit={handleSubmit}>
              <label className="flex flex-col gap-2 text-sm">
                <span className="font-semibold text-slate-700">Your message</span>
                <textarea
                  value={message}
                  onChange={(event) => setMessage(event.target.value)}
                  rows={3}
                  required
                  placeholder="Share how you can help, pricing, or availability..."
                  className="rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
              </label>
              <label className="flex items-center gap-3 text-sm text-slate-600">
                <input
                  type="checkbox"
                  checked={markFulfilled}
                  onChange={(event) => setMarkFulfilled(event.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary"
                />
                I'm ready to fulfill this request now
              </label>
              {error ? <p className="text-sm text-red-600">{error}</p> : null}
              {successMessage ? <p className="text-sm text-emerald-600">{successMessage}</p> : null}
              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="submit"
                  disabled={isResponding}
                  className="btn-primary inline-flex items-center rounded-full px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary/60 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isResponding ? 'Sending response…' : 'Send response'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsFormVisible(false)
                    setMessage('')
                    setMarkFulfilled(false)
                    setError(null)
                    setSuccessMessage(null)
                  }}
                  className="inline-flex items-center rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:border-primary hover:text-primary"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}
        </div>
      ) : isOwner ? (
        <p className="text-sm font-medium text-slate-600">This is your request. Buyers will see their own listing here.</p>
      ) : (
        <p className="text-sm text-slate-500">This request is no longer accepting responses.</p>
      )}
    </article>
  )
}

export default WantedRequestCard
