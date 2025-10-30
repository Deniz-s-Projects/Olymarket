import { apiClient } from '../lib/apiClient'
import type {
  ProfileAccountInfo,
  ProfileListingSummary,
  ProfileMetric,
  ProfilePreferenceToggle,
  ProfileSavedItemSummary,
} from '../types/profile'

export const fetchProfileAccount = async () => {
  return apiClient<ProfileAccountInfo | null>('/profile/account')
}

export const fetchProfileMetrics = async () => {
  return apiClient<ProfileMetric[]>('/profile/metrics')
}

export const fetchProfileActiveListings = async () => {
  return apiClient<ProfileListingSummary[]>('/profile/listings')
}

export const fetchProfileSavedItems = async () => {
  return apiClient<ProfileSavedItemSummary[]>('/profile/saved-items')
}

export const fetchProfilePreferences = async () => {
  return apiClient<ProfilePreferenceToggle[]>('/profile/preferences')
}
