import { createContext } from "react"
import { type AuthResponse, type AuthUser } from "../types/auth"

export type BannedAccountNotice = {
  isBanned: true
  reason?: string | null
  bannedAt?: string | null
  banExpiresAt?: string | null
  appealUrl?: string | null
}

export type AuthContextValue = {
  user: AuthUser | null
  token: string | null
  isHydrated: boolean
  isAdmin: boolean
  isModerator: boolean
  isBanned: boolean
  banNotice: BannedAccountNotice | null
  login: (auth: AuthResponse) => void
  logout: (options?: { preserveBanNotice?: boolean }) => void
  refreshSession: () => Promise<AuthUser | null>
  clearBanNotice: () => void
}

export const AuthContext = createContext<AuthContextValue | undefined>(undefined)
