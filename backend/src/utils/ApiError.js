// An error we throw on purpose, with an HTTP status and a human-readable message.
// Example: throw new ApiError(404, 'Animal not found.');
class ApiError extends Error {
  constructor(statusCode, message) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
  }
}

module.exports = ApiError;
