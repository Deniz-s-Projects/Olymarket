import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'

import { useAuth } from '../context/useAuth'
import { fetchListingsAnalytics, type ListingsAnalyticsResponse } from '../services/analytics'

const formatPercent = (value: number) => `${(value * 100).toFixed(1)}%`

type ChartBarProps = {
  label: string
  value: number
  max: number
  colorClass: string
  formatter?: (value: number) => string
}

const ChartBar = ({ label, value, max, colorClass, formatter }: ChartBarProps) => {
  const safeMax = max > 0 ? max : value > 0 ? value : 1
  const baseWidth = safeMax > 0 ? (value / safeMax) * 100 : 0
  const width = Math.min(100, value > 0 ? Math.max(baseWidth, 6) : baseWidth)
  const displayValue = formatter ? formatter(value) : value.toLocaleString()

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-3 text-sm font-medium text-slate-700">
        <span className="truncate" title={label}>
          {label}
        </span>
        <span className="shrink-0 text-slate-900">{displayValue}</span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
        <div className={`h-full rounded-full ${colorClass}`} style={{ width: `${width}%` }} />
      </div>
    </div>
  )
}

const SellerAnalytics = () => {
  const { isHydrated, user } = useAuth()
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [data, setData] = useState<ListingsAnalyticsResponse | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!isHydrated || !user) {
      return
    }

    let mounted = true
    const load = async () => {
      setStatus('loading')
      setError(null)
      try {
        const response = await fetchListingsAnalytics()
        if (!mounted) return
        setData(response)
        setStatus('success')
      } catch (err) {
        if (!mounted) return
        setStatus('error')
        setError(err instanceof Error ? err.message : 'Failed to load analytics')
      }
    }

    load()

    return () => {
      mounted = false
    }
  }, [isHydrated, user])

  const analytics = data?.listings ?? []
  const totals = data?.totals ?? { views: 0, saves: 0, conversionRate: 0, listingCount: 0 }

  const chartData = useMemo(() => {
    const byViews = [...analytics].sort((a, b) => b.views - a.views)
    const bySaves = [...analytics].sort((a, b) => b.saves - a.saves)
    const byConversion = [...analytics].sort((a, b) => b.conversionRate - a.conversionRate)

    const maxViews = analytics.reduce((max, item) => Math.max(max, item.views), 0)
    const maxSaves = analytics.reduce((max, item) => Math.max(max, item.saves), 0)
    const maxConversion = analytics.reduce((max, item) => Math.max(max, item.conversionRate), 0)

    return {
      byViews: byViews.slice(0, 8),
      bySaves: bySaves.slice(0, 8),
      byConversion: byConversion.slice(0, 8),
      maxViews,
      maxSaves,
      maxConversion,
    }
  }, [analytics])

  if (!isHydrated) {
    return (
      <section className="mx-auto flex w-full max-w-5xl flex-col items-center justify-center gap-4 px-4 py-24 text-slate-500">
        Loading your analytics...
      </section>
    )
  }

  if (!user) {
    return (
      <section className="mx-auto flex w-full max-w-3xl flex-col items-center justify-center gap-4 px-4 py-24 text-center">
        <h1 className="text-2xl font-semibold text-slate-900">Sign in to view analytics</h1>
        <p className="max-w-md text-sm text-slate-600">
          You need to be signed in to review your listing performance and conversion metrics.
        </p>
        <Link
          to="/auth"
          className="inline-flex items-center justify-center rounded-full bg-primary px-6 py-2 text-sm font-semibold text-white transition hover:bg-primary/90"
        >
          Go to sign in
        </Link>
      </section>
    )
  }

  return (
    <section className="mx-auto w-full max-w-6xl px-4 py-10 lg:px-0">
      <header className="flex flex-col gap-4 border-b border-slate-200 pb-6 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2">
          <p className="text-sm font-semibold uppercase tracking-wide text-primary">Seller insights</p>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Performance dashboard</h1>
          <p className="max-w-2xl text-sm text-slate-600">
            Track how shoppers engage with your listings. Review total views, saves, and conversion trends to understand what
            resonates with your audience.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            to="/profile"
            className="inline-flex items-center justify-center rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-primary/40 hover:text-primary"
          >
            Back to profile
          </Link>
          <Link
            to="/listings/new"
            className="inline-flex items-center justify-center rounded-full bg-primary px-4 py-2 text-sm font-semibold text-white transition hover:bg-primary/90"
          >
            Create listing
          </Link>
        </div>
      </header>

      {status === 'loading' ? (
        <div className="mt-10 grid gap-6 lg:grid-cols-2">
          {[...Array(4)].map((_, index) => (
            <div
              key={index}
              className="h-48 animate-pulse rounded-2xl border border-slate-200 bg-white/60"
            />
          ))}
        </div>
      ) : null}

      {status === 'error' ? (
        <div className="mt-8 rounded-2xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">
          <p className="font-semibold">We couldn't load your analytics.</p>
          <p className="mt-1 text-xs text-red-600">{error ?? 'Please try again in a few moments.'}</p>
        </div>
      ) : null}

      {status === 'success' ? (
        <div className="mt-10 space-y-8">
          <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <p className="text-sm font-medium text-slate-500">Total views</p>
              <p className="mt-2 text-3xl font-semibold text-slate-900">
                {totals.views.toLocaleString()}
              </p>
              <p className="mt-1 text-xs text-slate-500">Across all active listings</p>
            </article>
            <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <p className="text-sm font-medium text-slate-500">Total saves</p>
              <p className="mt-2 text-3xl font-semibold text-slate-900">
                {totals.saves.toLocaleString()}
              </p>
              <p className="mt-1 text-xs text-slate-500">Favorites and wishlist adds</p>
            </article>
            <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <p className="text-sm font-medium text-slate-500">Average conversion</p>
              <p className="mt-2 text-3xl font-semibold text-slate-900">
                {formatPercent(totals.conversionRate)}
              </p>
              <p className="mt-1 text-xs text-slate-500">Saves divided by total views</p>
            </article>
            <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <p className="text-sm font-medium text-slate-500">Active listings</p>
              <p className="mt-2 text-3xl font-semibold text-slate-900">{totals.listingCount}</p>
              <p className="mt-1 text-xs text-slate-500">Included in this report</p>
            </article>
          </section>

          <div className="grid gap-6 lg:grid-cols-2">
            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <header className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">Listing views</h2>
                  <p className="text-sm text-slate-600">Top listings by total impressions.</p>
                </div>
              </header>
              {chartData.byViews.length > 0 ? (
                <div className="mt-6 space-y-4">
                  {chartData.byViews.map((item) => (
                    <ChartBar
                      key={item.id}
                      label={item.title}
                      value={item.views}
                      max={chartData.maxViews}
                      colorClass="bg-primary"
                    />
                  ))}
                </div>
              ) : (
                <div className="mt-6 rounded-xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center text-sm text-slate-600">
                  No views recorded yet. Share your listings to start gathering insights.
                </div>
              )}
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <header className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">Listing saves</h2>
                  <p className="text-sm text-slate-600">See which listings shoppers are bookmarking.</p>
                </div>
              </header>
              {chartData.bySaves.length > 0 ? (
                <div className="mt-6 space-y-4">
                  {chartData.bySaves.map((item) => (
                    <ChartBar
                      key={item.id}
                      label={item.title}
                      value={item.saves}
                      max={chartData.maxSaves}
                      colorClass="bg-emerald-500"
                    />
                  ))}
                </div>
              ) : (
                <div className="mt-6 rounded-xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center text-sm text-slate-600">
                  No favorites yet. Encourage shoppers to save your listings for later.
                </div>
              )}
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <header className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">Conversion rate</h2>
                  <p className="text-sm text-slate-600">Favorites divided by total views.</p>
                </div>
              </header>
              {chartData.byConversion.length > 0 ? (
                <div className="mt-6 space-y-4">
                  {chartData.byConversion.map((item) => (
                    <ChartBar
                      key={item.id}
                      label={item.title}
                      value={item.conversionRate}
                      max={chartData.maxConversion}
                      colorClass="bg-sky-500"
                      formatter={formatPercent}
                    />
                  ))}
                </div>
              ) : (
                <div className="mt-6 rounded-xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center text-sm text-slate-600">
                  Conversion data will appear once your listings start getting views and saves.
                </div>
              )}
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm lg:col-span-2">
              <header className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">Listing breakdown</h2>
                  <p className="text-sm text-slate-600">Detailed performance metrics for each listing.</p>
                </div>
              </header>
              {analytics.length > 0 ? (
                <div className="mt-6 overflow-x-auto">
                  <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
                    <thead>
                      <tr className="text-xs uppercase tracking-wide text-slate-500">
                        <th scope="col" className="px-4 py-3 font-semibold">Listing</th>
                        <th scope="col" className="px-4 py-3 font-semibold">Views</th>
                        <th scope="col" className="px-4 py-3 font-semibold">Saves</th>
                        <th scope="col" className="px-4 py-3 font-semibold">Conversion</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {analytics.map((item) => (
                        <tr key={item.id} className="transition hover:bg-slate-50/60">
                          <td className="px-4 py-3">
                            <Link
                              to={`/listings/${item.id}`}
                              className="text-sm font-semibold text-primary transition hover:text-primary/80"
                            >
                              {item.title}
                            </Link>
                          </td>
                          <td className="px-4 py-3 text-sm text-slate-700">{item.views.toLocaleString()}</td>
                          <td className="px-4 py-3 text-sm text-slate-700">{item.saves.toLocaleString()}</td>
                          <td className="px-4 py-3 text-sm text-slate-700">{formatPercent(item.conversionRate)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="mt-6 rounded-xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center text-sm text-slate-600">
                  Add your first listing to unlock performance reporting and conversion insights.
                </div>
              )}
            </section>
          </div>
        </div>
      ) : null}
    </section>
  )
}

export default SellerAnalytics
