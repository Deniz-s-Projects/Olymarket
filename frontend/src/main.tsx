import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { AuthProvider } from './context/AuthContext.tsx'
import { readStoredAuth } from './context/authStorage.ts'
import { ThemeProvider } from './context/ThemeContext.tsx'
import { readStoredTheme } from './context/themeStorage.ts'

const initialAuth = readStoredAuth()
const initialTheme = readStoredTheme() ?? undefined

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider initialTheme={initialTheme}>
      <AuthProvider initialAuth={initialAuth}>
        <App />
      </AuthProvider>
    </ThemeProvider>
  </StrictMode>,
)
