import { useCallback, useEffect, useMemo, useState } from 'react'

import { announcementsService } from '../services/announcements'
import type { Announcement } from '../types/announcements'

type UseAnnouncementsOptions = {
  enabled?: boolean
}

type UseAnnouncementsState = {
  announcements: Announcement[]
  isLoading: boolean
  isError: boolean
  error: Error | null
  communityNewsEnabled: boolean
  refetch: () => Promise<void>
}

const EMPTY_LIST: Announcement[] = []

export const useAnnouncements = (
  { enabled = true }: UseAnnouncementsOptions = {}
): UseAnnouncementsState => {
  const [announcements, setAnnouncements] = useState<Announcement[]>(EMPTY_LIST)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const [communityNewsEnabled, setCommunityNewsEnabled] = useState(false)

  const loadAnnouncements = useCallback(async () => {
    if (!enabled) {
      setAnnouncements(EMPTY_LIST)
      setCommunityNewsEnabled(false)
      setError(null)
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const response = await announcementsService.getAnnouncements()
      setAnnouncements(response.data ?? EMPTY_LIST)
      setCommunityNewsEnabled(Boolean(response.meta?.communityNewsEnabled))
    } catch (announcementError) {
      const normalizedError =
        announcementError instanceof Error
          ? announcementError
          : new Error('Unable to load announcements at this time.')

      setError(normalizedError)
      setAnnouncements(EMPTY_LIST)
    } finally {
      setIsLoading(false)
    }
  }, [enabled])

  useEffect(() => {
    if (!enabled) {
      return
    }

    void loadAnnouncements()
  }, [enabled, loadAnnouncements])

  return useMemo(
    () => ({
      announcements,
      isLoading,
      isError: Boolean(error),
      error,
      communityNewsEnabled,
      refetch: loadAnnouncements,
    }),
    [announcements, communityNewsEnabled, error, isLoading, loadAnnouncements]
  )
}

export default useAnnouncements
