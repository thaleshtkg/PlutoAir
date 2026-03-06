import jwt from 'jsonwebtoken';
import request from 'supertest';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockUserFindByEmail = vi.fn();
const mockUserVerifyPassword = vi.fn();
const mockUserFindById = vi.fn();
const mockGuestIsLimitReached = vi.fn();
const mockGuestIncrement = vi.fn();
const mockGuestAttemptsRemaining = vi.fn();
const mockFlightSearch = vi.fn();

vi.mock('../../../../backend/src/db/connection.js', () => {
  const chain = {
    where: vi.fn(() => chain),
    first: vi.fn(async () => null),
    insert: vi.fn(() => chain),
    update: vi.fn(() => chain),
    returning: vi.fn(async () => []),
    select: vi.fn(async () => []),
    whereRaw: vi.fn(() => chain),
  };
  const db = Object.assign(() => chain, {
    raw: vi.fn(async () => [{ ok: 1 }]),
  });
  return { default: db };
});

vi.mock('../../../../backend/src/models/User.js', () => ({
  User: {
    findByEmail: mockUserFindByEmail,
    verifyPassword: mockUserVerifyPassword,
    findById: mockUserFindById,
  },
}));

vi.mock('../../../../backend/src/models/GuestAttempt.js', () => ({
  GuestAttempt: {
    isLimitReached: mockGuestIsLimitReached,
    increment: mockGuestIncrement,
    getAttemptsRemaining: mockGuestAttemptsRemaining,
  },
}));

vi.mock('../../../../backend/src/models/Flight.js', () => ({
  City: { findAll: vi.fn(async () => []) },
  Airline: { findAll: vi.fn(async () => []) },
  Flight: {
    search: mockFlightSearch,
    findById: vi.fn(),
  },
}));

describe('auth + flights integration', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    process.env.NODE_ENV = 'test';
    process.env.JWT_SECRET = 'test-secret';
    process.env.JWT_REFRESH_SECRET = 'test-refresh-secret';
    process.env.JWT_EXPIRY = '3600s';
    process.env.JWT_REFRESH_EXPIRY = '604800s';
    mockGuestIsLimitReached.mockResolvedValue(false);
    mockGuestIncrement.mockResolvedValue({});
    mockGuestAttemptsRemaining.mockResolvedValue(19);
  });

  it('does not rate-limit successful logins', async () => {
    const { default: app } = await import('../../../../backend/src/app.js');
    mockUserFindByEmail.mockResolvedValue({
      id: 'u-1',
      email: 'user@example.com',
      password_hash: 'hashed',
      is_guest: false,
    });
    mockUserVerifyPassword.mockResolvedValue(true);

    for (let i = 0; i < 6; i += 1) {
      await request(app)
        .post('/api/auth/login')
        .set('x-forwarded-for', '10.10.10.10')
        .send({ username: 'user@example.com', password: 'Password@123' })
        .expect(200);
    }
  });

  it('validates flight search payload and returns flights when valid', async () => {
    const { default: app } = await import('../../../../backend/src/app.js');
    const accessToken = jwt.sign(
      { id: 'u-1', email: 'user@example.com', is_guest: false },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );
    mockFlightSearch.mockResolvedValue([
      { id: 'f1', flight_number: '6E-201', base_price_adult: 3499, duration_mins: 125 },
    ]);

    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 30);
    const travel_date = futureDate.toISOString().split('T')[0];

    await request(app)
      .post('/api/flights/search')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        origin_id: 1,
        destination_id: 2,
        travel_date,
      })
      .expect(400);

    const response = await request(app)
      .post('/api/flights/search')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        origin_id: 1,
        destination_id: 2,
        travel_date,
        adults: 1,
        children: 0,
        newborns: 0,
      })
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.data).toHaveLength(1);
    expect(mockFlightSearch).toHaveBeenCalledTimes(1);
  });

  it('rejects past travel dates and accepts far-future dates', async () => {
    const { default: app } = await import('../../../../backend/src/app.js');
    const accessToken = jwt.sign(
      { id: 'u-1', email: 'user@example.com', is_guest: false },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );
    mockFlightSearch.mockResolvedValue([]);

    // Past date should be rejected
    const pastDate = new Date();
    pastDate.setDate(pastDate.getDate() - 1);
    await request(app)
      .post('/api/flights/search')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        origin_id: 1,
        destination_id: 2,
        travel_date: pastDate.toISOString().split('T')[0],
        adults: 1,
        children: 0,
        newborns: 0,
      })
      .expect(400);

    // A far-future date (years ahead) should be accepted
    await request(app)
      .post('/api/flights/search')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        origin_id: 1,
        destination_id: 2,
        travel_date: '2030-01-10',
        adults: 1,
        children: 0,
        newborns: 0,
      })
      .expect(200);
  });
});
