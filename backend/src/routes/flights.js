import express from 'express';
import { flightController } from '../controllers/flightController.js';
import { authenticate } from '../middleware/authMiddleware.js';
import { validate, validators } from '../utils/validators.js';

const router = express.Router();

// Public routes - no authentication required
router.get('/cities', flightController.getCities);
router.get('/airlines', flightController.getAirlines);

// Protected routes - authentication required
router.post('/search', authenticate, validate(validators.flightSearch), flightController.searchFlights);
router.get('/:id', authenticate, flightController.getFlightDetails);

export default router;
