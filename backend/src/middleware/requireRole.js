// Role-based authorization. Always use this AFTER authMiddleware.
//
// Usage:
//   requireRole('ADMIN')
//   requireRole('FARMER', 'VETERINARY_PROFESSIONAL')
//   requireRole(['ADMIN', 'VETERINARY_PROFESSIONAL'])
//
// This runs on the SERVER, so hiding a page in React is never enough by itself.
const ApiError = require('../utils/ApiError');

const requireRole = (...allowedRoles) => {
  // Support both requireRole('A', 'B') and requireRole(['A', 'B']).
  const roles = allowedRoles.flat();

  return (req, res, next) => {
    if (!req.user) {
      return next(new ApiError(401, 'Authentication required. Please log in.'));
    }

    if (!roles.includes(req.user.role)) {
      return next(new ApiError(403, 'You do not have permission to access this resource.'));
    }

    return next();
  };
};

module.exports = requireRole;
