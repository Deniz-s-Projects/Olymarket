import { useMemo } from 'react'
import { NavLink } from 'react-router-dom'

import AccountInfoCard from '../components/profile/AccountInfoCard'
import ListingTable from '../components/profile/ListingTable'
import PreferenceToggleList from '../components/profile/PreferenceToggleList'
import ProfileHeader from '../components/profile/ProfileHeader'
import SavedItemsCard from '../components/profile/SavedItemsCard'
import { useAuth } from '../context/useAuth'
import useProfile from '../hooks/useProfile'
import type { ProfileAccountInfo } from '../types/profile'

const Profile = () => {
  const { user, isHydrated } = useAuth()
  const {
    account: profileAccount,
    metrics,
    activeListings,
    savedItems,
    preferences,
    isLoading,
    isError,
    error,
    refetch,
  } = useProfile({ enabled: Boolean(user) })

  const accountDetails = useMemo<ProfileAccountInfo | undefined>(() => {
    if (!user && !profileAccount) {
      return undefined
    }

    if (!user) {
      return profileAccount ?? undefined
    }

    const baseAccount: ProfileAccountInfo = {
      name: user.name,
      email: user.email,
    }

    if (!profileAccount) {
      return baseAccount
    }

    return {
      ...baseAccount,
      ...profileAccount,
      name: profileAccount.name ?? baseAccount.name,
      email: profileAccount.email ?? baseAccount.email,
    }
  }, [profileAccount, user])

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

  return (
    <section className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-10 lg:px-0">
      <ProfileHeader
        account={accountDetails}
        metrics={metrics}
        isLoading={isLoading}
        actions={
          <button
            type="button"
            className="inline-flex items-center justify-center rounded-full border border-primary px-4 py-2 text-sm font-semibold text-primary transition hover:bg-primary hover:text-white"
          >
            Create Listing
          </button>
        }
      />
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
      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <div className="flex flex-col gap-6">
          <AccountInfoCard account={accountDetails} isLoading={isLoading} />
          <ListingTable
            listings={activeListings}
            title="Active Listings"
            emptyMessage="You do not have any listings yet. Start by creating your first listing."
            isLoading={isLoading}
          />
        </div>
        <div className="flex flex-col gap-6">
          <SavedItemsCard items={savedItems} isLoading={isLoading} />
          <PreferenceToggleList preferences={preferences} isLoading={isLoading} />
        </div>
      </div>
    </section>
  )
}

export default Profile
