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
