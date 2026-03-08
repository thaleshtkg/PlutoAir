import 'dotenv/config.js';
import express from 'express';
import cors from 'cors';
import authRoutes from './routes/auth.js';
import flightRoutes from './routes/flights.js';
import bookingRoutes from './routes/booking.js';
import paymentRoutes from './routes/payment.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';

// Fail fast if critical env vars are missing — prevents silent runtime errors.
const REQUIRED_ENV = ['JWT_SECRET', 'JWT_REFRESH_SECRET', 'DB_HOST', 'CORS_ORIGIN'];
if (process.env.NODE_ENV !== 'test') {
  for (const key of REQUIRED_ENV) {
    if (!process.env[key]) {
      throw new Error(`Missing required environment variable: ${key}`);
    }
  }
}

const app = express();
const PORT = process.env.PORT || 5000;

// Trust the first proxy hop so req.ip reflects the real client IP (used by rate limiter).
app.set('trust proxy', 1);

// CORS must be registered before body parsers so preflight and error responses
// still carry Access-Control-Allow-Origin headers.
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true,
  optionsSuccessStatus: 200,
}));

// Body parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/flights', flightRoutes);
app.use('/api/booking', bookingRoutes);
app.use('/api/payment', paymentRoutes);

// 404 Handler
app.use(notFoundHandler);

// Global Error Handler (must be last)
app.use(errorHandler);

// Start server unless running in test environment (tests import this module directly).
if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`✓ Server running on http://localhost:${PORT}`);
    console.log(`✓ Environment: ${process.env.NODE_ENV || 'development'}`);
  });
}

export default app;
