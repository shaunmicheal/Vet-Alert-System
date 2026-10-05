// Zod validation middleware for request bodies, route params and query strings.
//
// On success: unknown keys are stripped and (for the body) `req.body` is replaced
// with clean data. On failure: a single, human-readable 400 error is returned -
// never a raw Zod error dump.
const { z } = require('zod');
const ApiError = require('../utils/ApiError');

const build = (schema, source) => (req, res, next) => {
  const result = schema.safeParse(req[source]);

  if (!result.success) {
    const firstIssue = result.error.issues[0];
    const field = firstIssue && firstIssue.path.length ? firstIssue.path.join('.') : source;
    const message = firstIssue ? `${field}: ${firstIssue.message}` : 'Invalid request.';
    return next(new ApiError(400, message));
  }

  // Only the body is safe to reassign - in Express 5 `req.params`/`req.query`
  // are read-only getters, so we validate those without mutating them.
  if (source === 'body') {
    req.body = result.data;
  }

  return next();
};

const validate = (schema) => build(schema, 'body');
const validateParams = (schema) => build(schema, 'params');
const validateQuery = (schema) => build(schema, 'query');

// A reusable id shape. Real ids come from Prisma's cuid(), which is lowercase
// letters and digits. Anything else is rejected before we touch the database.
const idSchema = z
  .string()
  .trim()
  .regex(/^[A-Za-z0-9_-]{8,64}$/, 'Invalid id');

const idParamSchema = z.object({ id: idSchema });

module.exports = { validate, validateParams, validateQuery, idSchema, idParamSchema };

