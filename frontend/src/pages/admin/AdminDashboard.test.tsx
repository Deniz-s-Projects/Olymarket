import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi } from 'vitest'

import AdminDashboard from './AdminDashboard'
import * as adminService from '../../services/admin'
import * as listingService from '../../services/listings'

vi.mock('../../services/admin', async () => {
  const actual = await vi.importActual<typeof import('../../services/admin')>('../../services/admin')
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

vi.mock('../../services/listings', async () => {
  const actual = await vi.importActual<typeof import('../../services/listings')>('../../services/listings')
  return {
    ...actual,
    fetchListingCategories: vi.fn(),
  }
})

const mockFetchAdminListings = vi.mocked(adminService.fetchAdminListings)
const mockFetchAdminUsers = vi.mocked(adminService.fetchAdminUsers)
const mockApproveListing = vi.mocked(adminService.approveListing)
const mockBanUser = vi.mocked(adminService.banUser)
const mockFetchListingCategories = vi.mocked(listingService.fetchListingCategories)

const listingSample = {
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
  moderation: { status: 'pending' as const, notes: null },
}

const userSample = {
  id: 'user-1',
  name: 'Alex Admin',
  email: 'alex@example.com',
  role: 'member' as const,
  joinedAt: new Date().toISOString(),
  isBanned: false,
  banReason: null,
  banExpiresAt: null,
}

const categoriesSample = [{ id: 'cat-1', name: 'Fitness', slug: 'fitness' }]

const setupDashboard = async () => {
  mockFetchAdminListings.mockResolvedValue([listingSample])
  mockFetchAdminUsers.mockResolvedValue([userSample])
  mockFetchListingCategories.mockResolvedValue(categoriesSample)

  render(<AdminDashboard />)

  await screen.findByText(listingSample.title)
}

describe('AdminDashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders listings and users', async () => {
    await setupDashboard()

    expect(screen.getByText(listingSample.title)).toBeInTheDocument()
    expect(screen.getByText(userSample.name)).toBeInTheDocument()
  })

  it('approves a listing when action triggered', async () => {
    mockApproveListing.mockResolvedValue({
      ...listingSample,
      moderation: { status: 'approved', notes: null },
    })
    await setupDashboard()

    const user = userEvent.setup()
    await user.click(screen.getByRole('button', { name: /approve/i }))

    await waitFor(() => {
      expect(mockApproveListing).toHaveBeenCalledWith(listingSample.id, { moderationNotes: undefined })
    })
    expect(await screen.findByText('Listing approved.')).toBeInTheDocument()
    const row = screen.getByTestId('admin-listing-row')
    expect(within(row).getByText('Approved')).toBeInTheDocument()
  })

  it('bans a user when a reason is provided', async () => {
    const promptSpy = vi.spyOn(window, 'prompt').mockReturnValue('Violation of rules')
    mockBanUser.mockResolvedValue({
      ...userSample,
      isBanned: true,
      banReason: 'Violation of rules',
    })

    await setupDashboard()

    const user = userEvent.setup()
    await user.click(screen.getByRole('button', { name: /ban user/i }))

    await waitFor(() => {
      expect(mockBanUser).toHaveBeenCalledWith(userSample.id, { reason: 'Violation of rules' })
    })
    expect(await screen.findByText('User banned.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /lift ban/i })).toBeInTheDocument()

    promptSpy.mockRestore()
  })
})
