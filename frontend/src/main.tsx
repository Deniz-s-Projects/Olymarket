import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { AuthProvider, readStoredAuth } from './context/AuthContext.tsx'

const initialAuth = readStoredAuth()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider initialAuth={initialAuth}>
      <App />
    </AuthProvider>
  </StrictMode>,
)
