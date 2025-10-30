import { apiClient } from "../lib/apiClient"
import type { ListingCategory, ListingOwner } from "./listings"

export type ModerationStatus = "pending" | "approved" | "rejected"

export type AdminListingModeration = {
  status: ModerationStatus
  notes: string | null
  reviewedAt?: string | null
  reviewedBy?: {
    id: string
    name: string
    email: string
  } | null
}

export type AdminListingRow = {
  id: string
  title: string
  description: string
  price: string
  isActive: boolean
  createdAt: string
  updatedAt: string
  owner: ListingOwner
  category: ListingCategory | null
  availability: string
  contactPreference: string
  moderation: AdminListingModeration
}

export type ListingModerationPayload = {
  title: string
  description: string
  price: string
  isActive: boolean
  categoryId?: string | null
  availability: string
  contactPreference: string
  moderationStatus: ModerationStatus
  moderationNotes?: string | null
}

export type ListingModerationFilters = {
  status?: ModerationStatus | "all"
  search?: string
}

export const fetchAdminListings = async (filters: ListingModerationFilters = {}) => {
  return apiClient<AdminListingRow[]>("/admin/listings", {
    params: {
      status: filters.status === "all" ? undefined : filters.status,
      search: filters.search,
    },
  })
}

export const updateAdminListing = async (id: string, payload: ListingModerationPayload) => {
  return apiClient<AdminListingRow>(`/admin/listings/${id}`, {
    method: "PUT",
    body: payload,
  })
}

export const approveListing = async (
  id: string,
  payload: Pick<ListingModerationPayload, "moderationNotes"> = {},
) => {
  return apiClient<AdminListingRow>(`/admin/listings/${id}/approve`, {
    method: "POST",
    body: payload,
  })
}

export const rejectListing = async (
  id: string,
  payload: Pick<ListingModerationPayload, "moderationNotes">,
) => {
  return apiClient<AdminListingRow>(`/admin/listings/${id}/reject`, {
    method: "POST",
    body: payload,
  })
}

export const deleteListing = async (id: string) => {
  return apiClient<void>(`/admin/listings/${id}`, {
    method: "DELETE",
  })
}

export type AdminUserRow = {
  id: string
  name: string
  email: string
  role: "member" | "moderator" | "admin"
  joinedAt: string
  isBanned: boolean
  banReason?: string | null
  banExpiresAt?: string | null
}

export type BanUserPayload = {
  reason: string
  expiresAt?: string | null
}

export const fetchAdminUsers = async () => {
  return apiClient<AdminUserRow[]>("/admin/users")
}

export const banUser = async (id: string, payload: BanUserPayload) => {
  return apiClient<AdminUserRow>(`/admin/users/${id}/ban`, {
    method: "POST",
    body: payload,
  })
}

export const unbanUser = async (id: string) => {
  return apiClient<AdminUserRow>(`/admin/users/${id}/ban`, {
    method: "DELETE",
  })
}
