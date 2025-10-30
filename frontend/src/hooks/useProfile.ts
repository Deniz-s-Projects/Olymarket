import { useCallback, useEffect, useMemo, useState } from 'react'

import { ApiError } from '../lib/apiClient'
import {
  fetchProfileAccount,
  fetchProfileListings,
  fetchProfileMetrics,
  fetchProfilePreferences,
  fetchProfileSavedItems,
  updateProfileAccount,
} from '../services/profile'
import type {
  ProfileAccountInfo,
  ProfileAccountUpdateInput,
  ProfileListingsOverview,
  ProfileMetric,
  ProfilePreferenceToggle,
  ProfileSavedItemSummary,
} from '../types/profile'

type ProfileData = {
  account: ProfileAccountInfo | null
  metrics: ProfileMetric[]
  listings: ProfileListingsOverview
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
  updateAccount: (input: ProfileAccountUpdateInput) => Promise<ProfileAccountInfo>
  isUpdatingAccount: boolean
  updateAccountError: Error | null
}

const EMPTY_PROFILE_DATA: ProfileData = {
  account: null,
  metrics: [],
  listings: { groups: [], createListingUrl: undefined },
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
  const [isUpdatingAccount, setIsUpdatingAccount] = useState(false)
  const [updateAccountError, setUpdateAccountError] = useState<Error | null>(null)

  const loadProfile = useCallback(async () => {
    if (!enabled) {
      setData(EMPTY_PROFILE_DATA)
      setError(null)
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const [account, metrics, listings, savedItems, preferences] = await Promise.all([
        resolveOrFallback<ProfileAccountInfo | null>(fetchProfileAccount, null),
        resolveOrFallback<ProfileMetric[]>(fetchProfileMetrics, []),
        resolveOrFallback<ProfileListingsOverview>(fetchProfileListings, {
          groups: [],
          createListingUrl: undefined,
        }),
        resolveOrFallback<ProfileSavedItemSummary[]>(fetchProfileSavedItems, []),
        resolveOrFallback<ProfilePreferenceToggle[]>(fetchProfilePreferences, []),
      ])

      setData({
        account,
        metrics,
        listings,
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

  const updateAccount = useCallback(async (input: ProfileAccountUpdateInput) => {
    setIsUpdatingAccount(true)
    setUpdateAccountError(null)

    try {
      const updatedAccount = await updateProfileAccount(input)

      setData((current) => ({
        ...current,
        account: current.account ? { ...current.account, ...updatedAccount } : updatedAccount,
      }))

      return updatedAccount
    } catch (error) {
      const normalizedError =
        error instanceof Error
          ? error
          : new Error('We could not update your profile details. Please try again later.')

      setUpdateAccountError(normalizedError)
      throw normalizedError
    } finally {
      setIsUpdatingAccount(false)
    }
  }, [])

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
      updateAccount,
      isUpdatingAccount,
      updateAccountError,
    }),
    [data, error, isLoading, loadProfile, updateAccount, isUpdatingAccount, updateAccountError],
  )
}

export default useProfile
