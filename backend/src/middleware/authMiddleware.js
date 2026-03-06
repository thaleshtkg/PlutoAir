import jwt from 'jsonwebtoken';
import { httpResponses } from '../utils/responseFormat.js';

export const authenticate = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    return httpResponses.unauthorized(res, 'No token provided');
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return httpResponses.unauthorized(res, 'Token expired');
    }
    return httpResponses.unauthorized(res, 'Invalid token');
  }
};

export const optionalAuth = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];

  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = decoded;
    } catch (err) {
      // Token invalid, but optional so continue
    }
  }
  next();
};
