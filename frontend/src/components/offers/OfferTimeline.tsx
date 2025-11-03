import type { OfferMessage, OfferParticipant } from '../../services/listings'

const EURO_FORMATTER = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'EUR',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

const formatAmount = (value: string | null) => {
  if (!value) return null
  const parsed = Number.parseFloat(value)
  if (Number.isNaN(parsed)) return null
  return EURO_FORMATTER.format(parsed)
}

const formatTimestamp = (value: string) => {
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) {
    return ''
  }

  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(parsed)
}

type OfferTimelineProps = {
  messages: OfferMessage[]
  buyer: OfferParticipant
  seller: OfferParticipant
}

const getSenderName = (message: OfferMessage, buyer: OfferParticipant) => {
  if (message.sender) {
    return message.sender.name || 'Marketplace member'
  }

  return message.type === 'status'
    ? 'Marketplace update'
    : buyer.name || 'Marketplace member'
}

const OfferTimeline = ({ messages, buyer, seller }: OfferTimelineProps) => {
  if (messages.length === 0) {
    return (
      <p className="rounded-lg bg-slate-50 px-4 py-3 text-sm text-slate-500">
        No activity yet. Start the conversation with an offer.
      </p>
    )
  }

  return (
    <ol className="space-y-4">
      {messages.map((message) => {
        const sender = getSenderName(message, message.type === 'counter' ? seller : buyer)
        const formattedAmount = formatAmount(message.amount)
        const timestamp = formatTimestamp(message.createdAt)

        let headline: string
        switch (message.type) {
          case 'counter':
            headline = formattedAmount
              ? `${sender} countered with ${formattedAmount}`
              : `${sender} sent a counter offer`
            break
          case 'status':
            headline = message.body ?? `${sender} updated the offer`
            break
          case 'note':
            headline = `${sender} added a note`
            break
          default:
            headline = formattedAmount
              ? `${sender} offered ${formattedAmount}`
              : `${sender} shared an update`
            break
        }

        return (
          <li key={message.id} className="rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm font-semibold text-slate-800">{headline}</p>
              {timestamp ? <span className="text-xs text-slate-500">{timestamp}</span> : null}
            </div>
            {message.body && message.type !== 'status' ? (
              <p className="mt-2 text-sm text-slate-600">{message.body}</p>
            ) : null}
          </li>
        )
      })}
    </ol>
  )
}

export default OfferTimeline
