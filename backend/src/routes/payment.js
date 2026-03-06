import express from 'express';
import { paymentController } from '../controllers/paymentController.js';
import { authenticate } from '../middleware/authMiddleware.js';

const router = express.Router();

// Payment initiation requires authentication
router.post('/initiate', authenticate, paymentController.initiatePayment);

// Callback from dummy bank (no auth required)
router.post('/callback', paymentController.handleCallback);

// Dummy bank payment page (no auth required)
router.get('/dummy-bank', paymentController.dummyBankPage);

// Get payment status
router.get('/:bookingId/status', authenticate, paymentController.getPaymentStatus);

export default router;
