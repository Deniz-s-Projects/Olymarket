const STORAGE_KEY = 'marketplace:saved-searches'
const MAX_SAVED_SEARCHES = 10

export type MarketplaceSearchFilters = {
  searchTerm: string
  selectedCategory: string | null
  selectedPriceRangeId: string
  showFreeOnly: boolean
}

export type SavedMarketplaceSearch = MarketplaceSearchFilters & {
  id: string
  label: string
  savedAt: string
}

const isBrowserEnvironment = () => typeof window !== 'undefined' && typeof window.localStorage !== 'undefined'

const createIdentifier = () => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }

  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
}

const sanitizeSavedSearches = (value: unknown): SavedMarketplaceSearch[] => {
  if (!Array.isArray(value)) {
    return []
  }

  return value.flatMap((item) => {
    if (typeof item !== 'object' || item === null) {
      return []
    }

    const candidate = item as Partial<SavedMarketplaceSearch>

    if (
      typeof candidate.id !== 'string' ||
      typeof candidate.label !== 'string' ||
      typeof candidate.savedAt !== 'string' ||
      typeof candidate.searchTerm !== 'string' ||
      typeof candidate.selectedPriceRangeId !== 'string' ||
      typeof candidate.showFreeOnly !== 'boolean' ||
      (candidate.selectedCategory !== null && typeof candidate.selectedCategory !== 'string')
    ) {
      return []
    }

    return [
      {
        id: candidate.id,
        label: candidate.label,
        savedAt: candidate.savedAt,
        searchTerm: candidate.searchTerm,
        selectedCategory: candidate.selectedCategory ?? null,
        selectedPriceRangeId: candidate.selectedPriceRangeId,
        showFreeOnly: candidate.showFreeOnly,
      },
    ]
  })
}

const readFromStorage = (): SavedMarketplaceSearch[] => {
  if (!isBrowserEnvironment()) {
    return []
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) {
      return []
    }

    const parsed = JSON.parse(raw) as unknown
    return sanitizeSavedSearches(parsed)
  } catch (error) {
    console.error('Failed to read saved searches', error)
    return []
  }
}

const persistToStorage = (savedSearches: SavedMarketplaceSearch[]) => {
  if (!isBrowserEnvironment()) {
    throw new Error('Browser storage is unavailable in this environment')
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(savedSearches))
}

const filtersAreEqual = (a: MarketplaceSearchFilters, b: MarketplaceSearchFilters) =>
  a.searchTerm === b.searchTerm &&
  a.selectedCategory === b.selectedCategory &&
  a.selectedPriceRangeId === b.selectedPriceRangeId &&
  a.showFreeOnly === b.showFreeOnly

export const getSavedMarketplaceSearches = (): SavedMarketplaceSearch[] => readFromStorage()

export const saveMarketplaceSearch = ({
  label,
  filters,
}: {
  label: string
  filters: MarketplaceSearchFilters
}): SavedMarketplaceSearch[] => {
  if (!isBrowserEnvironment()) {
    throw new Error('Saving searches requires a browser environment')
  }

  const existing = readFromStorage()
  const updatedTimestamp = new Date().toISOString()

  const duplicateIndex = existing.findIndex((item) => filtersAreEqual(item, filters))

  let nextSavedSearches: SavedMarketplaceSearch[]

  if (duplicateIndex >= 0) {
    nextSavedSearches = existing.map((item, index) =>
      index === duplicateIndex
        ? {
            ...item,
            label,
            savedAt: updatedTimestamp,
          }
        : item,
    )
  } else {
    const freshEntry: SavedMarketplaceSearch = {
      id: createIdentifier(),
      label,
      savedAt: updatedTimestamp,
      ...filters,
    }

    nextSavedSearches = [freshEntry, ...existing].slice(0, MAX_SAVED_SEARCHES)
  }

  persistToStorage(nextSavedSearches)

  return nextSavedSearches
}

export const deleteSavedMarketplaceSearch = (id: string): SavedMarketplaceSearch[] => {
  if (!isBrowserEnvironment()) {
    throw new Error('Deleting searches requires a browser environment')
  }

  const existing = readFromStorage()
  const nextSavedSearches = existing.filter((item) => item.id !== id)
  persistToStorage(nextSavedSearches)
  return nextSavedSearches
}
