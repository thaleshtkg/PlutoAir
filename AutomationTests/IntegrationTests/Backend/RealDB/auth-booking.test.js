import request from 'supertest';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';

let app;
let dbHelpers;
let db;

describe('DB-backed integration: auth + booking persistence', () => {
  beforeAll(async () => {
    process.env.NODE_ENV = 'test';
    process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret';
    process.env.JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'test-refresh-secret';

    ({ default: app } = await import('../../../../backend/src/app.js'));
    dbHelpers = await import('../../../helpers/testDb.js');
    ({ default: db } = await import('../../../../backend/src/db/connection.js'));

    await dbHelpers.resetSeedData();
  });

  beforeEach(async () => {
    await dbHelpers.beginTestTransaction();
  });

  afterEach(async () => {
    await dbHelpers.rollbackTestTransaction();
  });

  afterAll(async () => {
    await dbHelpers.closeDb();
  });

  it('persists registered users in PostgreSQL', async () => {
    const payload = {
      full_name: 'Integration Test User',
      email: 'integration.user@example.com',
      mobile: '9876543210',
      password: 'TestPass@123',
    };

    const response = await request(app).post('/api/auth/register').send(payload).expect(201);
    expect(response.body.success).toBe(true);
    expect(response.body.data.user.email).toBe(payload.email);

    const userRow = await db('users').where({ email: payload.email }).first();
    expect(userRow).toBeTruthy();
    expect(userRow.password_hash).not.toBe(payload.password);
  });

  it('creates booking, passengers and addons with persisted rows', async () => {
    const login = await request(app)
      .post('/api/auth/login')
      .send({ username: 'admin', password: 'admin@123' })
      .expect(200);
    const accessToken = login.body.data.tokens.accessToken;

    const flight = await db('flights').first();
    const travelDate = '2030-01-10';

    const bookingRes = await request(app)
      .post('/api/booking')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        flight_id: flight.id,
        travel_date: travelDate,
        trip_type: 'ONE_WAY',
        passenger_count: 1,
      })
      .expect(201);

    const bookingId = bookingRes.body.data.id;
    expect(bookingId).toBeTruthy();

    await request(app)
      .post(`/api/booking/${bookingId}/passengers`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        passengers: [
          {
            full_name: 'Passenger One',
            age_category: 'ADULT',
            date_of_birth: '1990-05-10',
            gender: 'MALE',
            nationality: 'Indian',
            passport_id: 'A1234567',
          },
        ],
      })
      .expect(200);

    await request(app)
      .post(`/api/booking/${bookingId}/addons`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        addons: [
          {
            addon_type: 'MEAL',
            description: 'Vegetarian Meal',
            quantity: 1,
            unit_price: 280,
            total_price: 280,
          },
        ],
      })
      .expect(200);

    const persistedBooking = await db('bookings').where({ id: bookingId }).first();
    const persistedPassengers = await db('passengers').where({ booking_id: bookingId }).select('*');
    const persistedAddons = await db('booking_addons').where({ booking_id: bookingId }).select('*');

    expect(persistedBooking).toBeTruthy();
    expect(persistedPassengers).toHaveLength(1);
    expect(persistedAddons).toHaveLength(1);
  });
});
