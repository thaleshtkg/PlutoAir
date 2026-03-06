import { httpResponses } from '../utils/responseFormat.js';

export const errorHandler = (err, req, res, next) => {
  console.error('Error:', err);

  if (err.type === 'entity.parse.failed') {
    return httpResponses.badRequest(res, 'Invalid JSON');
  }

  if (err.message.includes('duplicate key')) {
    return httpResponses.conflict(res, 'Resource already exists');
  }

  return httpResponses.serverError(res, err.message || 'Internal server error');
};

export const notFoundHandler = (req, res) => {
  httpResponses.notFound(res, `Route ${req.method} ${req.path} not found`);
};

export const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};
