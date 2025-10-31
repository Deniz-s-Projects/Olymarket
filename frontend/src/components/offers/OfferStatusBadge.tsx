import type { OfferStatus } from '../../services/listings'

type StatusConfig = {
  label: string
  className: string
}

const STATUS_STYLES: Record<OfferStatus, StatusConfig> = {
  pending: {
    label: 'Pending response',
    className: 'border-amber-200 bg-amber-50 text-amber-700',
  },
  accepted: {
    label: 'Accepted',
    className: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  },
  declined: {
    label: 'Declined',
    className: 'border-rose-200 bg-rose-50 text-rose-700',
  },
}

type OfferStatusBadgeProps = {
  status: OfferStatus
}

const OfferStatusBadge = ({ status }: OfferStatusBadgeProps) => {
  const { label, className } = STATUS_STYLES[status]
  return (
    <span
      className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-wide ${className}`}
    >
      {label}
    </span>
  )
}

export default OfferStatusBadge
