import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react"

import { AUTH_TOKEN_STORAGE_KEY } from "../constants/auth"
import { subscribeToUnauthorized, unsubscribeFromUnauthorized } from "../lib/authEvents"
import { refreshSessionRequest } from "../services/auth"
import { type AuthResponse, type AuthUser } from "../types/auth"

type AuthContextValue = {
  user: AuthUser | null
  token: string | null
  isHydrated: boolean
  login: (auth: AuthResponse) => void
  logout: () => void
  refreshSession: () => Promise<AuthUser | null>
}

const STORAGE_KEY = "olymarket.auth"

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

type StoredAuth = AuthResponse

export const readStoredAuth = (): StoredAuth | null => {
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

type AuthProviderProps = {
  children: ReactNode
  initialAuth?: StoredAuth | null
}

export const AuthProvider = ({ children, initialAuth }: AuthProviderProps) => {
  const [user, setUser] = useState<AuthUser | null>(initialAuth?.user ?? null)
  const [token, setToken] = useState<string | null>(initialAuth?.token ?? null)
  const [isHydrated, setIsHydrated] = useState<boolean>(Boolean(initialAuth))
  const hasAttemptedRefresh = useRef(false)

  const login = useCallback((auth: AuthResponse) => {
    setUser(auth.user)
    setToken(auth.token)
    persistAuth(auth)
    setIsHydrated(true)
  }, [])

  const logout = useCallback(() => {
    setUser(null)
    setToken(null)
    persistAuth(null)
    setIsHydrated(true)
  }, [])

  const refreshSession = useCallback(async () => {
    if (!token) {
      setIsHydrated(true)
      return null
    }

    try {
      const currentUser = await refreshSessionRequest()
      const nextAuth: StoredAuth = { user: currentUser, token }
      setUser(currentUser)
      persistAuth(nextAuth)
      setIsHydrated(true)
      return currentUser
    } catch (error) {
      logout()
      throw error
    }
  }, [logout, token])

  useEffect(() => {
    if (!hasAttemptedRefresh.current) {
      hasAttemptedRefresh.current = true
      const stored = initialAuth ?? readStoredAuth()
      if (stored && (!user || !token)) {
        setUser(stored.user)
        setToken(stored.token)
      }
      refreshSession().catch(() => undefined)
    }
  }, [initialAuth, refreshSession, token, user])

  useEffect(() => {
    const handleUnauthorized = () => {
      logout()
    }

    subscribeToUnauthorized(handleUnauthorized)
    return () => {
      unsubscribeFromUnauthorized(handleUnauthorized)
    }
  }, [logout])

  const value = useMemo(
    () => ({
      user,
      token,
      isHydrated,
      login,
      logout,
      refreshSession,
    }),
    [isHydrated, login, logout, refreshSession, token, user]
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
