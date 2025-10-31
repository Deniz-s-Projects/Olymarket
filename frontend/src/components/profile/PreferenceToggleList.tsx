import { useEffect, useState } from 'react'
import type { ProfilePreferenceKey, ProfilePreferenceToggle } from '../../types/profile'

type PreferenceToggleListProps = {
  preferences: ProfilePreferenceToggle[]
  isLoading?: boolean
  isSaving?: boolean
  error?: string | null
  lastUpdatedPreferenceId?: ProfilePreferenceKey | null
  onChange?: (id: ProfilePreferenceKey, enabled: boolean) => Promise<unknown> | void
}

const PreferenceToggleList = ({
  preferences,
  isLoading = false,
  isSaving = false,
  error = null,
  lastUpdatedPreferenceId = null,
  onChange,
}: PreferenceToggleListProps) => {
  const [toggles, setToggles] = useState(preferences)
  const [isOpen, setIsOpen] = useState(true)
  const itemClasses =
    'flex flex-col gap-3 rounded-xl border border-slate-100 bg-slate-50 p-4 transition hover:border-primary/30 md:flex-row md:items-center md:justify-between'
  const toggleBaseClasses =
    'relative inline-flex h-6 w-11 flex-shrink-0 items-center rounded-full transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2'
  const indicatorBaseClasses =
    'inline-block h-5 w-5 transform rounded-full bg-white shadow transition duration-200'

  useEffect(() => {
    setToggles(preferences)
  }, [preferences])

  const handleToggle = async (id: ProfilePreferenceKey) => {
    const previousToggles = toggles
    setToggles((current) =>
      current.map((toggle) =>
        toggle.id === id ? { ...toggle, enabled: !toggle.enabled } : toggle
      )
    )

    const toggledPreference = previousToggles.find((toggle) => toggle.id === id)
    const nextEnabled = toggledPreference ? !toggledPreference.enabled : true

    if (!onChange) {
      return
    }

    try {
      await onChange(id, nextEnabled)
    } catch (toggleError) {
      console.error('Failed to update preference', toggleError)
      setToggles(previousToggles)
    }
  }

  const toggleSectionVisibility = () => {
    setIsOpen((current) => !current)
  }

  const contentClasses = `${isOpen ? 'mt-4 space-y-4' : 'hidden'} md:mt-4 md:space-y-4 md:block`

  const lastUpdatedLabel =
    lastUpdatedPreferenceId &&
    toggles.find((toggle) => toggle.id === lastUpdatedPreferenceId)?.label

  const statusMessage = (() => {
    if (error) {
      return {
        text: error,
        tone: 'error' as const,
      }
    }

    if (isSaving) {
      return {
        text: 'Saving your changes…',
        tone: 'muted' as const,
      }
    }

    if (lastUpdatedLabel) {
      return {
        text: `${lastUpdatedLabel} updated successfully.`,
        tone: 'success' as const,
      }
    }

    return null
  })()

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <header className="flex items-center justify-between gap-2">
        <h2 className="text-lg font-semibold text-slate-900">Communication Preferences</h2>
        <button
          type="button"
          className="inline-flex items-center gap-2 text-sm font-medium text-primary md:hidden"
          onClick={toggleSectionVisibility}
          aria-expanded={isOpen}
        >
          {isOpen ? 'Hide' : 'Show'}
          <span aria-hidden="true">▾</span>
        </button>
      </header>
      <p className={`${isOpen ? 'mt-2' : 'hidden'} text-sm text-slate-500 md:mt-2 md:block`}>
        Choose how you want to receive alerts and updates from the marketplace.
      </p>
      {toggles.length > 0 ? (
        <ul className={contentClasses}>
          {toggles.map((toggle) => (
            <li
              key={toggle.id}
              className={itemClasses}
            >
              <div>
                <p className="text-sm font-semibold text-slate-900">{toggle.label}</p>
                {toggle.description ? (
                  <p className="text-sm text-slate-600">{toggle.description}</p>
                ) : null}
              </div>
              <button
                type="button"
                onClick={() => handleToggle(toggle.id)}
                className={`${toggle.enabled ? 'bg-primary' : 'bg-slate-300'} ${toggleBaseClasses}`}
                aria-pressed={toggle.enabled}
                disabled={isSaving}
              >
                <span className="sr-only">Toggle {toggle.label}</span>
                <span
                  aria-hidden="true"
                  className={`${toggle.enabled ? 'translate-x-5' : 'translate-x-0'} ${indicatorBaseClasses}`}
                />
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className={`${isOpen ? 'mt-4' : 'hidden'} text-sm text-slate-500 md:mt-4 md:block`}>
          {isLoading
            ? 'Loading your communication preferences…'
            : 'You have not configured any communication preferences yet.'}
        </p>
      )}
      {statusMessage ? (
        <p
          className={`mt-4 text-sm ${
            statusMessage.tone === 'error'
              ? 'text-red-600'
              : statusMessage.tone === 'success'
              ? 'text-emerald-600'
              : 'text-slate-500'
          }`}
        >
          {statusMessage.text}
        </p>
      ) : null}
    </section>
  )
}

export default PreferenceToggleList
