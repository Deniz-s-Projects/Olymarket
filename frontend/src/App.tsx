import { type ReactElement } from 'react'
import {
  BrowserRouter,
  NavLink,
  Navigate,
  Route,
  Routes,
  useLocation,
} from 'react-router-dom'

import Auth from './pages/Auth'
import CreateListing from './pages/CreateListing'
import Messages from './pages/Messages'
import Marketplace from './pages/Marketplace'
import Profile from './pages/Profile'
import { useAuth } from './context/useAuth'

const navigation = [
  { to: '/', label: 'Marketplace' },
  { to: '/listings/new', label: 'Create Listing' },
  { to: '/messages', label: 'Messages' },
  { to: '/profile', label: 'Profile' },
  { to: '/conversations', label: 'Conversations' },
]

const RequireAuth = ({ children }: { children: ReactElement }) => {
  const location = useLocation()
  const { token } = useAuth()

  if (!token) {
    return (
      <Navigate
        to="/auth"
        replace
        state={{
          from: location.pathname,
          message: 'Please sign in to continue.',
        }}
      />
    )
  }

  return children
}

const App = () => {
  const { user, logout, isHydrated } = useAuth()
  const userInitial = (user?.name || user?.email || '').charAt(0).toUpperCase()

  return (
    <BrowserRouter>
      <div className="flex min-h-screen flex-col bg-slate-100 text-slate-900">
        <header className="border-b border-slate-200 bg-white/80 backdrop-blur">
          <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
            <NavLink to="/" className="text-2xl font-semibold tracking-tight text-primary">
              Olymarket
            </NavLink>
            <nav className="flex items-center gap-4 text-sm font-medium">
              {navigation.map(({ to, label }) => (
                <NavLink
                  key={to}
                  to={to}
                  className={({ isActive }) =>
                    `rounded-full px-3 py-1 transition-colors ${
                      isActive
                        ? 'bg-primary text-white'
                        : 'text-slate-600 hover:bg-slate-100'
                    }`
                  }
                >
                  {label}
                </NavLink>
              ))}
              {!isHydrated ? (
                <span className="text-slate-400">Loading...</span>
              ) : user ? (
                <div className="flex items-center gap-3">
                  <NavLink to="/profile" className="group flex items-center gap-2">
                    <span className="sr-only">View profile</span>
                    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary transition group-hover:bg-primary group-hover:text-white">
                      {userInitial || '?'}
                    </span>
                    <span className="text-slate-700 group-hover:text-primary">{user.name}</span>
                  </NavLink>
                  <button
                    type="button"
                    onClick={logout}
                    className="rounded-full px-3 py-1 text-slate-600 transition-colors hover:bg-slate-100"
                  >
                    Sign Out
                  </button>
                </div>
              ) : (
                <NavLink
                  to="/auth"
                  className={({ isActive }) =>
                    `rounded-full px-3 py-1 transition-colors ${
                      isActive
                        ? 'bg-primary text-white'
                        : 'text-slate-600 hover:bg-slate-100'
                    }`
                  }
                >
                  Sign In
                </NavLink>
              )}
            </nav>
          </div>
        </header>

        <main className="flex-1">
          <Routes>
            <Route path="/" element={<Marketplace />} />
            <Route path="/listings/new" element={<CreateListing />} />
            <Route
              path="/messages"
              element={
                <RequireAuth>
                  <Messages />
                </RequireAuth>
              }
            />
            <Route path="/profile" element={<Profile />} />
            <Route path="/auth" element={<Auth />} />
            <Route
              path="/conversations"
              element={
                <RequireAuth>
                  <div className="mx-auto max-w-3xl px-4 py-10 text-center text-slate-600">
                    Conversations coming soon.
                  </div>
                </RequireAuth>
              }
            />
          </Routes>
        </main>

        <footer className="border-t border-slate-200 bg-white/80">
          <div className="mx-auto max-w-6xl px-4 py-6 text-sm text-slate-500">
            &copy; {new Date().getFullYear()} Olymarket. All rights reserved.
          </div>
        </footer>
      </div>
    </BrowserRouter>
  )
}

export default App
