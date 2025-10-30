import { useEffect, useRef } from 'react'
import type { KeyboardEvent } from 'react'

export type ProfileTabConfig = {
  id: string
  label: string
}

type ProfileTabsProps = {
  tabs: ProfileTabConfig[]
  activeTabId: string
  onTabChange: (tabId: string) => void
  ariaLabel?: string
  baseId?: string
}

const ProfileTabs = ({
  tabs,
  activeTabId,
  onTabChange,
  ariaLabel = 'Profile sections',
  baseId = 'profile-tabs',
}: ProfileTabsProps) => {
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([])

  useEffect(() => {
    if (!tabs.some((tab) => tab.id === activeTabId) && tabs.length > 0) {
      onTabChange(tabs[0].id)
    }
  }, [activeTabId, onTabChange, tabs])

  const focusTabAtIndex = (index: number) => {
    const clampedIndex = (index + tabs.length) % tabs.length
    const targetRef = tabRefs.current[clampedIndex]

    if (targetRef) {
      targetRef.focus()
    }

    const targetTab = tabs[clampedIndex]
    if (targetTab) {
      onTabChange(targetTab.id)
    }
  }

  const handleKeyDown = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    if (tabs.length === 0) {
      return
    }

    switch (event.key) {
      case 'ArrowRight':
      case 'ArrowDown': {
        event.preventDefault()
        focusTabAtIndex(index + 1)
        break
      }
      case 'ArrowLeft':
      case 'ArrowUp': {
        event.preventDefault()
        focusTabAtIndex(index - 1)
        break
      }
      case 'Home': {
        event.preventDefault()
        focusTabAtIndex(0)
        break
      }
      case 'End': {
        event.preventDefault()
        focusTabAtIndex(tabs.length - 1)
        break
      }
      case 'Enter':
      case ' ': {
        event.preventDefault()
        const targetTab = tabs[index]
        if (targetTab) {
          onTabChange(targetTab.id)
        }
        break
      }
      default:
        break
    }
  }

  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      className="flex flex-wrap items-center gap-2 rounded-2xl border border-slate-200 bg-white p-2 shadow-sm"
    >
      {tabs.map((tab, index) => {
        const isActive = tab.id === activeTabId
        const tabId = `${baseId}-tab-${tab.id}`
        const panelId = `${baseId}-panel-${tab.id}`
        const baseClasses =
          'inline-flex items-center rounded-full px-4 py-2 text-sm font-medium transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary'
        const activeClasses = 'bg-primary text-white shadow-sm'
        const inactiveClasses =
          'border border-slate-200 bg-white text-slate-600 hover:border-primary/40 hover:text-slate-900'

        return (
          <button
            key={tab.id}
            ref={(element) => {
              tabRefs.current[index] = element
            }}
            type="button"
            role="tab"
            id={tabId}
            aria-selected={isActive}
            aria-controls={panelId}
            tabIndex={isActive ? 0 : -1}
            className={`${baseClasses} ${isActive ? activeClasses : inactiveClasses}`}
            onClick={() => onTabChange(tab.id)}
            onKeyDown={(event) => handleKeyDown(event, index)}
          >
            {tab.label}
          </button>
        )
      })}
    </div>
  )
}

export default ProfileTabs
