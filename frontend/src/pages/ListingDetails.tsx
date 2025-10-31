import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import {
  fetchListingById,
  checkListingSaved,
  saveListing,
  unsaveListing,
  fetchListingOffers,
  submitOffer,
  acceptOffer,
  declineOffer,
  counterOffer,
  type Listing,
  type Offer,
} from '../services/listings'
import { createConversation } from '../services/conversations'
import { useAuth } from '../context/useAuth'
import ReportModal from '../components/ReportModal'
import OfferStatusBadge from '../components/offers/OfferStatusBadge'
import OfferTimeline from '../components/offers/OfferTimeline'
import { shareListing } from '../lib/shareListing'
import PickupLocationsMap from '../components/PickupLocationsMap'

const currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'EUR',
  maximumFractionDigits: 0,
})

const offerCurrencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'EUR',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

const formatDate = (value?: string) => {
  if (!value) return ''
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return ''
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(parsed)
}

const ListingDetails = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { token, user } = useAuth()
  const [listing, setListing] = useState<Listing | null>(null)
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [error, setError] = useState<string | null>(null)
  const [activeImageIndex, setActiveImageIndex] = useState(0)
  const [isContactingSeller, setIsContactingSeller] = useState(false)
  const [contactError, setContactError] = useState<string | null>(null)
  const [isSaved, setIsSaved] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [showReportModal, setShowReportModal] = useState(false)
  const [reportSuccess, setReportSuccess] = useState(false)
  const [offersData, setOffersData] = useState<{ viewerRole: 'buyer' | 'seller'; offers: Offer[] } | null>(null)
  const [offersStatus, setOffersStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [offersError, setOffersError] = useState<string | null>(null)
  const [offerActionError, setOfferActionError] = useState<string | null>(null)
  const [activeAction, setActiveAction] = useState<string | null>(null)
  const [newOfferAmount, setNewOfferAmount] = useState('')
  const [newOfferMessage, setNewOfferMessage] = useState('')
  const [counterDrafts, setCounterDrafts] = useState<Record<string, { amount: string; message: string }>>({})

  const refreshOffers = useCallback(async () => {
    if (!id || !token) {
      setOffersData(null)
      setOffersStatus('idle')
      setOffersError(null)
      return
    }

    setOffersStatus('loading')
    setOffersError(null)
    try {
      const data = await fetchListingOffers(id, token)
      setOffersData(data)
      setOffersStatus('success')
    } catch (err) {
      setOffersStatus('error')
      setOffersError(err instanceof Error ? err.message : 'Failed to load offers')
    }
  }, [id, token])
  const [isSharing, setIsSharing] = useState(false)
  const [shareFeedback, setShareFeedback] = useState<{
    message: string
    type: 'success' | 'error'
  } | null>(null)

  useEffect(() => {
    if (!shareFeedback) return

    const timeout = window.setTimeout(() => {
      setShareFeedback(null)
    }, 4000)

    return () => {
      window.clearTimeout(timeout)
    }
  }, [shareFeedback])

  useEffect(() => {
    let mounted = true
    const run = async () => {
      if (!id) return
      setStatus('loading')
      setError(null)
      try {
        const data = await fetchListingById(id)
        if (!mounted) return
        setListing(data)
        setStatus('success')

        // Check if listing is saved (only if user is logged in)
        if (token) {
          try {
            const savedStatus = await checkListingSaved(id, token)
            if (mounted) {
              setIsSaved(savedStatus.isSaved)
            }
          } catch (err) {
            // Log error but don't block page load
            console.warn('Failed to check saved status:', err)
          }
        }
      } catch (err) {
        if (!mounted) return
        setStatus('error')
        setError(err instanceof Error ? err.message : 'Failed to load listing')
      }
    }
    run()
    return () => {
      mounted = false
    }
  }, [id, token])

  useEffect(() => {
    void refreshOffers()
  }, [refreshOffers])
  const soldAtLabel = useMemo(() => formatDate(listing?.soldAt ?? undefined), [listing?.soldAt])
  // Hooks must be called unconditionally: compute gallery before any early returns
  const images = listing?.images ?? []
  const gallery = useMemo(() => (images && images.length > 0 ? images : []), [images])
  const activeImage = gallery[activeImageIndex]

  if (status === 'loading') {
    return (
      <div className="mx-auto max-w-5xl px-4 py-10">
        <div className="h-64 animate-pulse rounded-xl bg-slate-200" />
        <div className="mt-6 space-y-3">
          <div className="h-6 w-1/3 rounded bg-slate-200" />
          <div className="h-4 w-2/3 rounded bg-slate-200" />
          <div className="h-4 w-1/2 rounded bg-slate-200" />
        </div>
      </div>
    )
  }

  if (status === 'error' || !listing) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-10 text-center">
        <p className="text-slate-600">{error ?? 'Listing not found.'}</p>
        <Link to="/" className="btn-primary mt-4 inline-flex rounded-full px-5 py-2 text-sm font-semibold text-white">Back to marketplace</Link>
      </div>
    )
  }

  const { title, description, price, isFree, category, owner, createdAt } = listing
  const sellerName = owner?.name ?? owner?.email ?? 'Marketplace partner'
  const viewerRole = offersData?.viewerRole ?? null
  const offers = offersData?.offers ?? []
  const hasPendingOffer = offers.some((offerItem) => offerItem.status === 'pending')
  const currentUserId = user ? String(user.id) : null
  const isSold = listing.status === 'sold' 

  const handleContactSeller = async () => {
    if (!token) {
      navigate('/auth', {
        state: {
          from: `/listings/${id}`,
          message: 'Please sign in to contact the seller.',
        },
      })
      return
    }

    if (!owner?.id) {
      setContactError('Unable to contact seller. Please try again later.')
      return
    }

    // Don't allow contacting yourself
    if (user && String(user.id) === owner.id) {
      setContactError('You cannot contact yourself.')
      return
    }

    if (isSold) {
      setContactError('This listing is no longer available.')
      return
    }

    setIsContactingSeller(true)
    setContactError(null)

    try {
      const conversation = await createConversation(
        {
          topic: `Inquiry about: ${title}`,
          participantIds: [owner.id],
        },
        token
      )
      
      // Navigate to messages page with the conversation selected
      navigate('/messages', { state: { conversationId: conversation.id } })
    } catch (err) {
      setContactError(
        err instanceof Error ? err.message : 'Failed to create conversation. Please try again.'
      )
    } finally {
      setIsContactingSeller(false)
    }
  }

  const handleToggleSave = async () => {
    if (!token || !id) {
      navigate('/auth', {
        state: {
          from: `/listings/${id}`,
          message: 'Please sign in to save listings.',
        },
      })
      return
    }

    setIsSaving(true)
    try {
      if (isSaved) {
        await unsaveListing(id, token)
        setIsSaved(false)
      } else {
        await saveListing(id, token)
        setIsSaved(true)
      }
    } catch (err) {
      console.error('Failed to toggle save:', err)
    } finally {
      setIsSaving(false)
    }
  }

  const handleReportClick = () => {
    if (!token) {
      navigate('/auth', {
        state: {
          from: `/listings/${id}`,
          message: 'Please sign in to report listings.',
        },
      })
      return
    }
    setShowReportModal(true)
  }

  const handleReportSuccess = () => {
    setShowReportModal(false)
    setReportSuccess(true)
    setTimeout(() => setReportSuccess(false), 5000)
  }

  const handleOfferFormSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!id) return

    if (!token) {
      navigate('/auth', {
        state: {
          from: `/listings/${id}`,
          message: 'Please sign in to make an offer.',
        },
      })
      return
    }

    const parsedAmount = Number.parseFloat(newOfferAmount)
    if (!Number.isFinite(parsedAmount) || parsedAmount < 0) {
      setOfferActionError('Enter a valid offer amount before submitting.')
      return
    }

    setActiveAction('submit')
    setOfferActionError(null)
    try {
      await submitOffer(
        {
          listingId: id,
          amount: parsedAmount,
          message: newOfferMessage.trim() ? newOfferMessage.trim() : undefined,
        },
        token
      )
      setNewOfferAmount('')
      setNewOfferMessage('')
      await refreshOffers()
    } catch (err) {
      setOfferActionError(err instanceof Error ? err.message : 'Failed to submit offer')
    } finally {
      setActiveAction(null)
    }
  }

  const handleAcceptOffer = async (offerId: string) => {
    if (!id) return
    if (!token) {
      navigate('/auth', {
        state: {
          from: `/listings/${id}`,
          message: 'Please sign in to manage offers.',
        },
      })
      return
    }

    setActiveAction(`accept-${offerId}`)
    setOfferActionError(null)
    try {
      await acceptOffer(offerId, token)
      await refreshOffers()
    } catch (err) {
      setOfferActionError(err instanceof Error ? err.message : 'Failed to accept offer')
    } finally {
      setActiveAction(null)
    }
  }

  const handleDeclineOffer = async (offerId: string) => {
    if (!id) return
    if (!token) {
      navigate('/auth', {
        state: {
          from: `/listings/${id}`,
          message: 'Please sign in to manage offers.',
        },
      })
      return
    }

    setActiveAction(`decline-${offerId}`)
    setOfferActionError(null)
    try {
      await declineOffer(offerId, token)
      await refreshOffers()
    } catch (err) {
      setOfferActionError(err instanceof Error ? err.message : 'Failed to decline offer')
    } finally {
      setActiveAction(null)
    }
  }

  const handleCounterDraftChange = (offerId: string, field: 'amount' | 'message', value: string) => {
    setCounterDrafts((current) => {
      const existing = current[offerId] ?? { amount: '', message: '' }
      return {
        ...current,
        [offerId]: {
          ...existing,
          [field]: value,
        },
      }
    })
  }

  const handleCounterOffer = async (offerId: string) => {
    if (!id) return
    if (!token) {
      navigate('/auth', {
        state: {
          from: `/listings/${id}`,
          message: 'Please sign in to manage offers.',
        },
      })
      return
    }

    const draft = counterDrafts[offerId]
    const amountValue = Number.parseFloat(draft?.amount ?? '')
    if (!Number.isFinite(amountValue) || amountValue < 0) {
      setOfferActionError('Enter a valid counter amount before submitting.')
      return
    }

    setActiveAction(`counter-${offerId}`)
    setOfferActionError(null)
    try {
      await counterOffer(
        offerId,
        {
          amount: amountValue,
          message: draft?.message?.trim() ? draft.message.trim() : undefined,
        },
        token
      )
      setCounterDrafts((current) => {
        const next = { ...current }
        delete next[offerId]
        return next
      })
      await refreshOffers()
    } catch (err) {
      setOfferActionError(err instanceof Error ? err.message : 'Failed to counter the offer')
    } finally {
      setActiveAction(null)
    }
  }
  
  const handleShareListing = async () => {
    if (!listing) return
    if (typeof window === 'undefined') {
      setShareFeedback({ message: 'Sharing is only available in the browser.', type: 'error' })
      return
    }

    setIsSharing(true)
    try {
      const result = await shareListing({
        url: window.location.href,
        title: listing.title,
        text: listing.description ? `${listing.title} — ${listing.description.slice(0, 180)}` : listing.title,
      })

      setShareFeedback({
        message:
          result.method === 'web-share'
            ? 'Share dialog opened. Send this listing to your network!'
            : 'Listing link copied to your clipboard.',
        type: 'success',
      })
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unable to share listing. Please try again.'
      setShareFeedback({ message, type: 'error' })
    } finally {
      setIsSharing(false)
    }
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 lg:px-8">
      <nav className="mb-6 text-sm text-slate-500">
        <Link to="/" className="hover:text-primary">Marketplace</Link>
        <span className="mx-2">/</span>
        <span className="text-slate-700">{title}</span>
      </nav>

      <div className="grid gap-8 lg:grid-cols-[1.3fr_0.7fr]">
        <section className="space-y-5">
          <div className="overflow-hidden rounded-2xl bg-white shadow">
            {activeImage ? (
              <img src={activeImage} alt={title} className="h-[420px] w-full object-cover" />
            ) : (
              <div className="flex h-[420px] w-full items-center justify-center bg-slate-100 text-3xl text-slate-400">No image</div>
            )}
          </div>

          {gallery.length > 1 ? (
            <div className="grid grid-cols-5 gap-3">
              {gallery.map((src, idx) => (
                <button
                  type="button"
                  key={idx}
                  onClick={() => setActiveImageIndex(idx)}
                  className={`overflow-hidden rounded-xl border ${idx === activeImageIndex ? 'border-primary ring-2 ring-primary/30' : 'border-slate-200'} bg-white shadow-sm transition`}
                  aria-label={`Show image ${idx + 1}`}
                >
                  <img src={src} alt={`${title} ${idx + 1}`} className="h-20 w-full object-cover" />
                </button>
              ))}
            </div>
          ) : null}

          <article className="rounded-2xl bg-white p-6 shadow">
            <div className="flex flex-wrap items-center gap-3">
              <span className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-primary">
                {category ? category.name : 'Uncategorized'}
              </span>
              {isSold ? (
                <span className="inline-flex items-center rounded-full bg-slate-200 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-600">
                  Sold
                </span>
              ) : null}
              {createdAt ? (
                <span className="text-xs text-slate-500">Posted {formatDate(createdAt)}</span>
              ) : null}
            </div>
            <h1 className="mt-3 text-2xl font-semibold text-slate-900 sm:text-3xl">{title}</h1>
            <p className="mt-3 whitespace-pre-line text-slate-700">{description}</p>
          </article>

          <section className="rounded-2xl bg-white p-6 shadow">
            <PickupLocationsMap />
          </section>

          <section className="rounded-2xl bg-white p-6 shadow">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-lg font-semibold text-slate-900">Offers</h2>
              {viewerRole ? (
                <span className="text-xs font-medium uppercase tracking-wide text-slate-500">
                  {viewerRole === 'buyer' ? 'Buyer view' : 'Seller view'}
                </span>
              ) : null}
            </div>
            {!token ? (
              <p className="mt-3 text-sm text-slate-600">
                Sign in to make and track offers on this listing.
              </p>
            ) : offersStatus === 'loading' ? (
              <p className="mt-4 text-sm text-slate-500">Loading offers…</p>
            ) : offersStatus === 'error' ? (
              <p className="mt-4 text-sm text-red-600">{offersError ?? 'Unable to load offers.'}</p>
            ) : viewerRole ? (
              <>
                {viewerRole === 'buyer' ? (
                  <>
                    {hasPendingOffer ? (
                      <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
                        You have a pending offer. Wait for the seller to respond before submitting another.
                      </div>
                    ) : (
                      <form onSubmit={handleOfferFormSubmit} className="mt-4 space-y-4">
                        <div>
                          <label htmlFor="offer-amount" className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                            Offer amount (EUR)
                          </label>
                          <input
                            id="offer-amount"
                            name="offerAmount"
                            type="number"
                            min="0"
                            step="0.01"
                            value={newOfferAmount}
                            onChange={(event) => setNewOfferAmount(event.target.value)}
                            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
                            placeholder="Enter your offer"
                          />
                        </div>
                        <div>
                          <label htmlFor="offer-message" className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                            Message (optional)
                          </label>
                          <textarea
                            id="offer-message"
                            name="offerMessage"
                            value={newOfferMessage}
                            onChange={(event) => setNewOfferMessage(event.target.value)}
                            rows={3}
                            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
                            placeholder="Share additional context for the seller"
                          />
                        </div>
                        <button
                          type="submit"
                          disabled={activeAction === 'submit'}
                          className="btn-primary inline-flex w-full justify-center rounded-full px-5 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {activeAction === 'submit' ? 'Submitting…' : 'Submit offer'}
                        </button>
                      </form>
                    )}
                    {offers.length > 0 ? (
                      offers.map((offerItem) => {
                        const parsedAmount = Number.parseFloat(offerItem.amount)
                        const formattedAmount = Number.isNaN(parsedAmount)
                          ? `${offerItem.amount} EUR`
                          : offerCurrencyFormatter.format(parsedAmount)
                        const lastUpdated = formatDate(offerItem.updatedAt)
                        const isBuyerTurn = !offerItem.lastActionBy || offerItem.lastActionBy.id !== currentUserId
                        const draft = counterDrafts[offerItem.id]
                        const counterAmount = draft?.amount ?? offerItem.amount ?? ''
                        const counterMessage = draft?.message ?? ''
                        return (
                          <div key={offerItem.id} className="mt-6 rounded-xl border border-slate-200 bg-slate-50 p-5">
                            <div className="flex flex-wrap items-start justify-between gap-3">
                              <div>
                                <p className="text-sm font-semibold text-slate-900">{formattedAmount}</p>
                                <p className="text-xs text-slate-500">
                                  {lastUpdated ? `Updated ${lastUpdated}` : 'Awaiting updates'}
                                </p>
                              </div>
                              <OfferStatusBadge status={offerItem.status} />
                            </div>
                            <div className="mt-4">
                              <OfferTimeline messages={offerItem.messages} buyer={offerItem.buyer} seller={offerItem.seller} />
                            </div>
                            {offerItem.status === 'pending' ? (
                              <div className="mt-4 space-y-3 rounded-lg bg-white p-4">
                                <p className="text-sm text-slate-600">
                                  {isBuyerTurn
                                    ? 'The seller has responded. You can counter or withdraw this offer.'
                                    : 'Waiting for the seller to respond.'}
                                </p>
                                <div className="flex flex-col gap-3">
                                  {isBuyerTurn ? (
                                    <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
                                      <div className="flex flex-1 flex-col gap-1">
                                        <label
                                          htmlFor={`buyer-counter-${offerItem.id}`}
                                          className="text-xs font-semibold uppercase tracking-wide text-slate-500"
                                        >
                                          Counter amount (EUR)
                                        </label>
                                        <input
                                          id={`buyer-counter-${offerItem.id}`}
                                          type="number"
                                          min="0"
                                          step="0.01"
                                          value={counterAmount}
                                          onChange={(event) => handleCounterDraftChange(offerItem.id, 'amount', event.target.value)}
                                          className="rounded-lg border border-slate-200 px-3 py-2 text-sm shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
                                        />
                                      </div>
                                      <div className="flex flex-1 flex-col gap-1">
                                        <label
                                          htmlFor={`buyer-note-${offerItem.id}`}
                                          className="text-xs font-semibold uppercase tracking-wide text-slate-500"
                                        >
                                          Message (optional)
                                        </label>
                                        <textarea
                                          id={`buyer-note-${offerItem.id}`}
                                          rows={2}
                                          value={counterMessage}
                                          onChange={(event) => handleCounterDraftChange(offerItem.id, 'message', event.target.value)}
                                          className="rounded-lg border border-slate-200 px-3 py-2 text-sm shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
                                        />
                                      </div>
                                      <button
                                        type="button"
                                        onClick={() => handleCounterOffer(offerItem.id)}
                                        disabled={activeAction === `counter-${offerItem.id}`}
                                        className="min-w-[150px] rounded-full border border-primary/40 bg-primary/10 px-5 py-2 text-sm font-semibold text-primary transition hover:bg-primary/20 disabled:cursor-not-allowed disabled:opacity-60"
                                      >
                                        {activeAction === `counter-${offerItem.id}` ? 'Sending…' : 'Send counter'}
                                      </button>
                                    </div>
                                  ) : null}
                                  <div className="flex flex-wrap gap-2">
                                    <button
                                      type="button"
                                      onClick={() => handleDeclineOffer(offerItem.id)}
                                      disabled={activeAction === `decline-${offerItem.id}`}
                                      className="rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition hover:border-slate-300 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-60"
                                    >
                                      {activeAction === `decline-${offerItem.id}` ? 'Processing…' : 'Withdraw offer'}
                                    </button>
                                  </div>
                                </div>
                              </div>
                            ) : null}
                          </div>
                        )
                      })
                    ) : (
                      <p className="mt-6 text-sm text-slate-500">
                        No offers yet. Submit your first offer to start negotiating with the seller.
                      </p>
                    )}
                  </>
                ) : (
                  <>
                    {offers.length > 0 ? (
                      offers.map((offerItem) => {
                        const buyerName = offerItem.buyer.name ?? offerItem.buyer.email
                        const parsedAmount = Number.parseFloat(offerItem.amount)
                        const formattedAmount = Number.isNaN(parsedAmount)
                          ? `${offerItem.amount} EUR`
                          : offerCurrencyFormatter.format(parsedAmount)
                        const lastUpdated = formatDate(offerItem.updatedAt)
                        const isSellerTurn = !offerItem.lastActionBy || offerItem.lastActionBy.id !== currentUserId
                        const draft = counterDrafts[offerItem.id]
                        const counterAmount = draft?.amount ?? offerItem.amount ?? ''
                        const counterMessage = draft?.message ?? ''
                        return (
                          <div key={offerItem.id} className="mt-6 rounded-xl border border-slate-200 bg-slate-50 p-5">
                            <div className="flex flex-wrap items-start justify-between gap-3">
                              <div>
                                <p className="text-sm font-semibold text-slate-900">Offer from {buyerName}</p>
                                <p className="text-xs text-slate-500">
                                  {formattedAmount} • {lastUpdated ? `Updated ${lastUpdated}` : 'Awaiting response'}
                                </p>
                              </div>
                              <OfferStatusBadge status={offerItem.status} />
                            </div>
                            <div className="mt-4">
                              <OfferTimeline messages={offerItem.messages} buyer={offerItem.buyer} seller={offerItem.seller} />
                            </div>
                            {offerItem.status === 'pending' ? (
                              <div className="mt-4 space-y-3 rounded-lg bg-white p-4">
                                <p className="text-sm text-slate-600">
                                  {isSellerTurn
                                    ? `Respond to ${buyerName} to keep the negotiation moving.`
                                    : 'Waiting for the buyer to respond.'}
                                </p>
                                <div className="flex flex-wrap gap-2">
                                  <button
                                    type="button"
                                    onClick={() => handleDeclineOffer(offerItem.id)}
                                    disabled={activeAction === `decline-${offerItem.id}`}
                                    className="rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition hover:border-slate-300 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-60"
                                  >
                                    {activeAction === `decline-${offerItem.id}` ? 'Processing…' : 'Decline'}
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleAcceptOffer(offerItem.id)}
                                    disabled={!isSellerTurn || activeAction === `accept-${offerItem.id}`}
                                    className="btn-primary rounded-full px-5 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
                                  >
                                    {activeAction === `accept-${offerItem.id}` ? 'Accepting…' : 'Accept offer'}
                                  </button>
                                </div>
                                {isSellerTurn ? (
                                  <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
                                    <div className="flex flex-1 flex-col gap-1">
                                      <label
                                        htmlFor={`seller-counter-${offerItem.id}`}
                                        className="text-xs font-semibold uppercase tracking-wide text-slate-500"
                                      >
                                        Counter amount (EUR)
                                      </label>
                                      <input
                                        id={`seller-counter-${offerItem.id}`}
                                      type="number"
                                        min="0"
                                        step="0.01"
                                        value={counterAmount}
                                        onChange={(event) => handleCounterDraftChange(offerItem.id, 'amount', event.target.value)}
                                        className="rounded-lg border border-slate-200 px-3 py-2 text-sm shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
                                      />
                                    </div>
                                    <div className="flex flex-1 flex-col gap-1">
                                      <label
                                        htmlFor={`seller-note-${offerItem.id}`}
                                        className="text-xs font-semibold uppercase tracking-wide text-slate-500"
                                      >
                                        Message (optional)
                                      </label>
                                      <textarea
                                        id={`seller-note-${offerItem.id}`}
                                        rows={2}
                                        value={counterMessage}
                                        onChange={(event) => handleCounterDraftChange(offerItem.id, 'message', event.target.value)}
                                        className="rounded-lg border border-slate-200 px-3 py-2 text-sm shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
                                      />
                                    </div>
                                    <button
                                      type="button"
                                      onClick={() => handleCounterOffer(offerItem.id)}
                                      disabled={activeAction === `counter-${offerItem.id}`}
                                      className="min-w-[150px] rounded-full border border-primary/40 bg-primary/10 px-5 py-2 text-sm font-semibold text-primary transition hover:bg-primary/20 disabled:cursor-not-allowed disabled:opacity-60"
                                    >
                                      {activeAction === `counter-${offerItem.id}` ? 'Sending…' : 'Send counter'}
                                    </button>
                                  </div>
                                ) : null}
                              </div>
                            ) : null}
                          </div>
                        )
                      })
                    ) : (
                      <p className="mt-4 text-sm text-slate-500">
                        No offers yet. Buyers will appear here when they submit an offer.
                      </p>
                    )}
                  </>
                )}
              </>
            ) : (
              <p className="mt-3 text-sm text-slate-600">Offers will appear here once available.</p>
            )}
            {offerActionError ? (
              <p className="mt-4 text-sm text-red-600">{offerActionError}</p>
            ) : null}
          </section>
        </section>

        <aside className="space-y-4 lg:sticky lg:top-8 self-start">
          <div className="rounded-2xl bg-white p-6 shadow">
            <div className="flex items-start justify-between gap-3">
              <div>
                {isSold ? (
                  <>
                    <div className="text-3xl font-semibold text-slate-500 line-through">
                      {isFree ? 'FREE' : currencyFormatter.format(Number.parseFloat(price))}
                    </div>
                    <div className="mt-1 flex items-center gap-2 text-sm text-slate-500">
                      <span>🛑</span>
                      <span>
                        {soldAtLabel
                          ? `This item was sold on ${soldAtLabel} and is no longer available.`
                          : 'This item has been sold and is no longer available.'}
                      </span>
                    </div>
                  </>
                ) : isFree ? (
                  <>
                    <div className="text-3xl font-semibold text-green-600">FREE</div>
                    <div className="mt-1 flex items-center gap-2 text-sm text-green-600">
                      <span>🎁</span>
                      <span>Being given away for free!</span>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="text-3xl font-semibold text-primary">{currencyFormatter.format(Number.parseFloat(price))}</div>
                    <div className="mt-1 text-sm text-slate-500">All prices in EUR</div>
                  </>
                )}
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleToggleSave}
                  disabled={isSaving}
                  title={isSaved ? "Unsave listing" : "Save listing"}
                  className={`rounded-full border px-3 py-1 text-sm transition ${
                    isSaved 
                      ? 'border-primary bg-primary text-white hover:bg-primary/90' 
                      : 'border-slate-200 text-slate-600 hover:border-slate-300 hover:text-slate-900'
                  } disabled:cursor-not-allowed disabled:opacity-60`}
                >
                  {isSaving ? '...' : isSaved ? '★ Saved' : '☆ Save'}
                </button>
                <button
                  type="button"
                  title="Share"
                  onClick={handleShareListing}
                  disabled={isSharing}
                  className="rounded-full border border-slate-200 px-3 py-1 text-sm text-slate-600 transition hover:border-slate-300 hover:text-slate-900"
                >
                  {isSharing ? 'Sharing…' : 'Share'}
                </button>
              </div>
            </div>
            {isSold ? (
              <div className="mt-5 space-y-2 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                <p>
                  {soldAtLabel
                    ? `This listing was sold on ${soldAtLabel}. Browse similar listings on the marketplace for other options.`
                    : 'This listing has been marked as sold. Browse similar listings on the marketplace for other options.'}
                </p>
                {soldAtLabel ? (
                  <p className="text-xs uppercase tracking-wide text-slate-400">Sold on {soldAtLabel}</p>
                ) : null}
              </div>
            ) : (
              <>
                <button
                  type="button"
                  onClick={handleContactSeller}
                  disabled={
                    isContactingSeller || Boolean(user && String(user.id) === owner.id)
                  }
                  className="btn-primary mt-5 inline-flex w-full justify-center rounded-full px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary/70 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isContactingSeller
                    ? 'Connecting...'
                    : user && String(user.id) === owner.id
                    ? 'Your listing'
                    : 'Contact seller'}
                </button>
                {contactError ? (
                  <p className="mt-2 text-xs text-red-600">{contactError}</p>
                ) : null}
              </>
            )}
          </div>

          <div className="rounded-2xl bg-white p-6 shadow">
            <h2 className="text-base font-semibold text-slate-900">Seller</h2>
            <div className="mt-3 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                {(sellerName || '?').charAt(0).toUpperCase()}
              </div>
              <div>
                <div className="text-slate-800">{sellerName}</div>
                <div className="text-xs text-slate-500">Verified partner</div>
              </div>
            </div>
          </div>

          <div className="rounded-2xl bg-white p-6 shadow">
            <h2 className="text-base font-semibold text-slate-900">Need help?</h2>
            <p className="mt-2 text-sm text-slate-600">
              If you find this listing inappropriate or suspicious, you can report it to our moderation team.
            </p>
            <button
              type="button"
              onClick={handleReportClick}
              className="mt-3 inline-flex w-full justify-center rounded-full border border-red-200 bg-red-50 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-100"
            >
              🚩 Report this listing
            </button>
          </div>

          <Link to="/" className="btn-primary inline-flex w-full justify-center rounded-full px-5 py-3 text-sm font-semibold text-white">Back to marketplace</Link>
        </aside>
      </div>

      {(shareFeedback || reportSuccess) && (
        <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
          {shareFeedback ? (
            <div
              className={`flex items-center justify-between gap-3 rounded-lg px-4 py-3 text-sm font-medium text-white shadow-lg ${
                shareFeedback.type === 'success' ? 'bg-green-600' : 'bg-red-600'
              }`}
              role="status"
            >
              <span>{shareFeedback.message}</span>
              <button
                type="button"
                onClick={() => setShareFeedback(null)}
                className="text-white transition hover:opacity-80"
                aria-label="Dismiss notification"
              >
                ✕
              </button>
            </div>
          ) : null}
          {reportSuccess ? (
            <div className="rounded-lg bg-green-600 px-4 py-3 text-sm font-medium text-white shadow-lg">
              Report submitted successfully. Our team will review it soon.
            </div>
          ) : null}
        </div>
      )}

      {showReportModal && listing && (
        <ReportModal
          reportType="listing"
          targetId={listing.id}
          targetTitle={listing.title}
          onClose={() => setShowReportModal(false)}
          onSuccess={handleReportSuccess}
        />
      )}
    </div>
  )
}

export default ListingDetails
