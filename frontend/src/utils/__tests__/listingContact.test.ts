import { describe, expect, it } from 'vitest'

import { deriveListingContactSummary } from '../listingContact'
import type { ListingPublicContactInfo } from '../../services/listings'

const buildListing = (
  overrides: Partial<{
    showContactInfo: boolean
    preferredContactMethod: string | null
    publicContactInfo: ListingPublicContactInfo | null | undefined
  }> = {}
) => ({
  showContactInfo: overrides.showContactInfo ?? true,
  preferredContactMethod: overrides.preferredContactMethod ?? 'Email',
  publicContactInfo:
    overrides.publicContactInfo === undefined
      ? {
          method: 'email',
          label: 'Email',
          value: 'seller@example.com',
        }
      : overrides.publicContactInfo,
})

describe('deriveListingContactSummary', () => {
  it('returns null when the listing hides contact info', () => {
    const summary = deriveListingContactSummary(
      buildListing({ showContactInfo: false, publicContactInfo: null })
    )

    expect(summary).toBeNull()
  })

  it('prefers the label and trims the public value when provided', () => {
    const summary = deriveListingContactSummary(
      buildListing({
        publicContactInfo: {
          method: 'email',
          label: 'Email',
          value: ' seller@example.com ',
        },
      })
    )

    expect(summary).not.toBeNull()
    expect(summary?.methodLabel).toBe('Email')
    expect(summary?.value).toBe('seller@example.com')
    expect(summary?.fallbackMessage).toBeNull()
  })

  it('falls back to preferred method when the API omits a contact payload', () => {
    const summary = deriveListingContactSummary(
      buildListing({ publicContactInfo: null, preferredContactMethod: 'Phone' })
    )

    expect(summary).not.toBeNull()
    expect(summary?.methodLabel).toBe('Phone')
    expect(summary?.fallbackMessage).toBe('Start a conversation to share contact details securely.')
  })

  it('returns a messaging-specific fallback when no value is exposed', () => {
    const summary = deriveListingContactSummary(
      buildListing({
        publicContactInfo: {
          method: 'messages',
          label: 'In-app messaging',
          value: null,
        },
      })
    )

    expect(summary).not.toBeNull()
    expect(summary?.value).toBeNull()
    expect(summary?.fallbackMessage).toBe(
      'Reach out using Olymarket messages to connect with this seller.'
    )
  })
})
