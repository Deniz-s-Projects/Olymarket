export interface ProfileAccountInfo {
  name?: string
  email?: string
  location?: string
  memberSince?: string
  bio?: string
  role?: string
  moderation?: {
    flagCount?: number
    reviewedAt?: string | null
    notes?: string | null
  }
}

export interface ProfileAccountUpdateInput {
  name?: string
  location?: string
  bio?: string
}

export type ProfileListingStatus = 'active' | 'sold' | 'draft'

export interface ProfileListingSummary {
  id: string
  title: string
  category: string
  price: number
  currency: string
  status: ProfileListingStatus
  updatedAt: string
  thumbnailUrl?: string
  availability?: string
  preferredContactMethod?: string
}

export interface ProfileListingActionLinks {
  editUrl: string
  archiveUrl?: string
  viewUrl?: string
  restoreUrl?: string
  markSoldUrl?: string
}

export interface ProfileListingWithActions extends ProfileListingSummary {
  actions: ProfileListingActionLinks
  statusTransitions?: ProfileListingStatusTransition[]
}

export interface ProfileListingStatusTransition {
  label: string
  status: ProfileListingStatus
}

export interface ProfileListingStatusEmptyStateAction {
  label: string
  url: string
}

export interface ProfileListingStatusEmptyState {
  title: string
  description: string
  action?: ProfileListingStatusEmptyStateAction
}

export interface ProfileListingStatusGroup {
  id: ProfileListingStatus
  label: string
  description?: string
  listings: ProfileListingWithActions[]
  emptyState?: ProfileListingStatusEmptyState
}

export interface ProfileListingsOverview {
  groups: ProfileListingStatusGroup[]
  createListingUrl?: string
}

export interface ProfileSavedItemSummary {
  id: string
  title: string
  category: string
  price: number
  currency: string
  favoritedAt: string
  thumbnailUrl?: string
}

export interface ProfileMetric {
  label: string
  value: string | number
}

export type ProfilePreferenceKey = 'marketplaceAlerts' | 'savedSearchDigests' | 'communityNews'

export interface ProfilePreferenceToggle {
  id: ProfilePreferenceKey
  label: string
  description?: string
  enabled: boolean
}

export type ProfilePreferenceUpdateInput = Partial<Record<ProfilePreferenceKey, boolean>>
