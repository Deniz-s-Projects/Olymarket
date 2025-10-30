export interface ProfileAccountInfo {
  name?: string
  email?: string
  location?: string
  memberSince?: string
  bio?: string
}

export interface ProfileAccountUpdateInput {
  name?: string
  location?: string
  bio?: string
}

export interface ProfileListingSummary {
  id: string
  title: string
  category: string
  price: number
  currency: string
  status: 'active' | 'sold' | 'draft'
  updatedAt: string
  thumbnailUrl?: string
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

export interface ProfilePreferenceToggle {
  id: string
  label: string
  description?: string
  enabled: boolean
}
