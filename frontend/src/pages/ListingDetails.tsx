import { useEffect, useMemo, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { fetchListingById, type Listing } from '../services/listings'
import { createConversation } from '../services/conversations'
import { useAuth } from '../context/useAuth'

const currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'EUR',
  maximumFractionDigits: 0,
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
  }, [id])

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

  const { title, description, price, category, owner, createdAt } = listing
  const sellerName = owner?.name ?? owner?.email ?? 'Marketplace partner'

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
    if (user?.id === owner.id) {
      setContactError('You cannot contact yourself.')
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
              {createdAt ? (
                <span className="text-xs text-slate-500">Posted {formatDate(createdAt)}</span>
              ) : null}
            </div>
            <h1 className="mt-3 text-2xl font-semibold text-slate-900 sm:text-3xl">{title}</h1>
            <p className="mt-3 whitespace-pre-line text-slate-700">{description}</p>
          </article>
        </section>

        <aside className="space-y-4 lg:sticky lg:top-8 self-start">
          <div className="rounded-2xl bg-white p-6 shadow">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-3xl font-semibold text-primary">{currencyFormatter.format(Number.parseFloat(price))}</div>
                <div className="mt-1 text-sm text-slate-500">All prices in EUR</div>
              </div>
              <button
                type="button"
                title="Share"
                className="rounded-full border border-slate-200 px-3 py-1 text-sm text-slate-600 transition hover:border-slate-300 hover:text-slate-900"
              >
                Share
              </button>
            </div>
            <button
              type="button"
              onClick={handleContactSeller}
              disabled={isContactingSeller || (user?.id === owner.id)}
              className="btn-primary mt-5 inline-flex w-full justify-center rounded-full px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary/70 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isContactingSeller ? 'Connecting...' : user?.id === owner.id ? 'Your listing' : 'Contact seller'}
            </button>
            {contactError ? (
              <p className="mt-2 text-xs text-red-600">{contactError}</p>
            ) : null}
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

          <Link to="/" className="btn-primary inline-flex w-full justify-center rounded-full px-5 py-3 text-sm font-semibold text-white">Back to marketplace</Link>
        </aside>
      </div>
    </div>
  )
}

export default ListingDetails
