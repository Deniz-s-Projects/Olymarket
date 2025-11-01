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
import { AuthContext, type BannedAccountNotice } from "./AuthContext.shared"
import { persistAuth, readStoredAuth, type StoredAuth } from "./authStorage"

type AuthProviderProps = {
  children: ReactNode
  initialAuth?: StoredAuth | null
}

export const AuthProvider = ({ children, initialAuth }: AuthProviderProps) => {
  const [user, setUser] = useState<AuthUser | null>(initialAuth?.user ?? null)
  const [token, setToken] = useState<string | null>(initialAuth?.token ?? null)
  const [isHydrated, setIsHydrated] = useState<boolean>(Boolean(initialAuth))
  const [banNotice, setBanNotice] = useState<BannedAccountNotice | null>(null)
  const hasAttemptedRefresh = useRef(false)

  const resetAuthState = useCallback(() => {
    setUser(null)
    setToken(null)
    persistAuth(null)
  }, [])

  const clearBanNotice = useCallback(() => {
    setBanNotice(null)
  }, [])

  const logout = useCallback(
    (options?: { preserveBanNotice?: boolean }) => {
      resetAuthState()
      if (!options?.preserveBanNotice) {
        clearBanNotice()
      }
      setIsHydrated(true)
    },
    [clearBanNotice, resetAuthState]
  )

  const applyBannedState = useCallback(
    (bannedUser: AuthUser) => {
      setBanNotice({
        isBanned: true,
        reason: bannedUser.banReason ?? bannedUser.moderation?.notes ?? null,
        bannedAt: bannedUser.moderation?.bannedAt ?? null,
        banExpiresAt: bannedUser.moderation?.banExpiresAt ?? null,
        appealUrl: bannedUser.moderation?.appealUrl ?? null,
      })
      resetAuthState()
      setIsHydrated(true)
    },
    [resetAuthState]
  )

  const login = useCallback(
    (auth: AuthResponse) => {
      if (auth.user.isBanned) {
        applyBannedState(auth.user)
        return
      }

      setUser(auth.user)
      setToken(auth.token)
      clearBanNotice()
      persistAuth(auth)
      setIsHydrated(true)
    },
    [applyBannedState, clearBanNotice]
  )

  const refreshSession = useCallback(async () => {
    if (!token) {
      setIsHydrated(true)
      return null
    }

    try {
      const currentUser = await refreshSessionRequest()

      if (currentUser.isBanned) {
        applyBannedState(currentUser)
        return null
      }

      const nextAuth: StoredAuth = { user: currentUser, token }
      setUser(currentUser)
      clearBanNotice()
      persistAuth(nextAuth)
      setIsHydrated(true)
      return currentUser
    } catch (error) {
      logout()
      throw error
    }
  }, [applyBannedState, clearBanNotice, logout, token])

  useEffect(() => {
    if (!hasAttemptedRefresh.current) {
      hasAttemptedRefresh.current = true
      const stored = initialAuth ?? readStoredAuth()
      if (stored && (!user || !token)) {
        if (stored.user.isBanned) {
          applyBannedState(stored.user)
        } else {
          setUser(stored.user)
          setToken(stored.token)
          clearBanNotice()
        }
      }
      refreshSession().catch(() => undefined)
    }
  }, [applyBannedState, clearBanNotice, initialAuth, refreshSession, token, user])

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
      isAdmin: user?.role === "admin",
      isModerator: user?.role === "admin" || user?.role === "moderator",
      isBanned: Boolean(user?.isBanned || banNotice?.isBanned),
      banNotice,
      login,
      logout,
      refreshSession,
      clearBanNotice,
    }),
    [banNotice, clearBanNotice, isHydrated, login, logout, refreshSession, token, user]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
