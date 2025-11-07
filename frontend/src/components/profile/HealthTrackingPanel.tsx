import { useId } from 'react'

import type { HealthTrackingDaySummary } from '../../types/health'

const volumeFormatter = new Intl.NumberFormat()
const weekdayFormatter = new Intl.DateTimeFormat(undefined, { weekday: 'short' })

const formatVolume = (value: number) => `${volumeFormatter.format(Math.round(value))} ml`

const getWeekdayLabel = (value: string) => {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return value
  }
  return weekdayFormatter.format(date)
}

type HealthTrackingPanelProps = {
  goal: number
  total: number
  history: HealthTrackingDaySummary[]
  isLoading?: boolean
  isError?: boolean
  errorMessage?: string | null
  addIntakeError?: Error | null
  onRetry?: () => void
  onAddIntake: (amount: number) => Promise<void>
  isAddingIntake?: boolean
}

const INTAKE_OPTIONS = [100, 250, 500]

const getTimeValue = (value: string) => {
  const date = new Date(value)
  const time = date.getTime()
  return Number.isNaN(time) ? 0 : time
}

const HealthTrackingPanel = ({
  goal,
  total,
  history,
  isLoading = false,
  isError = false,
  errorMessage,
  addIntakeError,
  onRetry,
  onAddIntake,
  isAddingIntake = false,
}: HealthTrackingPanelProps) => {
  const safeGoal = goal > 0 ? goal : 3000
  const progress = Math.min(1, safeGoal > 0 ? total / safeGoal : 0)
  const percentage = Math.round(progress * 100)
  const radius = 52
  const circumference = 2 * Math.PI * radius
  const dashOffset = circumference * (1 - progress)
  const progressTitleId = useId()
  const progressDescriptionId = useId()

  const sortedHistory = [...history].sort((a, b) => {
    return getTimeValue(a.date) - getTimeValue(b.date)
  })
  const displayHistory = sortedHistory.slice(-7)
  const maxReference = Math.max(safeGoal, ...displayHistory.map((entry) => entry.total)) || safeGoal

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <header className="flex flex-col gap-1">
        <h2 className="text-lg font-semibold text-slate-900">Hydration &amp; Health Tracking</h2>
        <p className="text-sm text-slate-500">
          Stay energized by keeping track of how much water you&apos;ve had today and over the past week.
        </p>
      </header>

      {isLoading ? (
        <p className="mt-6 text-sm text-slate-500">Loading your health tracking data…</p>
      ) : isError ? (
        <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <p>We couldn&apos;t load your health tracking details right now.</p>
          {errorMessage ? <p className="mt-1 text-xs text-red-600">{errorMessage}</p> : null}
          {onRetry ? (
            <button
              type="button"
              onClick={onRetry}
              className="mt-3 inline-flex items-center justify-center rounded-full border border-red-300 px-3 py-1 text-xs font-semibold text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
              disabled={isLoading}
            >
              Try again
            </button>
          ) : null}
        </div>
      ) : (
        <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
          <div className="flex flex-col items-center gap-6">
            <div className="relative flex h-48 w-48 items-center justify-center" aria-live="polite">
              <svg
                className="h-full w-full"
                viewBox="0 0 240 240"
                role="img"
                aria-labelledby={`${progressTitleId} ${progressDescriptionId}`}
              >
                <title id={progressTitleId}>Daily hydration progress</title>
                <desc id={progressDescriptionId}>
                  {`You have consumed ${formatVolume(total)} out of a ${formatVolume(safeGoal)} goal today.`}
                </desc>
                <circle
                  cx="120"
                  cy="120"
                  r={radius}
                  strokeWidth="16"
                  stroke="#E2E8F0"
                  fill="transparent"
                />
                <circle
                  cx="120"
                  cy="120"
                  r={radius}
                  strokeWidth="16"
                  strokeLinecap="round"
                  stroke="#3B82F6"
                  fill="transparent"
                  strokeDasharray={`${circumference} ${circumference}`}
                  strokeDashoffset={dashOffset}
                  transform="rotate(-90 120 120)"
                  aria-hidden="true"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center rounded-full text-center" aria-hidden="true">
                <span className="text-3xl font-semibold text-slate-900">{percentage}%</span>
                <span className="text-xs text-slate-500">{formatVolume(total)} of {formatVolume(safeGoal)}</span>
              </div>
            </div>
            <div className="w-full rounded-2xl bg-slate-50 p-4">
              <p className="text-sm font-semibold text-slate-700">Add quick intake</p>
              <div className="mt-3 flex flex-wrap gap-3">
                {INTAKE_OPTIONS.map((amount) => (
                  <button
                    key={amount}
                    type="button"
                    onClick={() => {
                      void onAddIntake(amount).catch(() => {})
                    }}
                    className="inline-flex items-center justify-center rounded-full border border-primary/30 px-4 py-2 text-sm font-semibold text-primary transition hover:bg-primary/10 disabled:cursor-not-allowed disabled:opacity-50"
                    disabled={isAddingIntake}
                    aria-label={`Add ${amount} milliliters to today's total`}
                  >
                    +{amount} ml
                  </button>
                ))}
              </div>
              {addIntakeError ? (
                <p className="mt-3 text-xs text-red-600" role="alert">
                  {addIntakeError.message}
                </p>
              ) : null}
            </div>
          </div>
          <div className="flex flex-col gap-4">
            <div>
              <h3 className="text-sm font-semibold text-slate-700">This week</h3>
              {displayHistory.length > 0 ? (
                <div className="mt-3 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-7">
                  {displayHistory.map((entry) => {
                    const label = getWeekdayLabel(entry.date)
                    const height =
                      maxReference > 0
                        ? Math.min(100, Math.max(6, Math.round((entry.total / maxReference) * 100)))
                        : 0
                    return (
                      <div key={`${entry.date}-${entry.total}`} className="flex flex-col items-center gap-2 text-center text-xs text-slate-500">
                        <div className="flex h-24 w-full items-end rounded-full bg-slate-100 p-1" role="img" aria-label={`${label}: ${formatVolume(entry.total)}`}>
                          <div className="w-full rounded-full bg-primary transition-[height]" style={{ height: `${height}%` }} aria-hidden="true" />
                        </div>
                        <span className="font-medium text-slate-700">{label}</span>
                        <span className="text-[11px] text-slate-400">{formatVolume(entry.total)}</span>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <p className="mt-3 text-sm text-slate-500">Start adding your intakes to see weekly trends here.</p>
              )}
            </div>
            <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4 text-sm text-slate-600">
              its my site and i needed this function so i implemented it here
            </div>
          </div>
        </div>
      )}
    </section>
  )
}

export default HealthTrackingPanel
