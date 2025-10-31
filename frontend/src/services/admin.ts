import { apiClient } from '../lib/apiClient'
import type { Listing, ListingOwner } from './listings'
import type { Report, AdminReportUpdatePayload } from './reports'

// Admin-specific listing type with moderation fields
export type AdminListing = Listing & {
  moderationStatus: 'pending' | 'approved' | 'rejected'
  moderationNotes: string | null
  reviewedAt: string | null
  reviewer: ListingOwner | null
}

// Admin listings response
export type AdminListingsResponse = {
  items: AdminListing[]
  total: number
  page: number
  limit: number
}

// Admin listing update payload
export type AdminListingUpdatePayload = {
  title?: string
  description?: string
  price?: string
  isActive?: boolean
  categoryId?: string
  moderationStatus?: 'pending' | 'approved' | 'rejected'
  moderationNotes?: string
}

// User management types
export type AdminUser = {
  id: string
  email: string
  name: string
  role: 'user' | 'admin'
  isBanned: boolean
  bannedAt: string | null
  banReason: string | null
  listingsCount: number
}

export type BanUserPayload = {
  reason?: string
}

// Fetch all listings with optional filters for admin
export const fetchAdminListings = async (params?: {
  status?: 'pending' | 'approved' | 'rejected'
  owner?: string
  from?: string
  to?: string
  page?: number
  limit?: number
}) => {
  return apiClient<AdminListingsResponse>('/admin/listings', { params })
}

// Update a listing (admin)
export const updateAdminListing = async (
  id: string,
  payload: AdminListingUpdatePayload,
) => {
  return apiClient<AdminListing>(`/admin/listings/${id}`, {
    method: 'PATCH',
    body: payload,
  })
}

// Delete a listing (admin)
export const deleteAdminListing = async (id: string) => {
  return apiClient<void>(`/admin/listings/${id}`, {
    method: 'DELETE',
  })
}

// Fetch all users for admin
export const fetchAdminUsers = async () => {
  return apiClient<AdminUser[]>('/admin/users')
}

// Ban a user
export const banUser = async (id: string, payload?: BanUserPayload) => {
  return apiClient<{ id: string; isBanned: boolean; bannedAt: string; banReason: string | null }>(
    `/admin/users/${id}/ban`,
    {
      method: 'POST',
      body: payload,
    },
  )
}

// Unban a user
export const unbanUser = async (id: string) => {
  return apiClient<{ id: string; isBanned: boolean }>(
    `/admin/users/${id}/unban`,
    {
      method: 'POST',
    },
  )
}

// Reports response type
export type AdminReportsResponse = {
  items: Report[]
  total: number
  page: number
  limit: number
}

// Fetch all reports with optional filters (admin)
export const fetchAdminReports = async (params?: {
  status?: 'pending' | 'under_review' | 'resolved' | 'dismissed'
  reportType?: 'listing' | 'user'
  page?: number
  limit?: number
}) => {
  return apiClient<AdminReportsResponse>('/reports', { params })
}

// Fetch a specific report (admin)
export const fetchAdminReport = async (id: string) => {
  return apiClient<Report>(`/reports/${id}`)
}

// Update a report (admin)
export const updateAdminReport = async (
  id: string,
  payload: AdminReportUpdatePayload,
) => {
  return apiClient<Report>(`/reports/${id}`, {
    method: 'PATCH',
    body: payload,
  })
}

// Delete a report (admin)
export const deleteAdminReport = async (id: string) => {
  return apiClient<void>(`/reports/${id}`, {
    method: 'DELETE',
  })
}
