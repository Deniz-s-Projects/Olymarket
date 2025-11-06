import type { Listing } from '../services/listings'

export type ListingContactSummary = {
  methodLabel: string
  value: string | null
  fallbackMessage: string | null
}

const sanitizeValue = (value: unknown): string | null => {
  if (typeof value !== 'string') {
    return null
  }
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : null
}

const buildFallbackMessage = (methodLabel: string): string => {
  const normalized = methodLabel.toLowerCase()
  if (normalized.includes('messag') || normalized.includes('chat')) {
    return 'Reach out using Olymarket messages to connect with this seller.'
  }

  return 'Start a conversation to share contact details securely.'
}

export const deriveListingContactSummary = (
  listing: Pick<Listing, 'showContactInfo' | 'preferredContactMethod' | 'publicContactInfo'>
): ListingContactSummary | null => {
  if (!listing.showContactInfo) {
    return null
  }

  const methodLabel =
    listing.publicContactInfo?.label?.trim() ||
    listing.publicContactInfo?.method?.trim() ||
    listing.preferredContactMethod?.trim() ||
    ''

  if (!methodLabel) {
    return null
  }

  const value = sanitizeValue(listing.publicContactInfo?.value ?? null)

  return {
    methodLabel,
    value,
    fallbackMessage: value ? null : buildFallbackMessage(methodLabel),
  }
}
