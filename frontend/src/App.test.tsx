import { render, screen, waitFor } from '@testing-library/react'
import App from './App'
import { vi } from 'vitest'
import { useAuth } from './context/useAuth'
import * as adminService from './services/admin'
import * as listingService from './services/listings'

vi.mock('./context/useAuth', () => ({
  useAuth: vi.fn(),
}))

vi.mock('./services/admin', async () => {
  const actual = await vi.importActual<typeof import('./services/admin')>('./services/admin')
  return {
    ...actual,
    fetchAdminListings: vi.fn(),
    fetchAdminUsers: vi.fn(),
    approveListing: vi.fn(),
    rejectListing: vi.fn(),
    deleteListing: vi.fn(),
    updateAdminListing: vi.fn(),
    banUser: vi.fn(),
    unbanUser: vi.fn(),
  }
})

vi.mock('./services/listings', async () => {
  const actual = await vi.importActual<typeof import('./services/listings')>('./services/listings')
  return {
    ...actual,
    fetchListings: vi.fn(),
    fetchListingCategories: vi.fn(),
  }
})

const mockUseAuth = vi.mocked(useAuth)
const mockFetchAdminListings = vi.mocked(adminService.fetchAdminListings)
const mockFetchAdminUsers = vi.mocked(adminService.fetchAdminUsers)
const mockFetchListings = vi.mocked(listingService.fetchListings)
const mockFetchListingCategories = vi.mocked(listingService.fetchListingCategories)

const baseAuthState = {
  user: { id: 1, name: 'Test User', email: 'test@example.com', role: 'user', isBanned: false },
  token: 'token',
  isHydrated: true,
  isAdmin: false,
  isModerator: false,
  isBanned: false,
  banNotice: null,
  login: vi.fn(),
  logout: vi.fn(),
  refreshSession: vi.fn(),
  clearBanNotice: vi.fn(),
}

describe('App admin route protection', () => {
  beforeEach(() => {
    mockUseAuth.mockReturnValue({
      ...baseAuthState,
      login: vi.fn(),
      logout: vi.fn(),
      refreshSession: vi.fn(),
      clearBanNotice: vi.fn(),
    })
    mockFetchAdminListings.mockResolvedValue([])
    mockFetchAdminUsers.mockResolvedValue([])
    mockFetchListings.mockResolvedValue([])
    mockFetchListingCategories.mockResolvedValue([])
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('redirects non-admin users when navigating to /admin', async () => {
    window.history.pushState({}, 'Admin', '/admin')
    render(<App />)

    await waitFor(() => {
      expect(screen.queryByTestId('admin-dashboard')).not.toBeInTheDocument()
    })
    expect(screen.getByRole('link', { name: /Marketplace/i })).toBeInTheDocument()
  })

  it('allows admin users to access the admin dashboard', async () => {
    const adminAuthState = {
      ...baseAuthState,
      isAdmin: true,
      isModerator: true,
      user: { ...baseAuthState.user, role: 'admin' as const },
    }
    const listingSample = [{
      id: 'listing-1',
      title: 'Rowing Machine',
      description: 'A great rowing machine',
      price: '100.00',
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      owner: { id: 'owner-1', name: 'Owner', email: 'owner@example.com' },
      category: { id: 'cat-1', name: 'Fitness', slug: 'fitness' },
      availability: 'Weekdays',
      contactPreference: 'Email',
      moderation: { status: 'pending', notes: null },
    }]

    mockUseAuth.mockReturnValue({
      ...adminAuthState,
      login: vi.fn(),
      logout: vi.fn(),
      refreshSession: vi.fn(),
      clearBanNotice: vi.fn(),
    })
    mockFetchAdminListings.mockResolvedValue(listingSample)
    mockFetchAdminUsers.mockResolvedValue([])
    mockFetchListingCategories.mockResolvedValue([])

    window.history.pushState({}, 'Admin', '/admin')
    render(<App />)

    expect(await screen.findByTestId('admin-dashboard')).toBeInTheDocument()
    expect(screen.getAllByRole('link', { name: /^Admin$/ })).toHaveLength(1)
    expect(await screen.findByText('Rowing Machine')).toBeInTheDocument()
  })
})
