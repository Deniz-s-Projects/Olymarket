import request from 'supertest'

import app from '../src/app'
import { AppDataSource } from '../src/config'
import { ListingCategory } from '../src/entities/ListingCategory'
import { Listing } from '../src/entities/Listing'
import { User } from '../src/entities/User'
import { closeTestDataSource, initializeTestDataSource } from './utils/test-data-source'

describe('Listings routes', () => {
  let seller: User
  let servicesCategory: ListingCategory
  let electronicsCategory: ListingCategory

  beforeAll(async () => {
    await initializeTestDataSource()

    const userRepository = AppDataSource.getRepository(User)
    seller = await userRepository.save(
      userRepository.create({
        email: 'seller@example.com',
        passwordHash: 'hashed',
        name: 'Seller',
        phoneNumber: '1234567890',
        location: null,
        bio: null,
        role: 'user',
      }),
    )

    const categoryRepository = AppDataSource.getRepository(ListingCategory)
    servicesCategory = await categoryRepository.save(
      categoryRepository.create({ name: 'Services', slug: 'services' }),
    )
    electronicsCategory = await categoryRepository.save(
      categoryRepository.create({ name: 'Electronics', slug: 'electronics' }),
    )

    const listingRepository = AppDataSource.getRepository(Listing)
    const futureDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)

    await listingRepository.save(
      listingRepository.create({
        title: 'Services Listing',
        description: 'Offered service',
        price: '10.00',
        isFree: false,
        isActive: true,
        status: 'active',
        moderationStatus: 'approved',
        availability: null,
        preferredContactMethod: null,
        condition: 'good',
        owner: seller,
        category: servicesCategory,
        expiresAt: futureDate,
      }),
    )

    await listingRepository.save(
      listingRepository.create({
        title: 'Electronics Listing',
        description: 'Gadget for sale',
        price: '25.00',
        isFree: false,
        isActive: true,
        status: 'active',
        moderationStatus: 'approved',
        availability: null,
        preferredContactMethod: null,
        condition: 'good',
        owner: seller,
        category: electronicsCategory,
        expiresAt: futureDate,
      }),
    )

    await listingRepository.save(
      listingRepository.create({
        title: 'General Listing',
        description: 'No category listing',
        price: '5.00',
        isFree: true,
        isActive: true,
        status: 'active',
        moderationStatus: 'approved',
        availability: null,
        preferredContactMethod: null,
        condition: 'used_but_works',
        owner: seller,
        category: null,
        expiresAt: futureDate,
      }),
    )
  })

  afterAll(async () => {
    await closeTestDataSource()
  })

  it('filters listings by category slug when provided', async () => {
    const response = await request(app)
      .get('/listings')
      .query({ categorySlug: servicesCategory.slug })

    expect(response.status).toBe(200)
    expect(response.body.data).toHaveLength(1)
    expect(response.body.data[0].title).toBe('Services Listing')
    expect(response.body.data[0].category.slug).toBe(servicesCategory.slug)
  })

  it('prioritizes category slug over category name', async () => {
    const response = await request(app)
      .get('/listings')
      .query({ categorySlug: electronicsCategory.slug, category: servicesCategory.name })

    expect(response.status).toBe(200)
    expect(response.body.data).toHaveLength(1)
    expect(response.body.data[0].title).toBe('Electronics Listing')
    expect(response.body.data[0].category.slug).toBe(electronicsCategory.slug)
  })

  it('supports filtering by category identifier', async () => {
    const response = await request(app)
      .get('/listings')
      .query({ categoryId: electronicsCategory.id })

    expect(response.status).toBe(200)
    expect(response.body.data).toHaveLength(1)
    expect(response.body.data[0].category.id).toBe(electronicsCategory.id)
  })

  it('falls back to case-insensitive name matching when no slug or id is provided', async () => {
    const response = await request(app)
      .get('/listings')
      .query({ category: servicesCategory.name.toUpperCase() })

    expect(response.status).toBe(200)
    expect(response.body.data).toHaveLength(1)
    expect(response.body.data[0].category.name).toBe(servicesCategory.name)
  })
})
