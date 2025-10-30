import { AUTH_TOKEN_STORAGE_KEY } from "../constants/auth"
import { type AuthResponse } from "../types/auth"

const STORAGE_KEY = "olymarket.auth"

export type StoredAuth = AuthResponse

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

export const persistAuth = (auth: StoredAuth | null) => {
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
