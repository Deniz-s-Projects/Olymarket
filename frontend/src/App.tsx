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
import AdminDashboard from './pages/admin/AdminDashboard'
import { useAuth } from './context/useAuth'
import ListingDetails from './pages/ListingDetails'

const navigation = [
  { to: '/', label: 'Marketplace' },
  { to: '/listings/new', label: 'Create Listing' },
  { to: '/messages', label: 'Conversations' },
  { to: '/profile', label: 'Profile' },
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

const RequireAdmin = ({ children }: { children: ReactElement }) => {
  const location = useLocation()
  const { token, isAdmin } = useAuth()

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

  if (!isAdmin) {
    return (
      <Navigate
        to="/"
        replace
        state={{
          message: 'You do not have permission to access this page.',
        }}
      />
    )
  }

  return children
}

const App = () => {
  const { user, logout, isHydrated, isAdmin, isModerator, banNotice, clearBanNotice } =
    useAuth()
  const userInitial = (user?.name || user?.email || '').charAt(0).toUpperCase()

  return (
    <BrowserRouter>
      <div className="flex min-h-screen flex-col bg-slate-100 text-slate-900">
        {banNotice ? (
          <div className="border-b border-amber-200 bg-amber-50">
            <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-3 text-sm text-amber-800 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="font-semibold">Account suspended</p>
                <p>
                  {banNotice.reason
                    ? `Your marketplace access is limited: ${banNotice.reason}`
                    : 'Your marketplace access is currently limited by our moderators.'}
                </p>
                {banNotice.banExpiresAt ? (
                  <p className="text-xs text-amber-700">
                    Suspension details: {banNotice.banExpiresAt}
                  </p>
                ) : null}
                {banNotice.appealUrl ? (
                  <a
                    href={banNotice.appealUrl}
                    className="mt-1 inline-flex text-xs font-semibold underline-offset-2 hover:underline"
                  >
                    Contact support to appeal
                  </a>
                ) : null}
              </div>
              <button
                type="button"
                onClick={clearBanNotice}
                className="self-start rounded-full border border-amber-300 px-3 py-1 text-xs font-semibold text-amber-700 transition hover:bg-amber-100"
              >
                Dismiss
              </button>
            </div>
          </div>
        ) : null}
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
              {isAdmin && (
                <NavLink
                  to="/admin"
                  className={({ isActive }) =>
                    `rounded-full px-3 py-1 transition-colors ${
                      isActive
                        ? 'bg-primary text-white'
                        : 'text-slate-600 hover:bg-slate-100'
                    }`
                  }
                >
                  Admin
                </NavLink>
              )}
              {!isHydrated ? (
                <span className="text-slate-400">Loading...</span>
              ) : user ? (
                <div className="flex items-center gap-3">
                  <NavLink to="/profile" className="group flex items-center gap-2">
                    <span className="sr-only">View profile</span>
                    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary transition group-hover:bg-primary group-hover:text-white">
                      {userInitial || '?'}
                    </span>
                    <span className="flex flex-col text-left text-slate-700 group-hover:text-primary">
                      <span>{user.name}</span>
                      <span className="text-xs font-semibold text-slate-400 group-hover:text-primary/80">
                        {isAdmin ? 'Admin' : isModerator ? 'Moderator' : 'Member'}
                      </span>
                    </span>
                  </NavLink>
                  <button
                    type="button"
                    onClick={() => logout()}
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
            <Route path="/listings/:id/edit" element={<CreateListing />} />
            <Route path="/listings/:id" element={<ListingDetails />} />
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
              path="/admin"
              element={
                <RequireAdmin>
                  <AdminDashboard />
                </RequireAdmin>
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
