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
  isActive: boolean
  createdAt: string
  updatedAt: string
  owner: ListingOwner
  category: ListingCategory | null
}

export const fetchListings = async () => {
  return apiClient<Listing[]>('/listings')
}

export const searchListings = async (term: string) => {
  return apiClient<Listing[]>('/listings/search/query', {
    params: { q: term },
  })
}

export const fetchListingById = async (id: string) => {
  return apiClient<Listing>(`/listings/${id}`)
}

export type ListingPayload = {
  title: string
  description: string
  price: string
  isActive?: boolean
  categoryId?: string | null
}

const normalizeListingPayload = (payload: ListingPayload) => {
  const { categoryId, ...rest } = payload
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
