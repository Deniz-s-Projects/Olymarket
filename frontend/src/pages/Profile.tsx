import { useMemo, useState } from 'react'
import { NavLink, Link } from 'react-router-dom'

import PreferenceToggleList from '../components/profile/PreferenceToggleList'
import ProfileHeader from '../components/profile/ProfileHeader'
import ProfileOverviewTab from '../components/profile/ProfileOverviewTab'
import ProfileListingsTab from '../components/profile/ProfileListingsTab'
import ProfileTabs, { type ProfileTabConfig } from '../components/profile/ProfileTabs'
import ReputationPanel from '../components/profile/ReputationPanel'
import SavedItemsCard from '../components/profile/SavedItemsCard'
import { useAuth } from '../context/useAuth'
import useProfile from '../hooks/useProfile'
import type { ProfileAccountInfo } from '../types/profile'

const PROFILE_TABS: ProfileTabConfig[] = [
  { id: 'overview', label: 'Overview' },
  { id: 'listings', label: 'Listings' },
  { id: 'saved', label: 'Saved Items' },
  { id: 'preferences', label: 'Preferences' },
  { id: 'reputation', label: 'Reputation' },
]

const Profile = () => {
  const { user, isHydrated, banNotice, isModerator, isAdmin } = useAuth()
  const {
    account: profileAccount,
    metrics,
    listings,
    savedItems,
    preferences,
    isLoading,
    isError,
    error,
    refetch,
    updateAccount,
    isUpdatingAccount,
    updateAccountError,
  } = useProfile({ enabled: Boolean(user) })

  const [activeTab, setActiveTab] = useState<string>(PROFILE_TABS[0]?.id ?? 'overview')

  const accountDetails = useMemo<ProfileAccountInfo | undefined>(() => {
    if (!user && !profileAccount) {
      return undefined
    }

    if (!user) {
      return profileAccount ?? undefined
    }

    const moderationDetails =
      user?.banReason || user?.moderation
        ? {
            flagCount: user.moderation?.flagCount,
            reviewedAt: user.moderation?.reviewedAt ?? null,
            notes: user.moderation?.notes ?? user.banReason ?? null,
          }
        : undefined

    const baseAccount: ProfileAccountInfo = {
      name: user.name,
      email: user.email,
      role: user.role,
      moderation: moderationDetails,
    }

    if (!profileAccount) {
      return baseAccount
    }

    return {
      ...baseAccount,
      ...profileAccount,
      name: profileAccount.name ?? baseAccount.name,
      email: profileAccount.email ?? baseAccount.email,
      role: profileAccount.role ?? baseAccount.role,
      moderation: profileAccount.moderation ?? baseAccount.moderation,
    }
  }, [profileAccount, user])

  const createListingUrl = listings.createListingUrl ?? '/listings/new'

  if (!isHydrated) {
    return (
      <section className="mx-auto flex w-full max-w-4xl flex-col items-center justify-center px-4 py-24 text-slate-500">
        Checking your profile...
      </section>
    )
  }

  if (!user) {
    return (
      <section className="mx-auto flex w-full max-w-4xl flex-col items-center justify-center gap-4 px-4 py-24 text-center">
        <h1 className="text-2xl font-semibold text-slate-900">You're not signed in</h1>
        <p className="max-w-md text-sm text-slate-600">
          Sign in to access your profile dashboard, manage listings, and review your saved items.
        </p>
        <NavLink
          to="/auth"
          className="inline-flex items-center justify-center rounded-full bg-primary px-6 py-2 text-sm font-semibold text-white transition hover:bg-primary/90"
        >
          Go to sign in
        </NavLink>
      </section>
    )
  }

  const renderActiveTab = () => {
    switch (activeTab) {
      case 'listings':
        return (
          <div className="flex flex-col gap-6">
            <ProfileListingsTab listings={listings} isLoading={isLoading} />
          </div>
        )
      case 'saved':
        return (
          <div className="flex flex-col gap-6">
            <SavedItemsCard items={savedItems} isLoading={isLoading} />
          </div>
        )
      case 'preferences':
        return (
          <div className="flex flex-col gap-6">
            <PreferenceToggleList preferences={preferences} isLoading={isLoading} />
          </div>
        )
      case 'reputation':
        return <ReputationPanel metrics={metrics} isLoading={isLoading} />
      case 'overview':
      default:
        return (
          <ProfileOverviewTab
            account={accountDetails}
            isLoading={isLoading}
            onUpdate={updateAccount}
            isUpdating={isUpdatingAccount}
            updateError={updateAccountError}
          />
        )
    }
  }

  const activeTabId = PROFILE_TABS.some((tab) => tab.id === activeTab)
    ? activeTab
    : PROFILE_TABS[0]?.id ?? 'overview'
  const baseTabId = 'profile-dashboard'
  const panelId = `${baseTabId}-panel-${activeTabId}`
  const tabId = `${baseTabId}-tab-${activeTabId}`

  return (
    <section className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-10 lg:px-0">
      <ProfileHeader
        account={accountDetails}
        metrics={metrics}
        isLoading={isLoading}
        actions={
          <Link
            to={createListingUrl}
            className="inline-flex items-center justify-center rounded-full border border-primary px-4 py-2 text-sm font-semibold text-primary transition hover:bg-primary hover:text-white"
          >
            Create Listing
          </Link>
        }
      />
      {banNotice ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-700">
          <p className="font-semibold">Account suspended</p>
          <p className="mt-1">
            {banNotice.reason
              ? `Your account access is limited: ${banNotice.reason}`
              : 'Our moderators have temporarily suspended your marketplace access.'}
          </p>
        </div>
      ) : null}
      {accountDetails?.moderation?.flagCount ? (
        <div className="rounded-xl border border-amber-100 bg-amber-50/60 p-4 text-sm text-amber-800">
          <p className="font-semibold">Community alerts</p>
          <p className="mt-1">
            You have {accountDetails.moderation.flagCount}{' '}
            {accountDetails.moderation.flagCount === 1 ? 'active report' : 'active reports'} under review.
            {isModerator || isAdmin
              ? ' Review the flagged content to keep your listings compliant.'
              : ' Our team will review these soon. Keep an eye on your inbox for updates.'}
          </p>
          {accountDetails.moderation.reviewedAt ? (
            <p className="mt-1 text-xs text-amber-700">
              Last reviewed on {accountDetails.moderation.reviewedAt}
            </p>
          ) : null}
        </div>
      ) : null}
      {isError ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <p>We couldn&apos;t load your profile details right now.</p>
          {error?.message ? (
            <p className="mt-1 text-xs text-red-600">{error.message}</p>
          ) : null}
          <button
            type="button"
            onClick={refetch}
            className="mt-3 inline-flex items-center justify-center rounded-full border border-red-300 px-3 py-1 text-xs font-semibold text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
            disabled={isLoading}
          >
            Try again
          </button>
        </div>
      ) : null}
      <ProfileTabs
        tabs={PROFILE_TABS}
        activeTabId={activeTabId}
        onTabChange={setActiveTab}
        baseId={baseTabId}
      />
      <div
        role="tabpanel"
        id={panelId}
        aria-labelledby={tabId}
        className="mt-2"
      >
        {renderActiveTab()}
      </div>
    </section>
  )
}

export default Profile
