import { httpResponses } from '../utils/responseFormat.js';

const rateLimitStore = new Map();

// Use req.ip which Express normalises correctly when `trust proxy` is set in app.js.
// Reading x-forwarded-for directly is spoofable — a client could send any IP to bypass limits.
const getClientId = (req) => req.ip || req.socket?.remoteAddress || 'unknown-client';

export const rateLimit = (options = {}) => {
  const {
    windowMs = 10 * 60 * 1000, // 10 minutes
    maxRequests = 5,
    message = 'Too many attempts. Please try again later.',
    countFailedOnly = false,
  } = options;

  return (req, res, next) => {
    const clientId = getClientId(req);
    const now = Date.now();
    const windowStart = now - windowMs;

    if (!rateLimitStore.has(clientId)) {
      rateLimitStore.set(clientId, []);
    }

    let attempts = rateLimitStore.get(clientId);
    attempts = attempts.filter((time) => time > windowStart);
    rateLimitStore.set(clientId, attempts);

    if (attempts.length >= maxRequests) {
      const oldestAttempt = Math.min(...attempts);
      const retryAfterMs = Math.max(0, oldestAttempt + windowMs - now);
      const retryAfterSec = Math.ceil(retryAfterMs / 1000);

      res.set('Retry-After', retryAfterSec);
      return httpResponses.tooManyRequests(
        res,
        `${message} Retry after ${retryAfterSec} seconds.`
      );
    }

    if (countFailedOnly) {
      // Count only failed responses (4xx/5xx) so successful logins are never penalized.
      res.on('finish', () => {
        if (res.statusCode >= 400) {
          const current = rateLimitStore.get(clientId) || [];
          current.push(Date.now());
          rateLimitStore.set(clientId, current);
        }
      });
    } else {
      attempts.push(now);
      rateLimitStore.set(clientId, attempts);
    }

    next();
  };
};

// Cleanup old entries periodically
const cleanupTimer = setInterval(() => {
  const now = Date.now();
  for (const [clientId, attempts] of rateLimitStore.entries()) {
    const filtered = attempts.filter((time) => time > now - 60 * 60 * 1000); // 1 hour
    if (filtered.length === 0) {
      rateLimitStore.delete(clientId);
    } else {
      rateLimitStore.set(clientId, filtered);
    }
  }
}, 60 * 1000); // Run every minute

cleanupTimer.unref?.();
