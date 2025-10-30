import type {
  AuthResponse,
  AuthCredentials,
  RegisterPayload,
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

const handleResponse = async (response: Response): Promise<AuthResponse> => {
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

