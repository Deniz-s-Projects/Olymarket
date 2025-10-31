import { useCallback, useEffect, useMemo, useState } from 'react'

import { ApiError } from '../lib/apiClient'
import {
  fetchProfileAccount,
  fetchProfileListings,
  fetchProfileMetrics,
  fetchProfilePreferences,
  fetchProfileSavedItems,
  updateProfileAccount,
  updateProfilePreferences,
} from '../services/profile'
import { updateListingStatus as updateListingStatusRequest } from '../services/listings'
import type {
  ProfileAccountInfo,
  ProfileAccountUpdateInput,
  ProfileListingStatus,
  ProfileListingsOverview,
  ProfileMetric,
  ProfilePreferenceKey,
  ProfilePreferenceToggle,
  ProfilePreferenceUpdateInput,
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
  updatePreference: (id: ProfilePreferenceKey, enabled: boolean) => Promise<ProfilePreferenceToggle[]>
  isUpdatingPreference: boolean
  updatePreferenceError: Error | null
  lastUpdatedPreferenceId: ProfilePreferenceKey | null
  updateListingStatus: (listingId: string, status: ProfileListingStatus) => Promise<void>
  isUpdatingListingStatus: boolean
  updateListingStatusError: Error | null
  updatingListingId: string | null
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
  const [isUpdatingPreference, setIsUpdatingPreference] = useState(false)
  const [updatePreferenceError, setUpdatePreferenceError] = useState<Error | null>(null)
  const [lastUpdatedPreferenceId, setLastUpdatedPreferenceId] = useState<ProfilePreferenceKey | null>(null)
  const [isUpdatingListingStatus, setIsUpdatingListingStatus] = useState(false)
  const [updateListingStatusError, setUpdateListingStatusError] = useState<Error | null>(null)
  const [updatingListingId, setUpdatingListingId] = useState<string | null>(null)

  const loadProfile = useCallback(async () => {
    if (!enabled) {
      setData(EMPTY_PROFILE_DATA)
      setError(null)
      setLastUpdatedPreferenceId(null)
      setUpdatePreferenceError(null)
      return
    }

    setIsLoading(true)
    setError(null)
    setLastUpdatedPreferenceId(null)
    setUpdatePreferenceError(null)

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
    } catch (caughtError) {
      const normalizedError =
        caughtError instanceof Error
          ? caughtError
          : new Error('Something went wrong while loading your profile data.')

      setError(normalizedError)
      setData(EMPTY_PROFILE_DATA)
    } finally {
      setIsLoading(false)
    }
  }, [enabled])

  const refreshListings = useCallback(async () => {
    const listings = await resolveOrFallback<ProfileListingsOverview>(fetchProfileListings, {
      groups: [],
      createListingUrl: undefined,
    })

    setData((current) => ({
      ...current,
      listings,
    }))
  }, [])

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
    } catch (caughtError) {
      const normalizedError =
        caughtError instanceof Error
          ? caughtError
          : new Error('We could not update your profile details. Please try again later.')

      setUpdateAccountError(normalizedError)
      throw normalizedError
    } finally {
      setIsUpdatingAccount(false)
    }
  }, [])

  const updatePreference = useCallback(
    async (id: ProfilePreferenceKey, preferenceEnabled: boolean) => {
      const payload: ProfilePreferenceUpdateInput = { [id]: preferenceEnabled }
      setIsUpdatingPreference(true)
      setUpdatePreferenceError(null)
      setLastUpdatedPreferenceId(null)

      try {
        const updatedPreferences = await updateProfilePreferences(payload)

        setData((current) => ({
          ...current,
          preferences: updatedPreferences,
        }))

        setLastUpdatedPreferenceId(id)

        return updatedPreferences
      } catch (caughtError) {
        const normalizedError =
          caughtError instanceof Error
            ? caughtError
            : new Error('We could not update your communication preferences. Please try again later.')

        setUpdatePreferenceError(normalizedError)
        throw normalizedError
      } finally {
        setIsUpdatingPreference(false)
      }
    },
    [],
  )

  const changeListingStatus = useCallback(
    async (listingId: string, status: ProfileListingStatus) => {
      setIsUpdatingListingStatus(true)
      setUpdateListingStatusError(null)
      setUpdatingListingId(listingId)

      try {
        await updateListingStatusRequest(listingId, status)
        await refreshListings()
      } catch (caughtError) {
        const normalizedError =
          caughtError instanceof Error
            ? caughtError
            : new Error('We could not update the listing status. Please try again later.')

        setUpdateListingStatusError(normalizedError)
        throw normalizedError
      } finally {
        setIsUpdatingListingStatus(false)
        setUpdatingListingId(null)
      }
    },
    [refreshListings],
  )

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
      updatePreference,
      isUpdatingPreference,
      updatePreferenceError,
      lastUpdatedPreferenceId,
      updateListingStatus: changeListingStatus,
      isUpdatingListingStatus,
      updateListingStatusError,
      updatingListingId,
    }),
    [
      data,
      error,
      isLoading,
      loadProfile,
      updateAccount,
      isUpdatingAccount,
      updateAccountError,
      updatePreference,
      isUpdatingPreference,
      updatePreferenceError,
      lastUpdatedPreferenceId,
      changeListingStatus,
      isUpdatingListingStatus,
      updateListingStatusError,
      updatingListingId,
    ],
  )
}

export default useProfile
