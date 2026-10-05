// Central error handling for the whole API.
//
// `notFound` runs when no route matched the request.
// `errorHandler` runs for every error passed to next(err) or thrown inside a handler.
// Keeping this in one place means controllers stay small and we never leak secrets
// or raw stack traces to the client.
const { env } = require('../config/env');
const ApiError = require('../utils/ApiError');

// Runs after all routes: anything that reaches here did not match a route.
const notFound = (req, res, next) => {
  next(new ApiError(404, `Route not found: ${req.method} ${req.originalUrl}`));
};

// Turns Prisma error codes into human-readable messages.
// Example: P2025 is "record not found" in Prisma - we never show the raw code.
const prismaMessageFor = (code) => {
  switch (code) {
    case 'P2002':
      return 'That value is already in use.';
    case 'P2025':
      return 'Unable to find that record.';
    case 'P2003':
      return 'This action refers to a record that does not exist.';
    default:
      return 'A database error occurred. Please try again.';
  }
};

// eslint-disable-next-line no-unused-vars -- Express needs all 4 arguments to treat this as an error handler.
const errorHandler = (err, req, res, next) => {
  // 1. The client sent malformed JSON.
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ success: false, message: 'Invalid JSON in the request body.' });
  }

  // 2. An error we threw on purpose (has a known status + friendly message).
  if (err instanceof ApiError) {
    return res.status(err.statusCode).json({ success: false, message: err.message });
  }

  // 3. A known Prisma database error.
  if (err.name === 'PrismaClientKnownRequestError' && err.code) {
    return res.status(400).json({ success: false, message: prismaMessageFor(err.code) });
  }

  // 4. A Prisma validation error (bad query shape) - our fault, not the client's.
  if (err.name === 'PrismaClientValidationError') {
    if (env.NODE_ENV !== 'production') {
      console.error('[error] Prisma validation error:', err.message);
    }
    return res.status(500).json({ success: false, message: 'Something went wrong on our side. Please try again.' });
  }

  // 5. Anything else - log for developers, but never expose internals in production.
  if (env.NODE_ENV !== 'production') {
    console.error('[error]', err);
  }
  return res.status(500).json({
    success: false,
    message: 'Something went wrong on our side. Please try again.',
  });
};

module.exports = { notFound, errorHandler };
