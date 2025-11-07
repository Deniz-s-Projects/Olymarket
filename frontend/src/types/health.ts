export interface HealthTrackingDaySummary {
  date: string
  total: number
}

export interface HealthTrackingSummary {
  goal: number
  total: number
  history: HealthTrackingDaySummary[]
}
