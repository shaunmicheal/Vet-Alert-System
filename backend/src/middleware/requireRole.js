const ApiError = require('../utils/ApiError');

const requireRole = (...allowedRoles) => {
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
