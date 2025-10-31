import { AUTH_TOKEN_STORAGE_KEY } from "../constants/auth"
import { type AuthResponse } from "../types/auth"

const STORAGE_KEY = "olymarket.auth"

export type StoredAuth = AuthResponse

const isValidStoredAuth = (value: unknown): value is StoredAuth => {
  if (!value || typeof value !== "object") {
    return false
  }

  const maybe = value as Partial<StoredAuth>
  const maybeUser = maybe?.user as Partial<StoredAuth["user"]> | undefined

  if (!maybeUser || typeof maybe?.token !== "string") {
    return false
  }

  return (
    typeof maybeUser.id === "number" &&
      typeof maybeUser.email === "string" &&
      typeof maybeUser.name === "string" &&
      typeof maybeUser.phoneNumber === "string" &&
      typeof maybeUser.role === "string" &&
      typeof maybeUser.isBanned === "boolean"
  )
}

export const readStoredAuth = (): StoredAuth | null => {
  if (typeof window === "undefined") {
    return null
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (!isValidStoredAuth(parsed)) return null

    const storedAuth = parsed as StoredAuth
    const storedToken = window.localStorage.getItem(AUTH_TOKEN_STORAGE_KEY)
    if (!storedToken || storedToken !== storedAuth.token) {
      window.localStorage.setItem(AUTH_TOKEN_STORAGE_KEY, storedAuth.token)
    }
    return storedAuth
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
