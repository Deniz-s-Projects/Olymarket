import { useMemo } from 'react'
import { NavLink } from 'react-router-dom'

import type { Announcement } from '../../types/announcements'

type AnnouncementsBoardProps = {
  announcements: Announcement[]
  isLoading?: boolean
  error?: string | null
  onRetry?: () => void
  communityNewsEnabled?: boolean
  showSubscriptionHint?: boolean
}

const formatDate = (value: string) => {
  try {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }).format(new Date(value))
  } catch {
    return value
  }
}

const isActiveAnnouncement = (announcement: Announcement, now: Date) => {
  const startAt = new Date(announcement.publishFrom)
  const endAt = announcement.publishTo ? new Date(announcement.publishTo) : null

  return startAt <= now && (!endAt || endAt >= now)
}

const sortAnnouncements = (announcements: Announcement[]) =>
  [...announcements].sort((a, b) => {
    if (a.isPinned !== b.isPinned) {
      return a.isPinned ? -1 : 1
    }

    return new Date(b.publishFrom).getTime() - new Date(a.publishFrom).getTime()
  })

const AnnouncementsBoard = ({
  announcements,
  isLoading = false,
  error = null,
  onRetry,
  communityNewsEnabled = true,
  showSubscriptionHint = false,
}: AnnouncementsBoardProps) => {
  const now = useMemo(() => new Date(), [])

  const { activeAnnouncements, pastAnnouncements } = useMemo(() => {
    const active = announcements.filter((announcement) =>
      isActiveAnnouncement(announcement, now)
    )
    const past = announcements.filter(
      (announcement) => !isActiveAnnouncement(announcement, now)
    )

    return {
      activeAnnouncements: sortAnnouncements(active),
      pastAnnouncements: sortAnnouncements(past),
    }
  }, [announcements, now])

  if (isLoading) {
    return (
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="animate-pulse space-y-4">
          <div className="h-6 w-2/3 rounded bg-slate-200 dark:bg-slate-700" />
          <div className="h-4 w-full rounded bg-slate-200 dark:bg-slate-700" />
          <div className="h-4 w-5/6 rounded bg-slate-200 dark:bg-slate-700" />
          <div className="h-4 w-3/4 rounded bg-slate-200 dark:bg-slate-700" />
        </div>
      </section>
    )
  }

  if (error) {
    return (
      <section className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-rose-800 shadow-sm dark:border-rose-800 dark:bg-rose-950 dark:text-rose-200">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-lg font-semibold">We couldn't load community news</h2>
            <p className="text-sm opacity-90">{error}</p>
          </div>
          {onRetry ? (
            <button
              type="button"
              onClick={onRetry}
              className="inline-flex items-center rounded-full bg-white px-4 py-2 text-sm font-semibold text-rose-700 shadow-sm transition hover:bg-rose-100 dark:bg-rose-900 dark:text-rose-100 dark:hover:bg-rose-800"
            >
              Try again
            </button>
          ) : null}
        </div>
      </section>
    )
  }

  return (
    <section className="space-y-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800">
      <header className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Community announcements</h2>
          <p className="text-sm text-slate-600 dark:text-slate-300">
            Stay up to date with the latest product updates, events, and community highlights.
          </p>
        </div>
        {showSubscriptionHint && !communityNewsEnabled ? (
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800 shadow-sm dark:border-amber-700 dark:bg-amber-950 dark:text-amber-200">
            <p className="font-semibold">Community news is turned off</p>
            <p className="mt-1 opacity-90">
              Update your communication preferences to receive notifications when new announcements are posted.
            </p>
            <NavLink
              to="/profile"
              className="mt-3 inline-flex items-center rounded-full bg-amber-600 px-4 py-1.5 text-xs font-semibold text-white transition hover:bg-amber-500"
            >
              Manage preferences
            </NavLink>
          </div>
        ) : null}
      </header>

      {activeAnnouncements.length === 0 && pastAnnouncements.length === 0 ? (
        <p className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-6 text-sm text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">
          There aren't any announcements yet. Check back soon for community updates.
        </p>
      ) : null}

      {activeAnnouncements.length > 0 ? (
        <div className="space-y-4">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-300">
            Current updates
          </h3>
          <div className="space-y-4">
            {activeAnnouncements.map((announcement) => (
              <article
                key={announcement.id}
                className={`rounded-2xl border p-6 shadow-sm transition hover:border-primary/40 hover:shadow-md dark:border-slate-700 dark:hover:border-primary/40 ${
                  announcement.isPinned
                    ? 'border-primary/60 bg-primary/5 ring-1 ring-primary/20'
                    : 'border-slate-200 bg-white dark:bg-slate-800'
                }`}
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                    {announcement.title}
                  </h3>
                  {announcement.isPinned ? (
                    <span className="inline-flex items-center rounded-full bg-primary px-3 py-1 text-xs font-semibold uppercase tracking-wide text-white">
                      Pinned
                    </span>
                  ) : null}
                </div>
                <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-slate-700 dark:text-slate-200">
                  {announcement.body}
                </p>
                <footer className="mt-4 flex flex-wrap items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
                  <span>Published {formatDate(announcement.publishFrom)}</span>
                  {announcement.publishTo ? (
                    <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 font-medium text-slate-600 dark:bg-slate-700 dark:text-slate-300">
                      Active until {formatDate(announcement.publishTo)}
                    </span>
                  ) : (
                    <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 font-medium text-slate-600 dark:bg-slate-700 dark:text-slate-300">
                      Ongoing
                    </span>
                  )}
                </footer>
              </article>
            ))}
          </div>
        </div>
      ) : null}

      {pastAnnouncements.length > 0 ? (
        <div className="space-y-4">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-300">
            Previous announcements
          </h3>
          <div className="space-y-3">
            {pastAnnouncements.map((announcement) => (
              <article
                key={announcement.id}
                className="rounded-xl border border-slate-200 bg-slate-50 p-5 text-sm text-slate-700 shadow-sm transition hover:border-slate-300 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
              >
                <header className="flex flex-col gap-1">
                  <h4 className="text-base font-semibold text-slate-900 dark:text-white">
                    {announcement.title}
                  </h4>
                  <span className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
                    Published {formatDate(announcement.publishFrom)}
                  </span>
                </header>
                <p className="mt-2 whitespace-pre-line leading-relaxed">{announcement.body}</p>
                {announcement.publishTo ? (
                  <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">
                    Displayed until {formatDate(announcement.publishTo)}
                  </p>
                ) : null}
              </article>
            ))}
          </div>
        </div>
      ) : null}
    </section>
  )
}

export default AnnouncementsBoard
