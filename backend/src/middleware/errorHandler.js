import { httpResponses } from '../utils/responseFormat.js';

export const errorHandler = (err, req, res, next) => {
  console.error('Error:', err);

  if (err.type === 'entity.parse.failed') {
    return httpResponses.badRequest(res, 'Invalid JSON');
  }

  // PostgreSQL unique-violation error code — more reliable than string matching on the message.
  if (err.code === '23505') {
    return httpResponses.conflict(res, 'Resource already exists');
  }

  // Never expose raw error internals (stack traces, SQL, column names) to API clients in production.
  const message = process.env.NODE_ENV === 'production'
    ? 'Internal server error'
    : (err.message || 'Internal server error');

  return httpResponses.serverError(res, message);
};

export const notFoundHandler = (req, res) => {
  httpResponses.notFound(res, `Route ${req.method} ${req.path} not found`);
};

export const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};
