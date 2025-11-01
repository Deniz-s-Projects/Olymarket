import { type ReactElement, useEffect, useRef, useState } from 'react'
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
import Groups from './pages/Groups'
import WantedBoard from './pages/WantedBoard'
import { useAuth } from './context/useAuth'
import ListingDetails from './pages/ListingDetails'
import ThemeToggle from './components/ThemeToggle'
import SellerAnalytics from './pages/SellerAnalytics'
import Announcements from './pages/Announcements'
import CommunityDiscussions from './pages/CommunityDiscussions'

const navigation = [
  { to: '/', label: 'Marketplace' },
  // { to: '/wanted', label: 'Buyer Requests' },
  { to: '/listings/new', label: 'Create Listing' },
  { to: '/groups', label: 'Groups' },
  { to: '/announcements', label: 'Announcements' },
  { to: '/community', label: 'Community' },
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
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const mobileMenuButtonRef = useRef<HTMLButtonElement | null>(null)
  const firstMobileLinkRef = useRef<HTMLAnchorElement | null>(null)

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsMobileMenuOpen(false)
      }
    }

    if (isMobileMenuOpen) {
      document.addEventListener('keydown', handleKeyDown)
      if (firstMobileLinkRef.current) {
        firstMobileLinkRef.current.focus()
      }
    } else if (mobileMenuButtonRef.current) {
      mobileMenuButtonRef.current.focus()
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isMobileMenuOpen])

  return (
    <BrowserRouter>
      <div className="flex min-h-screen flex-col bg-slate-100 text-slate-900 dark:bg-slate-900 dark:text-slate-100">
        {banNotice ? (
          <div className="border-b border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950">
            <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-3 text-sm text-amber-800 dark:text-amber-200 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="font-semibold">Account suspended</p>
                <p>
                  {banNotice.reason
                    ? `Your marketplace access is limited: ${banNotice.reason}`
                    : 'Your marketplace access is currently limited by our moderators.'}
                </p>
                {banNotice.banExpiresAt ? (
                  <p className="text-xs text-amber-700 dark:text-amber-300">
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
                className="self-start rounded-full border border-amber-300 px-3 py-1 text-xs font-semibold text-amber-700 transition hover:bg-amber-100 dark:border-amber-700 dark:text-amber-300 dark:hover:bg-amber-900"
              >
                Dismiss
              </button>
            </div>
          </div>
        ) : null}
        <header className="border-b border-slate-200 bg-white/80 backdrop-blur dark:border-slate-700 dark:bg-slate-800/80">
          <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
            <NavLink to="/" className="text-2xl font-semibold tracking-tight text-primary dark:text-white">
              Olymarket
            </NavLink>
            <nav className="hidden items-center gap-4 text-sm font-medium lg:flex">
              {navigation.map(({ to, label }) => (
                <NavLink
                  key={to}
                  to={to}
                  className={({ isActive }) =>
                    `rounded-full px-3 py-1 transition-colors ${
                      isActive
                        ? 'bg-primary text-white dark:bg-slate-700'
                        : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-700'
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
                        ? 'bg-primary text-white dark:bg-slate-700'
                        : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-700'
                    }`
                  }
                >
                  Admin
                </NavLink>
              )}
              <ThemeToggle />
              {!isHydrated ? (
                <span className="text-slate-400 dark:text-slate-500">Loading...</span>
              ) : user ? (
                <div className="flex items-center gap-3">
                  <NavLink to="/profile" className="group flex items-center gap-2">
                    <span className="sr-only">View profile</span>
                    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary transition group-hover:bg-primary group-hover:text-white dark:bg-slate-700 dark:text-slate-300 dark:group-hover:bg-slate-600">
                      {userInitial || '?'}
                    </span>
                    <span className="flex flex-col text-left text-slate-700 group-hover:text-primary dark:text-slate-300 dark:group-hover:text-white">
                      <span>{user.name}</span>
                      <span className="text-xs font-semibold text-slate-400 group-hover:text-primary/80 dark:text-slate-500 dark:group-hover:text-slate-300">
                        {isAdmin ? 'Admin' : isModerator ? 'Moderator' : 'Member'}
                      </span>
                    </span>
                  </NavLink>
                  <button
                    type="button"
                    onClick={() => logout()}
                    className="rounded-full px-3 py-1 text-slate-600 transition-colors hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-700"
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
                        ? 'bg-primary text-white dark:bg-slate-700'
                        : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-700'
                    }`
                  }
                >
                  Sign In
                </NavLink>
              )}
            </nav>
            <button
              type="button"
              ref={mobileMenuButtonRef}
              className="inline-flex items-center justify-center rounded-md p-2 text-slate-600 transition hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 dark:text-slate-300 dark:hover:bg-slate-700 dark:focus:ring-offset-slate-900 lg:hidden"
              aria-label="Toggle navigation menu"
              aria-controls="mobile-menu"
              aria-expanded={isMobileMenuOpen}
              onClick={() => setIsMobileMenuOpen((prev) => !prev)}
            >
              <svg
                className="h-6 w-6"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                aria-hidden="true"
              >
                {isMobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 5.25h16.5M3.75 12h16.5m-16.5 6.75h16.5" />
                )}
              </svg>
            </button>
          </div>
          {isMobileMenuOpen ? (
            <div
              id="mobile-menu"
              className="lg:hidden"
            >
              <div className="border-t border-slate-200 bg-white/95 px-4 pb-6 pt-2 shadow-md backdrop-blur dark:border-slate-700 dark:bg-slate-800/95">
                <div className="flex flex-col gap-3 text-sm font-medium text-slate-700 dark:text-slate-200">
                  {navigation.map(({ to, label }, index) => (
                    <NavLink
                      key={to}
                      to={to}
                      ref={index === 0 ? firstMobileLinkRef : null}
                      className={({ isActive }) =>
                        `rounded-lg px-3 py-2 transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 dark:focus:ring-offset-slate-900 ${
                          isActive
                            ? 'bg-primary text-white dark:bg-slate-700'
                            : 'text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-700'
                        }`
                      }
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      {label}
                    </NavLink>
                  ))}
                  {isAdmin ? (
                    <NavLink
                      to="/admin"
                      className={({ isActive }) =>
                        `rounded-lg px-3 py-2 transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 dark:focus:ring-offset-slate-900 ${
                          isActive
                            ? 'bg-primary text-white dark:bg-slate-700'
                            : 'text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-700'
                        }`
                      }
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      Admin
                    </NavLink>
                  ) : null}
                  <div className="flex items-center justify-between rounded-lg bg-slate-100 px-3 py-2 dark:bg-slate-700">
                    <span className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-300">
                      Theme
                    </span>
                    <ThemeToggle />
                  </div>
                  {!isHydrated ? (
                    <span className="rounded-lg px-3 py-2 text-slate-400 dark:text-slate-500">Loading...</span>
                  ) : user ? (
                    <div className="space-y-3 rounded-lg bg-slate-100 p-3 dark:bg-slate-700">
                      <div className="flex items-center gap-3">
                        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-base font-semibold text-primary dark:bg-slate-600 dark:text-slate-200">
                          {userInitial || '?'}
                        </span>
                        <div className="flex flex-col text-slate-700 dark:text-slate-200">
                          <span className="font-semibold">{user.name}</span>
                          <span className="text-xs text-slate-500 dark:text-slate-300">
                            {isAdmin ? 'Admin' : isModerator ? 'Moderator' : 'Member'}
                          </span>
                        </div>
                      </div>
                      <NavLink
                        to="/profile"
                        className={({ isActive }) =>
                          `block rounded-lg px-3 py-2 text-center text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 dark:focus:ring-offset-slate-900 ${
                            isActive
                              ? 'bg-primary text-white dark:bg-slate-600'
                              : 'bg-white text-slate-700 hover:bg-slate-100 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-600'
                          }`
                        }
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        View Profile
                      </NavLink>
                      <button
                        type="button"
                        onClick={() => {
                          setIsMobileMenuOpen(false)
                          logout()
                        }}
                        className="w-full rounded-lg bg-slate-900 px-3 py-2 text-sm font-semibold text-white transition hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 dark:bg-slate-900 dark:hover:bg-slate-800 dark:focus:ring-offset-slate-900"
                      >
                        Sign Out
                      </button>
                    </div>
                  ) : (
                    <NavLink
                      to="/auth"
                      className={({ isActive }) =>
                        `rounded-lg px-3 py-2 text-center text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 dark:focus:ring-offset-slate-900 ${
                          isActive
                            ? 'bg-primary text-white dark:bg-slate-700'
                            : 'bg-slate-900 text-white hover:bg-slate-700 dark:bg-slate-900 dark:hover:bg-slate-800'
                        }`
                      }
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      Sign In
                    </NavLink>
                  )}
                </div>
              </div>
            </div>
          ) : null}
        </header>

        <main className="flex-1">
          <Routes>
            <Route path="/" element={<Marketplace />} />
            <Route path="/wanted" element={<WantedBoard />} />
            <Route path="/listings/new" element={<CreateListing />} />
            <Route path="/listings/:id/edit" element={<CreateListing />} />
            <Route path="/listings/:id" element={<ListingDetails />} />
            <Route path="/groups" element={<Groups />} />
            <Route
              path="/announcements"
              element={
                <RequireAuth>
                  <Announcements />
                </RequireAuth>
              }
            />

            <Route
              path="/community"
              element={
                <RequireAuth>
                  <CommunityDiscussions />
                </RequireAuth>
              }
            />
            <Route
              path="/messages"
              element={
                <RequireAuth>
                  <Messages />
                </RequireAuth>
              }
            />
            <Route path="/profile" element={<Profile />} />
            <Route
              path="/seller/analytics"
              element={
                <RequireAuth>
                  <SellerAnalytics />
                </RequireAuth>
              }
            />
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

        <footer className="border-t border-slate-200 bg-white/80 dark:border-slate-700 dark:bg-slate-800/80">
          <div className="mx-auto max-w-6xl px-4 py-6 text-sm text-slate-500 dark:text-slate-400">
            &copy; {new Date().getFullYear()} Olymarket. All rights reserved.
          </div>
        </footer>
      </div>
    </BrowserRouter>
  )
}

export default App
