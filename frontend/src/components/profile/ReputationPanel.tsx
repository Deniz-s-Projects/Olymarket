import type { ProfileMetric } from '../../types/profile'

type ReputationPanelProps = {
  metrics: ProfileMetric[]
  isLoading?: boolean
}

const ReputationPanel = ({ metrics, isLoading = false }: ReputationPanelProps) => {
  const hasMetrics = metrics.length > 0

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <header className="flex flex-col gap-1">
        <h2 className="text-lg font-semibold text-slate-900">Reputation &amp; Community Trust</h2>
        <p className="text-sm text-slate-500">
          Track how the community sees you and learn ways to grow your marketplace presence.
        </p>
      </header>
      {isLoading ? (
        <p className="mt-4 text-sm text-slate-500">Loading your reputation insights…</p>
      ) : hasMetrics ? (
        <dl className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {metrics.map((metric) => (
            <div key={metric.label} className="rounded-xl border border-slate-100 bg-slate-50 p-4 text-center">
              <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">{metric.label}</dt>
              <dd className="mt-2 text-2xl font-semibold text-slate-900">{metric.value}</dd>
            </div>
          ))}
        </dl>
      ) : (
        <p className="mt-4 text-sm text-slate-500">
          You haven&apos;t built up reputation metrics yet. Complete listings, respond quickly, and gather reviews to grow your
          presence.
        </p>
      )}
      <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
        <p className="font-semibold">Tips to grow your reputation</p>
        <ul className="mt-2 list-disc space-y-1 pl-5">
          <li>Respond to inquiries within a day to maintain a reliable response rate.</li>
          <li>Keep your listings accurate and updated before accepting offers.</li>
          <li>Request feedback after successful trades to showcase positive experiences.</li>
        </ul>
      </div>
    </section>
  )
}

export default ReputationPanel
