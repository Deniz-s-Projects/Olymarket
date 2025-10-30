import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react"

import { AUTH_TOKEN_STORAGE_KEY } from "../constants/auth"
import { type AuthResponse, type AuthUser } from "../types/auth"

type AuthContextValue = {
  user: AuthUser | null
  token: string | null
  login: (auth: AuthResponse) => void
  logout: () => void
}

const STORAGE_KEY = "olymarket.auth"

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

type StoredAuth = AuthResponse

const readStoredAuth = (): StoredAuth | null => {
  if (typeof window === "undefined") {
    return null
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as StoredAuth
    if (!parsed?.user || !parsed?.token) return null
    const storedToken = window.localStorage.getItem(AUTH_TOKEN_STORAGE_KEY)
    if (!storedToken || storedToken !== parsed.token) {
      window.localStorage.setItem(AUTH_TOKEN_STORAGE_KEY, parsed.token)
    }
    return parsed
  } catch (error) {
    console.warn("Failed to parse stored auth", error)
    return null
  }
}

const persistAuth = (auth: StoredAuth | null) => {
  if (typeof window === "undefined") {
    return
  }

  if (!auth) {
    window.localStorage.removeItem(STORAGE_KEY)
    window.localStorage.removeItem(AUTH_TOKEN_STORAGE_KEY)
    return
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(auth))
  window.localStorage.setItem(AUTH_TOKEN_STORAGE_KEY, auth.token)
}

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<AuthUser | null>(() => readStoredAuth()?.user ?? null)
  const [token, setToken] = useState<string | null>(() => readStoredAuth()?.token ?? null)

  const login = useCallback((auth: AuthResponse) => {
    setUser(auth.user)
    setToken(auth.token)
    persistAuth(auth)
  }, [])

  const logout = useCallback(() => {
    setUser(null)
    setToken(null)
    persistAuth(null)
  }, [])

  const value = useMemo(
    () => ({
      user,
      token,
      login,
      logout,
    }),
    [login, logout, token, user]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
