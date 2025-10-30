import { createContext } from "react"
import { type AuthResponse, type AuthUser } from "../types/auth"

export type AuthContextValue = {
  user: AuthUser | null
  token: string | null
  isHydrated: boolean
  login: (auth: AuthResponse) => void
  logout: () => void
  refreshSession: () => Promise<AuthUser | null>
}

export const AuthContext = createContext<AuthContextValue | undefined>(undefined)
