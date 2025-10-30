import type { AuthUser } from "./auth"

export type ProfileDetails = {
  name: string
  email: string
  location: string | null
  bio: string | null
  notifyNewListings: boolean
  memberSince: string
  updatedAt: string
}

export type ProfileResponse = {
  profile: ProfileDetails
}

export type ProfileUpsertResponse = {
  profile: ProfileDetails
  user: AuthUser
}

export type ProfilePayload = {
  name: string
  location?: string
  bio?: string
  notifyNewListings?: boolean
}
