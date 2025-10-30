import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react"

import { subscribeToUnauthorized, unsubscribeFromUnauthorized } from "../lib/authEvents"
import { refreshSessionRequest } from "../services/auth"
import { type AuthResponse, type AuthUser } from "../types/auth"
import { AuthContext } from "./AuthContext.shared"
import { persistAuth, readStoredAuth, type StoredAuth } from "./authStorage"

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
