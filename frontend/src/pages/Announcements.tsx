import AnnouncementsBoard from '../components/announcements/AnnouncementsBoard'
import { useAuth } from '../context/useAuth'
import useAnnouncements from '../hooks/useAnnouncements'

const Announcements = () => {
  const { user } = useAuth()
  const { announcements, isLoading, error, communityNewsEnabled, refetch } =
    useAnnouncements()

  const errorMessage = error?.message ?? null

  return (
    <section className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-4 py-10 lg:px-0">
      <header className="space-y-3">
        <p className="text-sm font-semibold uppercase tracking-wide text-primary">
          Announcements
        </p>
        <h1 className="text-3xl font-semibold text-slate-900 dark:text-white">
          What's new in Olymarket
        </h1>
        <p className="max-w-2xl text-sm text-slate-600 dark:text-slate-300">
          {user?.name
            ? `${user.name}, here’s a look at the latest updates and happenings in the community.`
            : 'Catch up on the latest announcements, feature releases, and community highlights.'}
        </p>
      </header>

      <AnnouncementsBoard
        announcements={announcements}
        isLoading={isLoading}
        error={errorMessage}
        onRetry={() => {
          void refetch()
        }}
        communityNewsEnabled={communityNewsEnabled}
        showSubscriptionHint
      />
    </section>
  )
}

export default Announcements
