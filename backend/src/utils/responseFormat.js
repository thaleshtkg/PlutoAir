export const responseFormatter = {
  success: (data, message = 'Success') => ({
    success: true,
    data,
    message,
    timestamp: new Date().toISOString(),
  }),

  error: (code, message, details = null) => ({
    success: false,
    error: {
      code,
      message,
      ...(details && { details }),
    },
    timestamp: new Date().toISOString(),
  }),

  paginated: (data, pagination) => ({
    success: true,
    data,
    pagination,
    timestamp: new Date().toISOString(),
  }),
};

export const httpResponses = {
  // 2xx
  created: (res, data, message = 'Created successfully') => {
    res.status(201).json(responseFormatter.success(data, message));
  },

  ok: (res, data, message = 'Success') => {
    res.status(200).json(responseFormatter.success(data, message));
  },

  // 4xx
  badRequest: (res, message, details = null) => {
    res.status(400).json(responseFormatter.error('BAD_REQUEST', message, details));
  },

  unauthorized: (res, message = 'Unauthorized') => {
    res.status(401).json(responseFormatter.error('UNAUTHORIZED', message));
  },

  forbidden: (res, message = 'Forbidden') => {
    res.status(403).json(responseFormatter.error('FORBIDDEN', message));
  },

  notFound: (res, message = 'Not found') => {
    res.status(404).json(responseFormatter.error('NOT_FOUND', message));
  },

  conflict: (res, message) => {
    res.status(409).json(responseFormatter.error('CONFLICT', message));
  },

  tooManyRequests: (res, message = 'Too many requests') => {
    res.status(429).json(responseFormatter.error('RATE_LIMITED', message));
  },

  // 5xx
  serverError: (res, message = 'Internal server error', details = null) => {
    console.error('Server error:', message);
    res.status(500).json(responseFormatter.error('SERVER_ERROR', message, details));
  },
};
