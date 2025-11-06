import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import ListingCard from './ListingCard'
import type { Listing } from '../services/listings'

type ListingWithMedia = Listing & { imageUrl?: string | null }

const baseTimestamp = '2024-01-01T00:00:00.000Z'

const createListing = (overrides: Partial<ListingWithMedia> = {}): ListingWithMedia => ({
  id: 'listing-1',
  title: 'Vintage camera',
  description: 'A classic film camera in great condition.',
  price: '120',
  isFree: false,
  isActive: true,
  status: 'active',
  soldAt: null,
  expiresAt: null,
  createdAt: baseTimestamp,
  updatedAt: baseTimestamp,
  owner: {
    id: 'owner-1',
    name: 'Alice',
    location: 'Paris',
    bio: null,
    joinedAt: baseTimestamp,
    updatedAt: baseTimestamp,
  },
  reviewer: null,
  category: {
    id: 'cat-1',
    name: 'Photography',
    slug: 'photography',
  },
  images: [],
  viewsCount: 0,
  savesCount: 0,
  availability: 'Weekends only',
  preferredContactMethod: 'Email',
  publicContact: { label: 'Email alice@example.com' },
  condition: 'good',
  showContactInfo: true,
  imageUrl: null,
  ...overrides,
})

describe('ListingCard', () => {
  const renderListingCard = (listing: ListingWithMedia) =>
    render(
      <MemoryRouter>
        <ListingCard listing={listing} />
      </MemoryRouter>
    )

  it('shows the contact snippet when the seller opts in', () => {
    const listing = createListing()

    renderListingCard(listing)

    expect(screen.getByText('Email alice@example.com')).toBeInTheDocument()
  })

  it('hides the contact snippet when the seller keeps contact info private', () => {
    const listing = createListing({ showContactInfo: false })

    renderListingCard(listing)

    expect(screen.queryByText('Email alice@example.com')).not.toBeInTheDocument()
  })

  it('falls back to the preferred contact label when public contact is not provided', () => {
    const listing = createListing({ publicContact: undefined })

    renderListingCard(listing)

    expect(screen.getByText('Email')).toBeInTheDocument()
  })
})
