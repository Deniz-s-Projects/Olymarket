import { apiClient } from "../lib/apiClient"
import type {
  ProfilePayload,
  ProfileResponse,
  ProfileUpsertResponse,
} from "../types/profile"

const normalizeProfilePayload = (payload: ProfilePayload) => {
  const normalized: Record<string, unknown> = {
    name: payload.name,
  }

  if (typeof payload.location !== "undefined") {
    normalized.location = payload.location
  }

  if (typeof payload.bio !== "undefined") {
    normalized.bio = payload.bio
  }

  if (typeof payload.notifyNewListings !== "undefined") {
    normalized.notifyNewListings = payload.notifyNewListings
  }

  return normalized
}

export const fetchProfile = async () => {
  return apiClient<ProfileResponse>("/profile")
}

export const upsertProfile = async (payload: ProfilePayload) => {
  return apiClient<ProfileUpsertResponse>("/profile", {
    method: "PUT",
    body: normalizeProfilePayload(payload),
  })
}
