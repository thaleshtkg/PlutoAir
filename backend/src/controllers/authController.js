import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';
import { GuestAttempt } from '../models/GuestAttempt.js';
import { httpResponses } from '../utils/responseFormat.js';
import { asyncHandler } from '../middleware/errorHandler.js';

const generateTokens = (user) => {
  const accessToken = jwt.sign(
    { id: user.id || 'admin-user', email: user.email, is_guest: user.is_guest },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRY || '3600s' }
  );

  const refreshToken = jwt.sign(
    { id: user.id || 'admin-user', email: user.email },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: process.env.JWT_REFRESH_EXPIRY || '604800s' }
  );

  return { accessToken, refreshToken };
};

export const authController = {
  login: asyncHandler(async (req, res) => {
    const { username, password } = req.body;

    // Check if it's guest login
    const isGuest = username === 'admin' && password === 'admin@123';

    if (isGuest) {
      const clientId = req.headers['x-forwarded-for'] || req.ip || req.connection.remoteAddress;

      // Check if guest limit reached
      const isLimited = await GuestAttempt.isLimitReached(clientId);
      if (isLimited) {
        return httpResponses.forbidden(
          res,
          'You have reached the maximum number of guest sessions (20). Please create an account to continue.'
        );
      }

      // Increment guest attempt counter
      await GuestAttempt.increment(clientId);

      const guestUser = {
        id: 'guest-' + clientId,
        email: 'guest@demo.com',
        full_name: 'Demo Guest',
        is_guest: true,
      };

      const tokens = generateTokens(guestUser);
      const attemptsRemaining = await GuestAttempt.getAttemptsRemaining(clientId);

      return httpResponses.ok(res, {
        user: guestUser,
        tokens,
        session_remaining: attemptsRemaining,
      });
    }

    // Regular user login
    const user = await User.findByEmail(username);
    if (!user || !(await User.verifyPassword(password, user.password_hash))) {
      return httpResponses.unauthorized(res, 'Invalid username or password');
    }

    const tokens = generateTokens(user);
    return httpResponses.ok(res, { user, tokens });
  }),

  register: asyncHandler(async (req, res) => {
    const { full_name, email, mobile, password } = req.validated;

    // Check if user already exists
    const existingUser = await User.findByEmail(email);
    if (existingUser) {
      return httpResponses.conflict(res, 'Email already registered');
    }

    const user = await User.create({
      full_name,
      email,
      mobile,
      password,
      is_guest: false,
    });

    const tokens = generateTokens(user);
    return httpResponses.created(res, { user, tokens }, 'User registered successfully');
  }),

  logout: asyncHandler(async (req, res) => {
    // In a production app, you'd invalidate the token in a blacklist
    // For now, just send success response
    return httpResponses.ok(res, {}, 'Logged out successfully');
  }),

  refresh: asyncHandler(async (req, res) => {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return httpResponses.badRequest(res, 'Refresh token required');
    }

    try {
      const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
      if (decoded.id === 'admin-user' || decoded.id?.startsWith('guest-')) {
        const guestUser = {
          id: decoded.id,
          email: decoded.email || 'guest@demo.com',
          is_guest: true,
        };
        const tokens = generateTokens(guestUser);
        return httpResponses.ok(res, {
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken,
        });
      }

      const user = await User.findById(decoded.id);

      if (!user) {
        return httpResponses.unauthorized(res, 'User not found');
      }

      const tokens = generateTokens(user);
      // Return tokens flat so the client can destructure { accessToken, refreshToken } directly
      return httpResponses.ok(res, {
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
      });
    } catch (err) {
      return httpResponses.unauthorized(res, 'Invalid refresh token');
    }
  }),

  me: asyncHandler(async (req, res) => {
    if (!req.user) {
      return httpResponses.unauthorized(res, 'Not authenticated');
    }

    if (req.user.id === 'admin-user' || req.user.id?.startsWith('guest-')) {
      return httpResponses.ok(res, {
        id: req.user.id,
        email: req.user.email,
        is_guest: req.user.is_guest,
      });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return httpResponses.notFound(res, 'User not found');
    }

    return httpResponses.ok(res, {
      id: user.id,
      email: user.email,
      full_name: user.full_name,
      is_guest: user.is_guest,
    });
  }),

  guestCheck: asyncHandler(async (req, res) => {
    const clientId = req.headers['x-forwarded-for'] || req.ip || req.connection.remoteAddress;
    const attemptsRemaining = await GuestAttempt.getAttemptsRemaining(clientId);
    const isLimited = await GuestAttempt.isLimitReached(clientId);

    return httpResponses.ok(res, {
      attemptsRemaining,
      isLimited,
      limit: parseInt(process.env.GUEST_SESSION_LIMIT || '20'),
    });
  }),
};
