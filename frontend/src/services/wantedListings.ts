import { apiClient } from '../lib/apiClient'
import type { PublicUser } from '../types/users'

export type WantedListingStatus = 'open' | 'matched' | 'fulfilled' | 'cancelled'

export type WantedListingUser = PublicUser

export type WantedListingCategory = {
  id: string
  name: string
  slug: string
}

export type WantedListingConversationParticipant = {
  id: string
  user: PublicUser
}

export type WantedListingConversation = {
  id: string
  topic: string
  participants?: WantedListingConversationParticipant[]
}

export type WantedListing = {
  id: string
  title: string
  details: string | null
  budget: string
  status: WantedListingStatus
  createdAt: string
  updatedAt: string
  fulfilledAt: string | null
  buyer: WantedListingUser
  fulfillingSeller: WantedListingUser | null
  category: WantedListingCategory | null
  conversation: WantedListingConversation | null
}

export type PaginatedWantedListings = {
  data: WantedListing[]
  meta: {
    page: number
    limit: number
    total: number
    totalPages: number
    hasMore: boolean
  }
}

export type WantedListingsQueryParams = {
  page?: number
  limit?: number
  q?: string
  category?: string
  status?: WantedListingStatus
  minBudget?: number
  maxBudget?: number
}

export type WantedListingPayload = {
  title: string
  details?: string
  budget: string
  categoryId?: string
}

export const fetchWantedListings = async (params: WantedListingsQueryParams = {}) => {
  return apiClient<PaginatedWantedListings>('/wanted-listings', { params })
}

export const fetchWantedListingById = async (id: string) => {
  return apiClient<WantedListing>(`/wanted-listings/${id}`)
}

export const createWantedListing = async (payload: WantedListingPayload) => {
  return apiClient<WantedListing>('/wanted-listings', {
    method: 'POST',
    body: payload,
  })
}

export const updateWantedListing = async (id: string, payload: Partial<WantedListingPayload> & { status?: WantedListingStatus }) => {
  return apiClient<WantedListing>(`/wanted-listings/${id}`, {
    method: 'PUT',
    body: payload,
  })
}

export const deleteWantedListing = async (id: string) => {
  return apiClient<void>(`/wanted-listings/${id}`, {
    method: 'DELETE',
  })
}

export type RespondToWantedListingPayload = {
  message?: string
  markFulfilled?: boolean
}

export type RespondToWantedListingResponse = {
  listing: WantedListing
  conversation: WantedListingConversation | null
  createdConversation: boolean
}

export const respondToWantedListing = async (
  id: string,
  payload: RespondToWantedListingPayload,
) => {
  return apiClient<RespondToWantedListingResponse>(`/wanted-listings/${id}/respond`, {
    method: 'POST',
    body: payload,
  })
}
