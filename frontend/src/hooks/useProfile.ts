import { useCallback, useEffect, useMemo, useState } from 'react'

import { ApiError } from '../lib/apiClient'
import {
  fetchProfileAccount,
  fetchProfileActiveListings,
  fetchProfileMetrics,
  fetchProfilePreferences,
  fetchProfileSavedItems,
} from '../services/profile'
import type {
  ProfileAccountInfo,
  ProfileListingSummary,
  ProfileMetric,
  ProfilePreferenceToggle,
  ProfileSavedItemSummary,
} from '../types/profile'

type ProfileData = {
  account: ProfileAccountInfo | null
  metrics: ProfileMetric[]
  activeListings: ProfileListingSummary[]
  savedItems: ProfileSavedItemSummary[]
  preferences: ProfilePreferenceToggle[]
}

type UseProfileOptions = {
  enabled?: boolean
}

type UseProfileState = ProfileData & {
  isLoading: boolean
  isError: boolean
  error: Error | null
  refetch: () => Promise<void>
}

const EMPTY_PROFILE_DATA: ProfileData = {
  account: null,
  metrics: [],
  activeListings: [],
  savedItems: [],
  preferences: [],
}

const resolveOrFallback = async <T>(operation: () => Promise<T>, fallback: T): Promise<T> => {
  try {
    const result = await operation()

    if (typeof result === 'undefined' || result === null) {
      return fallback
    }

    return result
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      return fallback
    }

    throw error
  }
}

export const useProfile = ({ enabled = true }: UseProfileOptions = {}): UseProfileState => {
  const [data, setData] = useState<ProfileData>(EMPTY_PROFILE_DATA)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const loadProfile = useCallback(async () => {
    if (!enabled) {
      setData(EMPTY_PROFILE_DATA)
      setError(null)
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const [account, metrics, activeListings, savedItems, preferences] = await Promise.all([
        resolveOrFallback<ProfileAccountInfo | null>(fetchProfileAccount, null),
        resolveOrFallback<ProfileMetric[]>(fetchProfileMetrics, []),
        resolveOrFallback<ProfileListingSummary[]>(fetchProfileActiveListings, []),
        resolveOrFallback<ProfileSavedItemSummary[]>(fetchProfileSavedItems, []),
        resolveOrFallback<ProfilePreferenceToggle[]>(fetchProfilePreferences, []),
      ])

      setData({
        account,
        metrics,
        activeListings,
        savedItems,
        preferences,
      })
    } catch (error) {
      const normalizedError =
        error instanceof Error
          ? error
          : new Error('Something went wrong while loading your profile data.')

      setError(normalizedError)
      setData(EMPTY_PROFILE_DATA)
    } finally {
      setIsLoading(false)
    }
  }, [enabled])

  useEffect(() => {
    loadProfile()
  }, [loadProfile])

  return useMemo(
    () => ({
      ...data,
      isLoading,
      isError: Boolean(error),
      error,
      refetch: loadProfile,
    }),
    [data, error, isLoading, loadProfile],
  )
}

export default useProfile
