import { apiClient } from '../lib/apiClient'

export type ListingCategory = {
  id: string
  name: string
  slug: string
}

export type ListingOwner = {
  id: string
  name: string
  email: string
}

export type ListingStatus = 'active' | 'draft' | 'sold' | 'expired'
export type ListingStatusUpdate = Exclude<ListingStatus, 'expired'>

export const LISTING_CONDITIONS = ['new', 'good', 'used_but_works', 'fixer_upper'] as const
export type ListingCondition = (typeof LISTING_CONDITIONS)[number]

export type Listing = {
  id: string
  title: string
  description: string
  price: string
  isFree: boolean
  isActive: boolean
  status: ListingStatus
  soldAt?: string | null
  expiresAt?: string | null
  createdAt: string
  updatedAt: string
  owner: ListingOwner
  category: ListingCategory | null
  images?: string[] | null
  viewsCount?: number
  savesCount?: number
  availability: string | null
  preferredContactMethod: string | null
  condition: ListingCondition
}

export type OfferStatus = 'pending' | 'accepted' | 'declined'
export type OfferMessageType = 'offer' | 'counter' | 'note' | 'status'

export type OfferParticipant = {
  id: string
  name: string
  email: string
}

export type OfferMessage = {
  id: string
  body: string | null
  amount: string | null
  type: OfferMessageType
  createdAt: string
  updatedAt: string
  sender: OfferParticipant | null
}

export type Offer = {
  id: string
  amount: string
  status: OfferStatus
  createdAt: string
  updatedAt: string
  listing: { id: string; title: string }
  buyer: OfferParticipant
  seller: OfferParticipant
  lastActionBy: OfferParticipant | null
  messages: OfferMessage[]
}

export type ListingOffersResponse = {
  viewerRole: 'buyer' | 'seller'
  offers: Offer[]
}

export type PaginatedResponse<T> = {
  data: T[]
  meta: {
    page: number
    limit: number
    total: number
    totalPages: number
    hasMore: boolean
  }
}

export type ListingsQueryParams = {
  page?: number
  limit?: number
  q?: string
  category?: string
  isFree?: boolean
  minPrice?: number
  maxPrice?: number
  sortBy?: 'price' | 'createdAt'
  sortOrder?: 'asc' | 'desc'
}

export const fetchListings = async (params: ListingsQueryParams = {}) => {
  return apiClient<PaginatedResponse<Listing>>('/listings', {
    params,
  })
}

export const searchListings = async (term: string, params: Omit<ListingsQueryParams, 'q'> = {}) => {
  return apiClient<PaginatedResponse<Listing>>('/listings/search/query', {
    params: {
      ...params,
      q: term,
    },
  })
}

export const fetchListingById = async (id: string) => {
  return apiClient<Listing>(`/listings/${id}`)
}

export type ListingPayload = {
  title: string
  description: string
  price: string
  isFree?: boolean
  isActive?: boolean
  status?: ListingStatus
  categoryId?: string | null
  images?: string[]
  availability: string
  preferredContactMethod: string
  condition?: ListingCondition
}

const normalizeListingPayload = (payload: ListingPayload) => {
  const { categoryId, status, condition, ...rest } = payload
  const priceNum = Number(rest.price);
  // If price is 0, always mark as free; otherwise preserve provided isFree (may be undefined)
  const isFree = priceNum < 1 ? true : rest.isFree;
  rest.isFree = isFree
  const sanitizedStatus: ListingStatusUpdate | undefined =
    status && status !== 'expired' ? status : undefined
  const normalizedStatus: ListingStatusUpdate | undefined =
    sanitizedStatus ??
    (typeof rest.isActive === 'boolean' ? (rest.isActive ? 'active' : 'draft') : undefined)
  return {
    ...rest,
    status: normalizedStatus,
    availability: rest.availability?.trim() ?? "",
    preferredContactMethod: rest.preferredContactMethod?.trim() ?? "",
    condition: condition ?? 'used_but_works',
    categoryId: categoryId ? categoryId : undefined,
  }
}

export const createListing = async (payload: ListingPayload) => { 
  return apiClient<Listing>('/listings', {
    method: 'POST',
    body: normalizeListingPayload(payload),
  })
}

export const updateListing = async (id: string, payload: ListingPayload) => {
  return apiClient<Listing>(`/listings/${id}`, {
    method: 'PUT',
    body: normalizeListingPayload(payload),
  })
}

export const updateListingStatus = async (id: string, status: ListingStatusUpdate) => {
  return apiClient<Listing>(`/listings/${id}/status`, {
    method: 'PATCH',
    body: { status },
  })
}

export const fetchListingCategories = async () => {
  return apiClient<ListingCategory[]>('/categories')
}

export const checkListingSaved = async (id: string, token: string) => {
  return apiClient<{ isSaved: boolean }>(`/listings/${id}/saved`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })
}

export const saveListing = async (id: string, token: string) => {
  return apiClient<{ message: string; isSaved: boolean }>(`/listings/${id}/save`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })
}

export const unsaveListing = async (id: string, token: string) => {
  return apiClient<{ message: string; isSaved: boolean }>(`/listings/${id}/save`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })
}

export const fetchListingOffers = async (listingId: string, token: string) => {
  return apiClient<ListingOffersResponse>(`/offers/listing/${listingId}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })
}

export type SubmitOfferPayload = {
  listingId: string
  amount: number
  message?: string
}

export const submitOffer = async (payload: SubmitOfferPayload, token: string) => {
  return apiClient<{ offer: Offer }>('/offers', {
    method: 'POST',
    body: payload,
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })
}

export const acceptOffer = async (offerId: string, token: string) => {
  return apiClient<{ offer: Offer }>(`/offers/${offerId}/accept`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })
}

export const declineOffer = async (offerId: string, token: string) => {
  return apiClient<{ offer: Offer }>(`/offers/${offerId}/decline`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })
}

export type CounterOfferPayload = {
  amount: number
  message?: string
}

export const counterOffer = async (offerId: string, payload: CounterOfferPayload, token: string) => {
  return apiClient<{ offer: Offer }>(`/offers/${offerId}/counter`, {
    method: 'POST',
    body: payload,
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })
}
