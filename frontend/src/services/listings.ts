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

export type Listing = {
  id: string
  title: string
  description: string
  price: string
  isFree: boolean
  isActive: boolean
  createdAt: string
  updatedAt: string
  owner: ListingOwner
  category: ListingCategory | null
  images?: string[] | null
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
  categoryId?: string | null
  images?: string[]
}

const normalizeListingPayload = (payload: ListingPayload) => {
  const { categoryId, ...rest } = payload
  const priceNum = Number(rest.price);
  // If price is 0, always mark as free; otherwise preserve provided isFree (may be undefined)
  const isFree = priceNum < 1 ? true : rest.isFree;
  rest.isFree = isFree
  return {
    ...rest,
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
