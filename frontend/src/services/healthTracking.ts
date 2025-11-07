import { apiClient } from '../lib/apiClient'
import type { HealthTrackingSummary } from '../types/profile'

export const fetchHealthTracking = async () => {
  return apiClient<HealthTrackingSummary>('/profile/health-tracking')
}

export const logFluidIntake = async (amount: number) => {
  return apiClient<HealthTrackingSummary>('/profile/health-tracking/intake', {
    method: 'POST',
    body: { amount },
  })
}
