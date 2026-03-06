import request from 'supertest';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';

let app;
let dbHelpers;
let db;

describe('DB-backed e2e: login -> search -> booking -> payment', () => {
  beforeAll(async () => {
    process.env.NODE_ENV = 'test';
    process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret';
    process.env.JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'test-refresh-secret';

    ({ default: app } = await import('../../src/app.js'));
    dbHelpers = await import('../helpers/testDb.js');
    ({ default: db } = await import('../../src/db/connection.js'));

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

  it('persists successful payment confirmation end-to-end', async () => {
    const login = await request(app)
      .post('/api/auth/login')
      .send({ username: 'admin', password: 'admin@123' })
      .expect(200);
    const accessToken = login.body.data.tokens.accessToken;

    const search = await request(app)
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

    expect(search.body.data.length).toBeGreaterThan(0);
    const selectedFlight = search.body.data[0];

    const bookingRes = await request(app)
      .post('/api/booking')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        flight_id: selectedFlight.id,
        travel_date: '2030-01-10',
        trip_type: 'ONE_WAY',
        passenger_count: 1,
      })
      .expect(201);

    const bookingId = bookingRes.body.data.id;
    const bookingBeforePayment = await db('bookings').where({ id: bookingId }).first();

    const initiateRes = await request(app)
      .post('/api/payment/initiate')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        bookingId,
        payment_method: 'UPI',
        amount: Number(bookingBeforePayment.total_amount),
      })
      .expect(200);

    const paymentToken = initiateRes.body.data.payment_token;
    expect(paymentToken).toBeTruthy();

    await request(app)
      .post('/api/payment/callback')
      .send({
        token: paymentToken,
        status: 'SUCCESS',
      })
      .expect(200);

    const persistedBooking = await db('bookings').where({ id: bookingId }).first();
    const persistedPayment = await db('payments').where({ booking_id: bookingId }).first();

    expect(persistedBooking.status).toBe('CONFIRMED');
    expect(persistedPayment.status).toBe('SUCCESS');
  });
});
