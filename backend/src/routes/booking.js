import express from 'express';
import { bookingController } from '../controllers/bookingController.js';
import { authenticate } from '../middleware/authMiddleware.js';

const router = express.Router();

// All booking routes require authentication
router.use(authenticate);

router.post('/', bookingController.createBooking);
// Static segment must come before the dynamic /:bookingId to avoid shadowing.
router.get('/ticket/:bookingRef', bookingController.getTicket);
router.get('/:bookingId', bookingController.getBooking);
router.post('/:bookingId/passengers', bookingController.addPassengers);
router.post('/:bookingId/addons', bookingController.addAddOns);
router.get('/:bookingId/summary', bookingController.getSummary);
router.post('/:bookingId/confirm', bookingController.confirmBooking);

export default router;
