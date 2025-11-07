import { useCallback, useEffect, useMemo, useState } from 'react'

import { ApiError } from '../lib/apiClient'
import { fetchHealthTrackingSummary, recordHealthIntake } from '../services/healthTracking'
import type { HealthTrackingDaySummary, HealthTrackingSummary } from '../types/health'

const DEFAULT_SUMMARY: HealthTrackingSummary = {
  goal: 3000,
  total: 0,
  history: [],
}

const normalizeSummary = (summary: HealthTrackingSummary | null | undefined): HealthTrackingSummary => {
  if (!summary) {
    return DEFAULT_SUMMARY
  }

  const goal = Number.isFinite(summary.goal) ? summary.goal : DEFAULT_SUMMARY.goal
  const total = Number.isFinite(summary.total) ? summary.total : DEFAULT_SUMMARY.total
  const history = Array.isArray(summary.history)
    ? summary.history
        .filter((entry): entry is HealthTrackingDaySummary =>
          Boolean(entry) && typeof entry.date === 'string' && typeof entry.total === 'number',
        )
        .map((entry) => ({
          date: entry.date,
          total: entry.total,
        }))
    : []

  return {
    goal,
    total,
    history,
  }
}

type UseHealthTrackingOptions = {
  enabled?: boolean
}

type UseHealthTrackingState = {
  summary: HealthTrackingSummary
  isLoading: boolean
  isError: boolean
  error: Error | null
  refetch: () => Promise<void>
  addIntake: (amount: number) => Promise<void>
  isAddingIntake: boolean
  addIntakeError: Error | null
}

export const useHealthTracking = ({ enabled = true }: UseHealthTrackingOptions = {}): UseHealthTrackingState => {
  const [summary, setSummary] = useState<HealthTrackingSummary>(DEFAULT_SUMMARY)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const [isAddingIntake, setIsAddingIntake] = useState(false)
  const [addIntakeError, setAddIntakeError] = useState<Error | null>(null)

  const loadSummary = useCallback(async () => {
    if (!enabled) {
      setSummary(DEFAULT_SUMMARY)
      setError(null)
      setAddIntakeError(null)
      return
    }

    setIsLoading(true)
    setError(null)
    setAddIntakeError(null)

    try {
      const response = await fetchHealthTrackingSummary()
      setSummary(normalizeSummary(response))
    } catch (caughtError) {
      if (caughtError instanceof ApiError && caughtError.status === 404) {
        setSummary(DEFAULT_SUMMARY)
        setError(null)
        return
      }

      const normalizedError =
        caughtError instanceof Error
          ? caughtError
          : new Error('We could not load your health tracking data. Please try again later.')

      setError(normalizedError)
      setSummary(DEFAULT_SUMMARY)
    } finally {
      setIsLoading(false)
    }
  }, [enabled])

  const addIntake = useCallback(
    async (amount: number) => {
      if (!Number.isFinite(amount) || amount <= 0) {
        return
      }

      setIsAddingIntake(true)
      setAddIntakeError(null)

      try {
        const updatedSummary = await recordHealthIntake(amount)
        setSummary(normalizeSummary(updatedSummary))
      } catch (caughtError) {
        const normalizedError =
          caughtError instanceof Error
            ? caughtError
            : new Error('We could not update your intake. Please try again later.')

        setAddIntakeError(normalizedError)
        throw normalizedError
      } finally {
        setIsAddingIntake(false)
      }
    },
    [],
  )

  useEffect(() => {
    void loadSummary()
  }, [loadSummary])

  return useMemo(
    () => ({
      summary,
      isLoading,
      isError: Boolean(error),
      error,
      refetch: loadSummary,
      addIntake,
      isAddingIntake,
      addIntakeError,
    }),
    [summary, isLoading, error, loadSummary, addIntake, isAddingIntake, addIntakeError],
  )
}

export default useHealthTracking
