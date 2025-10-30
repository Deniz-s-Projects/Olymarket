import { useEffect, useMemo, useState } from 'react'

import type { ChangeEvent, FormEvent } from 'react'
import AccountInfoCard from './AccountInfoCard'
import type { ProfileAccountInfo, ProfileAccountUpdateInput } from '../../types/profile'

type ProfileOverviewTabProps = {
  account?: ProfileAccountInfo | null
  isLoading?: boolean
  onUpdate: (input: ProfileAccountUpdateInput) => Promise<ProfileAccountInfo>
  isUpdating?: boolean
  updateError?: Error | null
}

type FormState = {
  name: string
  location: string
  bio: string
}

const normalizeAccountToFormState = (account?: ProfileAccountInfo | null): FormState => ({
  name: account?.name ?? '',
  location: account?.location ?? '',
  bio: account?.bio ?? '',
})

const ProfileOverviewTab = ({
  account,
  isLoading = false,
  onUpdate,
  isUpdating = false,
  updateError,
}: ProfileOverviewTabProps) => {
  const [isEditing, setIsEditing] = useState(false)
  const [formState, setFormState] = useState<FormState>(() => normalizeAccountToFormState(account))
  const [localError, setLocalError] = useState<string | null>(null)
  const [showSuccess, setShowSuccess] = useState(false)

  const openEditor = () => {
    setIsEditing(true)
    setLocalError(null)
    setShowSuccess(false)
  }

  const toggleEditing = () => {
    setIsEditing((current) => {
      const next = !current
      if (next) {
        setLocalError(null)
        setShowSuccess(false)
      }
      return next
    })
  }

  useEffect(() => {
    setFormState(normalizeAccountToFormState(account))
  }, [account])

  useEffect(() => {
    if (!updateError) {
      return
    }

    setLocalError(updateError.message)
  }, [updateError])

  const onboardingPrompts = useMemo(() => {
    const prompts: string[] = []

    if (!account?.bio) {
      prompts.push('Add a short bio so other members can learn more about you.')
    }

    if (!account?.location) {
      prompts.push('Share your location to match with local buyers and sellers.')
    }

    if (!account?.name) {
      prompts.push('Confirm your display name to personalize your storefront.')
    }

    return prompts
  }, [account])

  const handleInputChange = (field: keyof FormState) => (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { value } = event.target
    setFormState((current) => ({ ...current, [field]: value }))
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setLocalError(null)
    setShowSuccess(false)

    const payload: ProfileAccountUpdateInput = {
      name: formState.name.trim() ? formState.name.trim() : undefined,
      location: formState.location.trim() ? formState.location.trim() : undefined,
      bio: formState.bio.trim() ? formState.bio.trim() : undefined,
    }

    try {
      await onUpdate(payload)
      setShowSuccess(true)
      setIsEditing(false)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'We could not save your profile changes.'
      setLocalError(message)
    }
  }

  const handleCancel = () => {
    setFormState(normalizeAccountToFormState(account))
    setIsEditing(false)
    setLocalError(null)
    setShowSuccess(false)
  }

  return (
    <div className="flex flex-col gap-6">
      {showSuccess ? (
        <div className="rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-700">
          Your profile information has been updated.
        </div>
      ) : null}
      {localError ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {localError}
        </div>
      ) : null}
      {!isLoading && onboardingPrompts.length > 0 ? (
        <aside className="rounded-2xl border border-dashed border-primary/40 bg-primary/5 p-4 text-sm text-primary">
          <p className="font-semibold">Complete your profile</p>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            {onboardingPrompts.map((prompt) => (
              <li key={prompt}>{prompt}</li>
            ))}
          </ul>
          <button
            type="button"
            className="mt-3 inline-flex items-center justify-center rounded-full bg-primary px-4 py-2 text-sm font-semibold text-white transition hover:bg-primary/90"
            onClick={openEditor}
            disabled={isUpdating}
          >
            Update profile
          </button>
        </aside>
      ) : null}
      <AccountInfoCard
        account={account}
        isLoading={isLoading}
        actions={
          <button
            type="button"
            className="inline-flex items-center justify-center rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-60"
            onClick={toggleEditing}
            disabled={isLoading || isUpdating}
          >
            {isEditing ? 'Close editor' : 'Edit profile'}
          </button>
        }
      />
      {isEditing ? (
        <form
          onSubmit={handleSubmit}
          className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
        >
          <fieldset className="grid gap-4" disabled={isUpdating}>
            <legend className="text-base font-semibold text-slate-900">Edit your details</legend>
            <div className="grid gap-2">
              <label htmlFor="profile-name" className="text-sm font-medium text-slate-700">
                Display name
              </label>
              <input
                id="profile-name"
                name="name"
                type="text"
                value={formState.name}
                onChange={handleInputChange('name')}
                autoComplete="name"
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/40"
                placeholder="Add your public display name"
              />
            </div>
            <div className="grid gap-2">
              <label htmlFor="profile-location" className="text-sm font-medium text-slate-700">
                Location
              </label>
              <input
                id="profile-location"
                name="location"
                type="text"
                value={formState.location}
                onChange={handleInputChange('location')}
                autoComplete="address-level2"
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/40"
                placeholder="City, Country"
              />
            </div>
            <div className="grid gap-2">
              <label htmlFor="profile-bio" className="text-sm font-medium text-slate-700">
                Bio
              </label>
              <textarea
                id="profile-bio"
                name="bio"
                rows={5}
                value={formState.bio}
                onChange={handleInputChange('bio')}
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/40"
                placeholder="Share a brief introduction about your experience and what you offer."
              />
              <p className="text-xs text-slate-500">
                Highlight your expertise, the types of items you trade, or anything that helps members trust you.
              </p>
            </div>
            <div className="flex flex-wrap items-center justify-end gap-2 pt-2">
              <button
                type="button"
                className="inline-flex items-center justify-center rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition hover:border-slate-300 hover:text-slate-900"
                onClick={handleCancel}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="inline-flex items-center justify-center rounded-full bg-primary px-4 py-2 text-sm font-semibold text-white transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isUpdating ? 'Saving…' : 'Save changes'}
              </button>
            </div>
          </fieldset>
        </form>
      ) : null}
    </div>
  )
}

export default ProfileOverviewTab
