const THEME_STORAGE_KEY = 'olymarket-theme'

export type Theme = 'light' | 'dark'

export const readStoredTheme = (): Theme | null => {
  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY)
    if (stored === 'light' || stored === 'dark') {
      return stored
    }
    return null
  } catch {
    return null
  }
}

export const writeStoredTheme = (theme: Theme): void => {
  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme)
  } catch {
    // Silently fail if localStorage is not available
  }
}

export const clearStoredTheme = (): void => {
  try {
    localStorage.removeItem(THEME_STORAGE_KEY)
  } catch {
    // Silently fail if localStorage is not available
  }
}
