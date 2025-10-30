import { AUTH_TOKEN_STORAGE_KEY } from '../constants/auth'

const normalizeBaseUrl = (value: string) => value.replace(/\/$/, '')

const defaultBaseUrl = normalizeBaseUrl(
  import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3000',
)

const buildUrl = (path: string, params?: Record<string, string | number | boolean | undefined>) => {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`
  const url = new URL(`${defaultBaseUrl}${normalizedPath}`)

  if (params) {
    Object.entries(params).forEach(([key, rawValue]) => {
      if (typeof rawValue === 'undefined' || rawValue === null) {
        return
      }
      url.searchParams.set(key, String(rawValue))
    })
  }

  return url.toString()
}

const getAuthToken = (): string | null => {
  if (typeof window === 'undefined') {
    return null
  }

  try {
    return window.localStorage.getItem(AUTH_TOKEN_STORAGE_KEY)
  } catch (error) {
    console.warn('Unable to access auth token from storage.', error)
    return null
  }
}

export type ApiRequestOptions = Omit<RequestInit, 'body'> & {
  body?: unknown
  params?: Record<string, string | number | boolean | undefined>
  skipAuth?: boolean
}

const prepareBody = (body: unknown, headers: Headers): BodyInit | undefined => {
  if (body === null || typeof body === 'undefined') {
    return undefined
  }

  if (body instanceof FormData || body instanceof Blob || body instanceof ArrayBuffer) {
    return body
  }

  if (typeof body === 'string') {
    if (!headers.has('Content-Type')) {
      headers.set('Content-Type', 'text/plain;charset=UTF-8')
    }
    return body
  }

  if (!headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json')
  }

  return JSON.stringify(body)
}

export class ApiError extends Error {
  status: number

  constructor(message: string, status: number) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

export async function apiClient<T>(path: string, options: ApiRequestOptions = {}): Promise<T> {
  const { params, headers: customHeaders, body, skipAuth, ...rest } = options
  const url = buildUrl(path, params)

  const headers = new Headers(customHeaders)
  if (!headers.has('Accept')) {
    headers.set('Accept', 'application/json')
  }

  const token = skipAuth ? null : getAuthToken()
  if (token) {
    headers.set('Authorization', `Bearer ${token}`)
  }

  const preparedBody = prepareBody(body, headers)

  const response = await fetch(url, {
    method: rest.method ?? 'GET',
    ...rest,
    headers,
    body: preparedBody,
  })

  const isJsonResponse = response.headers.get('content-type')?.includes('application/json') ?? false

  if (!response.ok) {
    let message = `Request failed with status ${response.status}`

    if (isJsonResponse) {
      try {
        const payload = (await response.json()) as { message?: string }
        if (payload?.message) {
          message = payload.message
        }
      } catch (error) {
        console.error('Failed to parse error response', error)
      }
    }

    throw new ApiError(message, response.status)
  }

  if (response.status === 204) {
    return undefined as T
  }

  if (!isJsonResponse) {
    return (await response.text()) as T
  }

  return (await response.json()) as T
}

export const API_BASE_URL = defaultBaseUrl
