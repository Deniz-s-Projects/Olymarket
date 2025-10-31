export type UserRole = "user" | "moderator" | "admin"

export type ModerationMetadata = {
  bannedAt?: string | null
  banExpiresAt?: string | null
  reviewedAt?: string | null
  reviewedBy?: string | null
  flagCount?: number
  appealUrl?: string | null
  notes?: string | null
}

export type AuthUser = {
  id: string
  email: string
  name: string
  phoneNumber: string
  role: UserRole
  isBanned: boolean
  banReason?: string | null
  moderation?: ModerationMetadata
}

export type AuthResponse = {
  user: AuthUser
  token: string
}

export type AuthCredentials = {
  email: string
  password: string
}

export type RegisterPayload = AuthCredentials & {
  name: string
  phoneNumber: string
}
