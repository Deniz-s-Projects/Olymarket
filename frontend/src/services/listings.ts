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
  availability: string | null
  preferredContactMethod: string | null
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
  availability: string
  preferredContactMethod: string
}

const normalizeListingPayload = (payload: ListingPayload) => {
  const { categoryId, availability, preferredContactMethod, ...rest } = payload
  const priceNum = Number(rest.price);
  // If price is 0, always mark as free; otherwise preserve provided isFree (may be undefined)
  const isFree = priceNum < 1 ? true : rest.isFree;
  rest.isFree = isFree
  return {
    ...rest,
    availability: availability.trim(),
    preferredContactMethod: preferredContactMethod.trim(),
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
