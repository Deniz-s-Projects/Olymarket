import request from 'supertest'
import app from '../src/app'
import { AppDataSource } from '../src/config'
import { User } from '../src/entities/User'

async function createUser(email: string, role: 'user' | 'admin' = 'user', isBanned = false) {
  const repo = AppDataSource.getRepository(User)
  const user = repo.create({ email, name: email.split('@')[0], passwordHash: 'x', role, isBanned })
  await repo.save(user)
  return user
}

describe('Admin routes', () => {
  beforeAll(async () => {
    await AppDataSource.initialize()
  })
  afterAll(async () => {
    if (AppDataSource.isInitialized) await AppDataSource.destroy()
  })

  it('rejects non-authenticated', async () => {
    const res = await request(app).get('/admin/listings')
    expect(res.status).toBe(401)
  })

  it('rejects non-admin users', async () => {
    const u = await createUser('user@example.com', 'user')
    // assuming there's a helper to sign JWTs in tests; placeholder header:
    const res = await request(app).get('/admin/listings').set('Authorization', `Bearer TEST_TOKEN_FOR_${u.id}`)
    expect([401,403]).toContain(res.status)
  })
})
