const { env } = require('../config/env');
const ApiError = require('../utils/ApiError');

const notFound = (req, res, next) => {
  next(new ApiError(404, `Route not found: ${req.method} ${req.originalUrl}`));
};

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
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ success: false, message: 'Invalid JSON in the request body.' });
  }

  if (err instanceof ApiError) {
    return res.status(err.statusCode).json({ success: false, message: err.message });
  }

  if (err.name === 'PrismaClientKnownRequestError' && err.code) {
    return res.status(400).json({ success: false, message: prismaMessageFor(err.code) });
  }

  if (err.name === 'PrismaClientValidationError') {
    if (env.NODE_ENV !== 'production') {
      console.error('[error] Prisma validation error:', err.message);
    }
    return res.status(500).json({ success: false, message: 'Something went wrong on our side. Please try again.' });
  }

  if (env.NODE_ENV !== 'production') {
    console.error('[error]', err);
  }
  return res.status(500).json({
    success: false,
    message: 'Something went wrong on our side. Please try again.',
  });
};

module.exports = { notFound, errorHandler };
