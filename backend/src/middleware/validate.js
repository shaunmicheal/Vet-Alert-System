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

  if (source === 'body') {
    req.body = result.data;
  }

  return next();
};

const validate = (schema) => build(schema, 'body');
const validateParams = (schema) => build(schema, 'params');
const validateQuery = (schema) => build(schema, 'query');

const idSchema = z
  .string()
  .trim()
  .regex(/^[A-Za-z0-9_-]{8,64}$/, 'Invalid id');

const idParamSchema = z.object({ id: idSchema });

module.exports = { validate, validateParams, validateQuery, idSchema, idParamSchema };

