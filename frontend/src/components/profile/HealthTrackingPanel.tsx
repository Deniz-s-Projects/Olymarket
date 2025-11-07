import { useMemo, useState } from 'react'

import type { HealthTrackingSummary } from '../../types/profile'

const INTAKE_OPTIONS = [100, 250, 500]

const formatDayLabel = (dateString: string) => {
  const date = new Date(dateString)

  if (Number.isNaN(date.getTime())) {
    return dateString
  }

  return date.toLocaleDateString(undefined, { weekday: 'short' })
}

type HealthTrackingPanelProps = {
  summary: HealthTrackingSummary | null
  isLoading?: boolean
  error?: Error | null
  onAddIntake: (amount: number) => Promise<void>
}

const HealthTrackingPanel = ({ summary, isLoading = false, error = null, onAddIntake }: HealthTrackingPanelProps) => {
  const [pendingAmount, setPendingAmount] = useState<number | null>(null)
  const goal = summary?.goal ?? 3000
  const todayTotal = summary?.todayTotal ?? 0
  const progress = goal > 0 ? Math.min(todayTotal / goal, 1) : 0
  const progressDegrees = Math.round(progress * 360)
  const progressPercent = Math.round(progress * 100)

  const history = useMemo(() => {
    if (!summary?.weeklyHistory || summary.weeklyHistory.length === 0) {
      return []
    }

    const sorted = [...summary.weeklyHistory].sort((a, b) => a.date.localeCompare(b.date))

    return sorted.slice(-7)
  }, [summary])

  const maxHistoryTotal = useMemo(() => {
    if (history.length === 0) {
      return goal
    }

    return Math.max(goal, ...history.map((entry) => entry.total)) || goal
  }, [goal, history])

  const handleAddIntake = async (amount: number) => {
    try {
      setPendingAmount(amount)
      await onAddIntake(amount)
    } finally {
      setPendingAmount(null)
    }
  }

  const isPending = pendingAmount !== null

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <header className="flex flex-col gap-1">
        <h2 className="text-lg font-semibold text-slate-900">Hydration &amp; Health Tracking</h2>
        <p className="text-sm text-slate-500">
          Log your intake and stay on top of your daily hydration goals with lightweight insights.
        </p>
      </header>
      <p className="mt-3 text-xs text-slate-400">its my site and i needed this function so i implemented it here</p>
      {error ? (
        <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700" role="alert">
          <p>{error.message}</p>
        </div>
      ) : null}
      {isLoading && !summary ? (
        <p className="mt-4 text-sm text-slate-500" role="status">
          Loading your health tracking data…
        </p>
      ) : null}
      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <div className="flex flex-col items-center gap-6 rounded-xl border border-slate-100 bg-slate-50 p-6">
          <div
            className="relative h-40 w-40"
            role="img"
            aria-label={`Today's intake is ${todayTotal} milliliters out of a ${goal} milliliter goal (${progressPercent}% complete).`}
          >
            <div
              className="absolute inset-0 rounded-full"
              style={{
                background: `conic-gradient(var(--color-primary, #0ea5e9) ${progressDegrees}deg, #e2e8f0 ${progressDegrees}deg)`,
              }}
            />
            <div className="absolute inset-4 flex flex-col items-center justify-center rounded-full bg-white text-center">
              <span className="text-3xl font-semibold text-slate-900">{todayTotal}</span>
              <span className="text-xs font-medium uppercase tracking-wide text-slate-500">ml today</span>
              <span className="mt-1 text-[10px] text-slate-400">Goal: {goal} ml</span>
            </div>
            <div className="absolute inset-0 rounded-full border-4 border-transparent" aria-hidden="true" />
          </div>
          <div className="flex flex-wrap items-center justify-center gap-3">
            {INTAKE_OPTIONS.map((amount) => (
              <button
                key={amount}
                type="button"
                onClick={() => {
                  void handleAddIntake(amount)
                }}
                disabled={isPending || isLoading}
                className="inline-flex min-w-[84px] items-center justify-center rounded-full bg-primary px-4 py-2 text-sm font-semibold text-white transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:bg-primary/50"
                aria-label={`Add ${amount} milliliters to today's total`}
              >
                +{amount} ml
              </button>
            ))}
          </div>
          {isPending ? (
            <p className="text-xs text-slate-500" role="status" aria-live="polite">
              Logging your intake…
            </p>
          ) : null}
        </div>
        <div className="flex h-full flex-col justify-between rounded-xl border border-slate-100 bg-white p-6">
          <div>
            <h3 className="text-sm font-semibold text-slate-900">Weekly progress</h3>
            <p className="mt-1 text-xs text-slate-500">
              A quick glance at the past week helps you spot trends and stay consistent.
            </p>
          </div>
          {history.length > 0 ? (
            <div className="mt-6 flex items-end justify-between gap-3">
              {history.map((entry) => {
                const heightPercent = maxHistoryTotal > 0 ? Math.round((entry.total / maxHistoryTotal) * 100) : 0

                return (
                  <div key={entry.date} className="flex w-full flex-col items-center gap-2">
                    <div className="flex h-32 w-full items-end justify-center overflow-hidden rounded-full bg-slate-100">
                      <div
                        className="w-3/4 rounded-full bg-primary"
                        style={{ height: `${heightPercent}%` }}
                        role="presentation"
                        aria-hidden="true"
                      />
                    </div>
                    <span className="text-[11px] font-medium text-slate-600">{formatDayLabel(entry.date)}</span>
                    <span className="text-[10px] text-slate-400">{entry.total} ml</span>
                  </div>
                )
              })}
            </div>
          ) : (
            <p className="mt-6 text-sm text-slate-500" aria-live="polite">
              You&apos;ll see your week of hydration once you start logging entries.
            </p>
          )}
          <span className="sr-only" aria-live="polite">
            Weekly hydration data visualized as bars comparing each day to your goal of {goal} milliliters.
          </span>
        </div>
      </div>
    </section>
  )
}

export default HealthTrackingPanel
