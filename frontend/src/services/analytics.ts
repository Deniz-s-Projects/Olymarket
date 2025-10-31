import { apiClient } from '../lib/apiClient'

export type ListingAnalytics = {
  id: string
  title: string
  views: number
  saves: number
  conversionRate: number
  createdAt: string
  updatedAt: string
}

export type ListingsAnalyticsResponse = {
  totals: {
    views: number
    saves: number
    conversionRate: number
    listingCount: number
  }
  listings: ListingAnalytics[]
}

export const fetchListingsAnalytics = async () => {
  return apiClient<ListingsAnalyticsResponse>('/analytics/listings')
}

export const fetchListingAnalytics = async (id: string) => {
  return apiClient<ListingAnalytics>(`/analytics/listings/${id}`)
}
