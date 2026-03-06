import request from 'supertest';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockGuestIsLimitReached = vi.fn();
const mockGuestIncrement = vi.fn();
const mockGuestAttemptsRemaining = vi.fn();
const mockFlightSearch = vi.fn();

vi.mock('../../src/db/connection.js', () => {
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

vi.mock('../../src/models/User.js', () => ({
  User: {
    findByEmail: vi.fn(),
    verifyPassword: vi.fn(),
    findById: vi.fn(),
  },
}));

vi.mock('../../src/models/GuestAttempt.js', () => ({
  GuestAttempt: {
    isLimitReached: mockGuestIsLimitReached,
    increment: mockGuestIncrement,
    getAttemptsRemaining: mockGuestAttemptsRemaining,
  },
}));

vi.mock('../../src/models/Flight.js', () => ({
  City: { findAll: vi.fn(async () => []) },
  Airline: { findAll: vi.fn(async () => []) },
  Flight: {
    search: mockFlightSearch,
    findById: vi.fn(),
  },
}));

describe('guest login -> refresh -> flight search', () => {
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
    mockFlightSearch.mockResolvedValue([
      { id: 'f1', flight_number: '6E-201', base_price_adult: 3499, duration_mins: 125 },
    ]);
  });

  it('supports guest refresh and keeps search working', async () => {
    const { default: app } = await import('../../src/app.js');

    const loginRes = await request(app)
      .post('/api/auth/login')
      .set('x-forwarded-for', '20.20.20.20')
      .send({ username: 'admin', password: 'admin@123' })
      .expect(200);

    const accessToken = loginRes.body.data.tokens.accessToken;
    const refreshToken = loginRes.body.data.tokens.refreshToken;

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

    const refreshRes = await request(app)
      .post('/api/auth/refresh')
      .send({ refreshToken })
      .expect(200);

    expect(refreshRes.body.data.accessToken).toBeTruthy();

    await request(app)
      .post('/api/flights/search')
      .set('Authorization', `Bearer ${refreshRes.body.data.accessToken}`)
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
