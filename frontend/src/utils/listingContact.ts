
import type { Listing } from '../services/listings'
export type ListingPublicContact =
  | string
  | {
      label?: string | null
      value?: string | null
      method?: string | null
    }
  | null
  | undefined

export type ListingContactSource = {
  showContactInfo?: boolean | null
  publicContact?: ListingPublicContact
  preferredContactMethod?: string | null
}

export const getListingPublicContactLabel = ({
  showContactInfo,
  publicContact,
  preferredContactMethod,
}: ListingContactSource): string => {
  if (!showContactInfo) {
    return ''
  }

  const contactValue = (() => {
    if (typeof publicContact === 'string') {
      return publicContact
    }

    if (publicContact && typeof publicContact === 'object') {
      return publicContact.label ?? publicContact.value ?? publicContact.method ?? ''
    }

    return ''
  })()

  const normalized = contactValue?.trim() ?? ''

  if (normalized) {
    return normalized
  }

  return preferredContactMethod?.trim() ?? '' 
}
 

const sanitizeValue = (value: unknown): string | null => {
  console.log('sanitizeValue input:', value)
  if (typeof value !== 'string') {
    return null
  }
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : null
}

const buildFallbackMessage = (methodLabel: string): string => {
  console.log('methodLabel:', methodLabel)
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
  console.log(listing.publicContactInfo)

  const methodLabel = listing.publicContactInfo?.label?.trim() ||  listing.publicContactInfo?.method?.trim() ||  listing.preferredContactMethod?.trim() ||
    ''

  if (!methodLabel) {
    return null
  }

   
  if (methodLabel.toLowerCase().includes('phone')) {
      const value = sanitizeValue(listing.publicContactInfo?.value || listing.publicContactInfo?.label)
        return {
        methodLabel,
        value,
        fallbackMessage: value ? null : buildFallbackMessage(methodLabel),
      }
  } else {
      const value = sanitizeValue(listing.publicContactInfo?.value || listing.publicContactInfo?.label)
        return {
        methodLabel,
        value,
        fallbackMessage: value ? null : buildFallbackMessage(methodLabel),
      }
  }
 
}
export type ListingContactSummary = {
  methodLabel: string
  value: string | null
  fallbackMessage: string | null
}

