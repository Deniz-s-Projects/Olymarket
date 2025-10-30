import { apiClient } from "../lib/apiClient"
import type {
  AuthResponse,
  AuthCredentials,
  RegisterPayload,
  AuthUser,
  RegisterResponse,
  VerifyEmailPayload,
} from "../types/auth"

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:4000"

export class AuthServiceError extends Error {
  status?: number

  constructor(message: string, status?: number) {
    super(message)
    this.name = "AuthServiceError"
    this.status = status
  }
}

const handleAuthResponse = async (response: Response): Promise<AuthResponse> => {
  const data = (await response.json().catch(() => ({}))) as Partial<AuthResponse> & {
    message?: string
  }

  if (!response.ok) {
    const message = data?.message ?? "Authentication request failed"
    throw new AuthServiceError(message, response.status)
  }

  if (!data?.user || !data?.token) {
    throw new AuthServiceError("Malformed authentication response")
  }

  return data as AuthResponse
}

const handleMessageResponse = async (
  response: Response,
): Promise<RegisterResponse> => {
  const data = (await response.json().catch(() => ({}))) as Partial<RegisterResponse> & {
    message?: string
  }

  if (!response.ok) {
    const message = data?.message ?? "Authentication request failed"
    throw new AuthServiceError(message, response.status)
  }

  if (!data?.message) {
    throw new AuthServiceError("Malformed authentication response")
  }

  return { message: data.message }
}

export const register = async (payload: RegisterPayload): Promise<RegisterResponse> => {
  const response = await fetch(`${API_BASE_URL}/auth/register`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  })

  return handleMessageResponse(response)
}

export const login = async (payload: AuthCredentials): Promise<AuthResponse> => {
  const response = await fetch(`${API_BASE_URL}/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  })

  return handleAuthResponse(response)
}

export const verifyEmail = async (payload: VerifyEmailPayload): Promise<AuthResponse> => {
  const response = await fetch(`${API_BASE_URL}/auth/verify`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  })

  return handleAuthResponse(response)
}

export const refreshSessionRequest = async (): Promise<AuthUser> => {
  const response = await apiClient<{ user?: AuthUser }>("/auth/me")

  if (!response?.user) {
    throw new AuthServiceError("Malformed authentication response")
  }

  return response.user
}

