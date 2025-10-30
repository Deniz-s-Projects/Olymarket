import { apiClient } from "../lib/apiClient"
import type {
  AuthResponse,
  AuthCredentials,
  RegisterPayload,
  AuthUser,
} from "../types/auth"

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:4000"

export class AuthServiceError extends Error {
  status?: number
  code?: string
  details?: Record<string, unknown>

  constructor(
    message: string,
    status?: number,
    code?: string,
    details?: Record<string, unknown>
  ) {
    super(message)
    this.name = "AuthServiceError"
    this.status = status
    this.code = code
    this.details = details
  }
}

type AuthErrorResponse = Partial<AuthResponse> & {
    message?: string
    code?: string
    reason?: string
    banReason?: string
    bannedAt?: string | null
    banExpiresAt?: string | null
    appealUrl?: string | null
    isBanned?: boolean
    details?: Record<string, unknown>
  } & {
    moderation?: {
      notes?: string | null
      bannedAt?: string | null
      banExpiresAt?: string | null
      appealUrl?: string | null
    }
  }

const handleResponse = async (response: Response): Promise<AuthResponse> => {
  const data = (await response.json().catch(() => ({}))) as AuthErrorResponse

  if (!response.ok) {
    const banReason =
      data?.banReason ??
      data?.reason ??
      (typeof data?.details?.banReason === "string"
        ? (data.details.banReason as string)
        : undefined) ??
      data?.moderation?.notes ??
      undefined

    const isBannedResponse = Boolean(
      data?.isBanned ||
        data?.moderation ||
        data?.code === "USER_BANNED" ||
        response.status === 403
    )

    const details: Record<string, unknown> = {
      ...((data?.details && typeof data.details === "object"
        ? data.details
        : {}) as Record<string, unknown>),
      banReason,
      bannedAt: data?.moderation?.bannedAt ?? data?.bannedAt ?? null,
      banExpiresAt: data?.moderation?.banExpiresAt ?? data?.banExpiresAt ?? null,
      appealUrl: data?.moderation?.appealUrl ?? data?.appealUrl ?? null,
      isBanned: isBannedResponse,
    }

    const code = data?.code ?? (isBannedResponse ? "USER_BANNED" : undefined)
    const message =
      isBannedResponse
        ? banReason
          ? `Your account has been suspended: ${banReason}`
          : "Your account has been suspended. Please contact support."
        : data?.message ?? "Authentication request failed"

    throw new AuthServiceError(message, response.status, code, details)
  }

  if (!data?.user || !data?.token) {
    throw new AuthServiceError("Malformed authentication response")
  }

  if (typeof data.user.role !== "string" || typeof data.user.isBanned !== "boolean") {
    throw new AuthServiceError("Malformed authentication response")
  }

  return data as AuthResponse
}

export const register = async (payload: RegisterPayload): Promise<AuthResponse> => {
  const response = await fetch(`${API_BASE_URL}/auth/register`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  })

  return handleResponse(response)
}

export const login = async (payload: AuthCredentials): Promise<AuthResponse> => {
  const response = await fetch(`${API_BASE_URL}/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  })

  return handleResponse(response)
}

export const refreshSessionRequest = async (): Promise<AuthUser> => {
  const response = await apiClient<{ user?: AuthUser }>("/auth/me")

  if (!response?.user) {
    throw new AuthServiceError("Malformed authentication response")
  }

  return response.user
}

