import { useCallback, useEffect, useState, type ReactNode } from 'react'
import { readStoredTheme, writeStoredTheme, type Theme } from './themeStorage'
import { ThemeContext } from './ThemeContext.shared'

type ThemeProviderProps = {
  children: ReactNode
  initialTheme?: Theme
}

export const ThemeProvider = ({ children, initialTheme }: ThemeProviderProps) => {
  const [theme, setThemeState] = useState<Theme>(() => {
    // Priority: initialTheme > stored preference > system preference
    if (initialTheme) return initialTheme
    
    const stored = readStoredTheme()
    if (stored) return stored
    
    // Check system preference
    if (typeof window !== 'undefined' && window.matchMedia) {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
      return prefersDark ? 'dark' : 'light'
    }
    
    return 'light'
  })

  const setTheme = useCallback((newTheme: Theme) => {
    setThemeState(newTheme)
    writeStoredTheme(newTheme)
  }, [])

  const toggleTheme = useCallback(() => {
    setTheme(theme === 'light' ? 'dark' : 'light')
  }, [theme, setTheme])

  // Apply theme to document
  useEffect(() => {
    const root = document.documentElement
    if (theme === 'dark') {
      root.classList.add('dark')
    } else {
      root.classList.remove('dark')
    }
  }, [theme])

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}
