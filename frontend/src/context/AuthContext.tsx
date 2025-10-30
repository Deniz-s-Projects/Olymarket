import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react"

import { type AuthResponse, type AuthUser } from "../types/auth"

type AuthContextValue = {
  user: AuthUser | null
  token: string | null
  login: (auth: AuthResponse) => void
  logout: () => void
}

const STORAGE_KEY = "olymarket.auth"

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

type StoredAuth = {
  user: AuthUser
  token: string
}

const readStoredAuth = (): StoredAuth | null => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as StoredAuth
    if (!parsed?.user || !parsed?.token) return null
    return parsed
  } catch (error) {
    console.warn("Failed to parse stored auth", error)
    return null
  }
}

const persistAuth = (auth: StoredAuth | null) => {
  if (!auth) {
    localStorage.removeItem(STORAGE_KEY)
    return
  }

  localStorage.setItem(STORAGE_KEY, JSON.stringify(auth))
}

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [token, setToken] = useState<string | null>(null)

  useEffect(() => {
    const stored = readStoredAuth()
    if (stored) {
      setUser(stored.user)
      setToken(stored.token)
    }
  }, [])

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
