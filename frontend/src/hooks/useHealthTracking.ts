import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { useAuth } from '../context/useAuth'
import { ApiError } from '../lib/apiClient'
import { fetchHealthTracking, logFluidIntake } from '../services/healthTracking'
import type { HealthTrackingSummary } from '../types/profile'

const SESSION_EXPIRED_MESSAGE = 'Your session has expired. Please sign in again.'
const LOAD_ERROR_MESSAGE =
  'We were unable to load your health tracking data. Please try again later.'
const LOG_ERROR_MESSAGE = 'We were unable to log your intake. Please try again later.'
const AUTH_REQUIRED_MESSAGE = 'You need to sign in to track your health data.'

const getTodayKey = () => new Date().toISOString().split('T')[0]

const normalizeError = (error: unknown, fallbackMessage: string): Error => {
  if (error instanceof ApiError) {
    if (error.status === 401) {
      return new Error(SESSION_EXPIRED_MESSAGE)
    }

    if (error.message && error.message.trim().length > 0) {
      return new Error(error.message)
    }
  }

  if (error instanceof Error) {
    return error
  }

  return new Error(fallbackMessage)
}

type UseHealthTrackingState = {
  summary: HealthTrackingSummary | null
  isLoading: boolean
  error: Error | null
  addIntake: (amount: number) => Promise<void>
}

export const useHealthTracking = (): UseHealthTrackingState => {
  const { isHydrated, token } = useAuth()
  const [summary, setSummary] = useState<HealthTrackingSummary | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const summaryRef = useRef<HealthTrackingSummary | null>(null)

  useEffect(() => {
    summaryRef.current = summary
  }, [summary])

  const loadSummary = useCallback(async () => {
    if (!token) {
      setSummary(null)
      summaryRef.current = null
      setError(null)
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const data = await fetchHealthTracking()
      setSummary(data)
      summaryRef.current = data
    } catch (caughtError) {
      const normalizedError = normalizeError(caughtError, LOAD_ERROR_MESSAGE)
      setSummary(null)
      summaryRef.current = null
      setError(normalizedError)
    } finally {
      setIsLoading(false)
    }
  }, [token])

  useEffect(() => {
    if (!isHydrated) {
      return
    }

    void loadSummary()
  }, [isHydrated, loadSummary])

  const addIntake = useCallback(
    async (amount: number) => {
      if (!token) {
        const unauthorizedError = new Error(AUTH_REQUIRED_MESSAGE)
        setError(unauthorizedError)
        throw unauthorizedError
      }

      const previousSummary = summaryRef.current
      let optimisticSummary = previousSummary

      if (previousSummary) {
        const todayKey = getTodayKey()
        const weeklyHistory = previousSummary.weeklyHistory ?? []
        const hasTodayEntry = weeklyHistory.some(
          (entry) => entry.date === todayKey,
        )

        const updatedHistory = hasTodayEntry
          ? weeklyHistory.map((entry) =>
              entry.date === todayKey
                ? { ...entry, total: entry.total + amount }
                : entry,
            )
          : [{ date: todayKey, total: amount }, ...weeklyHistory]

        optimisticSummary = {
          ...previousSummary,
          todayTotal: previousSummary.todayTotal + amount,
          weeklyHistory: updatedHistory,
        }

        setSummary(optimisticSummary)
        summaryRef.current = optimisticSummary
      }

      setError(null)

      try {
        const updatedSummary = await logFluidIntake(amount)
        setSummary(updatedSummary)
        summaryRef.current = updatedSummary
      } catch (caughtError) {
        const normalizedError = normalizeError(caughtError, LOG_ERROR_MESSAGE)
        setError(normalizedError)
        if (previousSummary) {
          setSummary(previousSummary)
          summaryRef.current = previousSummary
        } else {
          setSummary(null)
          summaryRef.current = null
        }
        throw normalizedError
      }
    },
    [token],
  )

  return useMemo(
    () => ({
      summary,
      isLoading,
      error,
      addIntake,
    }),
    [addIntake, error, isLoading, summary],
  )
}

export default useHealthTracking
