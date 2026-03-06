import express from 'express';
import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { rateLimit } from '../../../backend/src/middleware/rateLimiter.js';

describe('rateLimit middleware', () => {
  it('counts only failed requests when countFailedOnly is enabled', async () => {
    const app = express();
    app.use(
      rateLimit({
        maxRequests: 2,
        windowMs: 60_000,
        countFailedOnly: true,
      })
    );
    app.get('/probe', (req, res) => {
      const status = Number(req.query.status || 200);
      return res.status(status).json({ ok: status < 400 });
    });

    await request(app).get('/probe?status=200').set('x-forwarded-for', '1.2.3.4').expect(200);
    await request(app).get('/probe?status=401').set('x-forwarded-for', '1.2.3.4').expect(401);
    await request(app).get('/probe?status=401').set('x-forwarded-for', '1.2.3.4').expect(401);

    // Third failure within the window should now be blocked.
    await request(app).get('/probe?status=401').set('x-forwarded-for', '1.2.3.4').expect(429);
  });
});
