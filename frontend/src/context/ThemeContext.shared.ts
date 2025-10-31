import { createContext } from 'react'
import type { Theme } from './themeStorage'

export type ThemeContextType = {
  theme: Theme
  setTheme: (theme: Theme) => void
  toggleTheme: () => void
}

export const ThemeContext = createContext<ThemeContextType | null>(null)
