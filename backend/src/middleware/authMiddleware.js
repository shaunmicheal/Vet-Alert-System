// Checks the "Authorization: Bearer <token>" header on protected routes.
//
// The token only proves "this person logged in". After verifying it we re-load the
// user from the database so that:
//   - deleted accounts stop working immediately, and
//   - the role used for authorization is always the current one.
// The loaded user (without the password) is attached to `req.user`.
const prisma = require('../config/prisma');
const ApiError = require('../utils/ApiError');
const { verifyToken } = require('../utils/token');

const authMiddleware = async (req, res, next) => {
  try {
    const header = req.headers.authorization || '';

    if (!header.startsWith('Bearer ')) {
      throw new ApiError(401, 'Authentication required. Please log in.');
    }

    const token = header.slice('Bearer '.length).trim();
    if (!token) {
      throw new ApiError(401, 'Authentication required. Please log in.');
    }

    let payload;
    try {
      payload = verifyToken(token);
    } catch {
      // Covers expired tokens and tampered tokens alike.
      throw new ApiError(401, 'Your session is invalid or has expired. Please log in again.');
    }

    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
      select: { id: true, name: true, email: true, phone: true, role: true, createdAt: true },
    });

    if (!user) {
      throw new ApiError(401, 'Your account could not be found. Please log in again.');
    }

    req.user = user;
    return next();
  } catch (err) {
    return next(err);
  }
};

module.exports = authMiddleware;
