import { apiClient } from '../lib/apiClient'
import type { HealthTrackingSummary } from '../types/health'

export const fetchHealthTrackingSummary = async () => {
  return apiClient<HealthTrackingSummary>('/profile/health-tracking')
}

export const recordHealthIntake = async (amount: number) => {
  return apiClient<HealthTrackingSummary>('/profile/health-tracking/intake', {
    method: 'POST',
    body: { amount },
  })
}
