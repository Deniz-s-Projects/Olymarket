import { BrowserRouter, NavLink, Route, Routes } from 'react-router-dom'

import Auth from './pages/Auth'
import CreateListing from './pages/CreateListing'
import Marketplace from './pages/Marketplace'
import Profile from './pages/Profile'

const navigation = [
  { to: '/', label: 'Marketplace' },
  { to: '/listings/new', label: 'Create Listing' },
  { to: '/profile', label: 'Profile' },
  { to: '/auth', label: 'Sign In' },
]

const App = () => {
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
            </nav>
          </div>
        </header>

        <main className="flex-1">
          <Routes>
            <Route path="/" element={<Marketplace />} />
            <Route path="/listings/new" element={<CreateListing />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/auth" element={<Auth />} />
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
