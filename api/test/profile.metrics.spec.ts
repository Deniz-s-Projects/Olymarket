import request from 'supertest'
import jwt from 'jsonwebtoken'

import app from '../src/app'
import { AppDataSource } from '../src/config'
import { User } from '../src/entities/User'
import { Listing } from '../src/entities/Listing'
import { Offer } from '../src/entities/Offer'
import { closeTestDataSource, initializeTestDataSource } from './utils/test-data-source'

describe('Profile metrics', () => {
  let seller: User
  let token: string

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

    const buyer = await userRepository.save(
      userRepository.create({
        email: 'buyer@example.com',
        passwordHash: 'hashed',
        name: 'Buyer',
        phoneNumber: '0987654321',
        location: null,
        bio: null,
        role: 'user',
      }),
    )

    const otherSeller = await userRepository.save(
      userRepository.create({
        email: 'other@example.com',
        passwordHash: 'hashed',
        name: 'Other',
        phoneNumber: '1111111111',
        location: null,
        bio: null,
        role: 'user',
      }),
    )

    const listingRepository = AppDataSource.getRepository(Listing)
    const listingOne = await listingRepository.save(
      listingRepository.create({
        title: 'Listing One',
        description: 'First listing',
        price: '10.00',
        status: 'active',
        isActive: true,
        viewsCount: 15,
        owner: seller,
      }),
    )

    const listingTwo = await listingRepository.save(
      listingRepository.create({
        title: 'Listing Two',
        description: 'Second listing',
        price: '20.00',
        status: 'active',
        isActive: true,
        viewsCount: 25,
        owner: seller,
      }),
    )

    await listingRepository.save(
      listingRepository.create({
        title: 'Listing Three',
        description: 'Inactive listing',
        price: '30.00',
        status: 'sold',
        isActive: false,
        viewsCount: 5,
        owner: seller,
      }),
    )

    const offerRepository = AppDataSource.getRepository(Offer)
    await offerRepository.save(
      offerRepository.create({
        amount: '8.00',
        status: 'pending',
        listing: listingOne,
        buyer,
        seller,
      }),
    )
    await offerRepository.save(
      offerRepository.create({
        amount: '9.00',
        status: 'accepted',
        listing: listingOne,
        buyer,
        seller,
      }),
    )
    await offerRepository.save(
      offerRepository.create({
        amount: '7.00',
        status: 'pending',
        listing: listingTwo,
        buyer,
        seller: otherSeller,
      }),
    )

    token = jwt.sign({ userId: seller.id }, process.env.JWT_SECRET || 'changeme')
  })

  afterAll(async () => {
    await closeTestDataSource()
  })

  it('returns aggregated metrics for the authenticated seller', async () => {
    const response = await request(app)
      .get('/profile/metrics')
      .set('Authorization', `Bearer ${token}`)

    expect(response.status).toBe(200)
    expect(response.body).toEqual([
      { label: 'Total views', value: 45 },
      { label: 'Active listings', value: 2 },
      { label: 'Inquiries', value: 1 },
    ])
  })
})
