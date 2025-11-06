import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import ListingTable from './ListingTable'
import type { ProfileListingWithActions } from '../../types/profile'

const baseTimestamp = '2024-01-01T00:00:00.000Z'

const createProfileListing = (
  overrides: Partial<ProfileListingWithActions> = {}
): ProfileListingWithActions => ({
  id: 'listing-1',
  title: 'Vintage camera',
  category: 'Photography',
  price: 120,
  currency: '€',
  status: 'active',
  updatedAt: baseTimestamp,
  soldAt: null,
  expiresAt: null,
  thumbnailUrl: undefined,
  availability: 'Weekends only',
  preferredContactMethod: 'Email',
  publicContact: { label: 'Email alice@example.com' },
  showContactInfo: true,
  actions: {
    editUrl: '/listings/1/edit',
    statusOptions: [],
  },
  ...overrides,
})

describe('ListingTable', () => {
  const renderListingTable = (listings: ProfileListingWithActions[]) =>
    render(
      <MemoryRouter>
        <ListingTable listings={listings} title="Active listings" />
      </MemoryRouter>
    )

  it('shows the contact row when the listing shares contact info', () => {
    const listing = createProfileListing()

    renderListingTable([listing])

    expect(screen.getByText('Email alice@example.com')).toBeInTheDocument()
  })

  it('hides the contact row when the listing keeps contact private', () => {
    const listing = createProfileListing({ showContactInfo: false })

    renderListingTable([listing])

    expect(screen.queryByText('Email alice@example.com')).not.toBeInTheDocument()
  })

  it('falls back to the preferred contact label when public contact is missing', () => {
    const listing = createProfileListing({ publicContact: undefined })

    renderListingTable([listing])

    expect(screen.getByText('Email')).toBeInTheDocument()
  })
})
