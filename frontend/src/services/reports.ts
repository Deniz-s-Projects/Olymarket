import { apiClient } from '../lib/apiClient'

export type Report = {
  id: string
  reportType: 'listing' | 'user'
  reason: string
  description: string | null
  status: 'pending' | 'under_review' | 'resolved' | 'dismissed'
  resolutionNotes: string | null
  resolvedAt: string | null
  createdAt: string
  updatedAt: string
  reporter: {
    id: string
    name: string
    email: string
  }
  reportedUser: {
    id: string
    name: string
    email: string
  } | null
  reportedListing: {
    id: string
    title: string
    owner: {
      id: string
      name: string
    }
  } | null
  reviewedBy: {
    id: string
    name: string
  } | null
}

export type ReportPayload = {
  reportType: 'listing' | 'user'
  reason: string
  description?: string
  reportedListingId?: string
  reportedUserId?: string
}

export type AdminReportUpdatePayload = {
  status?: 'pending' | 'under_review' | 'resolved' | 'dismissed'
  resolutionNotes?: string
}

export const createReport = async (payload: ReportPayload, token: string) => {
  return apiClient<Report>('/reports', {
    method: 'POST',
    body: payload,
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })
}

export const fetchMyReports = async (token: string) => {
  return apiClient<Report[]>('/reports/my', {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })
}
