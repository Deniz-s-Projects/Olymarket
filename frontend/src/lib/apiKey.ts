import { API_KEY, API_KEY_HEADER } from '../constants/security'

let hasWarnedAboutMissingApiKey = false

export const applyApiKeyHeader = (headers: Headers): Headers => {
  if (!API_KEY) {
    if (!hasWarnedAboutMissingApiKey) {
      console.warn(
        'VITE_API_KEY is not configured. Requests to the API will fail unless the shared key is provided.',
      )
      hasWarnedAboutMissingApiKey = true
    }

    return headers
  }

  if (!headers.has(API_KEY_HEADER)) {
    headers.set(API_KEY_HEADER, API_KEY)
  }

  return headers
}
