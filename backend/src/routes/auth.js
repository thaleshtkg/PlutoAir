import express from 'express';
import { authController } from '../controllers/authController.js';
import { validate, validators } from '../utils/validators.js';
import { rateLimit } from '../middleware/rateLimiter.js';
import { authenticate } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/login', rateLimit({ maxRequests: 5, countFailedOnly: true }), validate(validators.login), authController.login);
router.post('/register', validate(validators.register), authController.register);
router.post('/logout', authenticate, authController.logout);
router.post('/refresh', authController.refresh);
router.get('/me', authenticate, authController.me);
router.post('/guest-check', authController.guestCheck);

export default router;
