// Helpers for creating and checking JWT login tokens.
const jwt = require('jsonwebtoken');
const { env } = require('../config/env');

// The token only stores the user id ("sub") and role.
// The role is re-checked against the database on every request (see authMiddleware).
const signToken = (user) => {
  return jwt.sign({ sub: user.id, role: user.role }, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN,
  });
};

const verifyToken = (token) => {
  return jwt.verify(token, env.JWT_SECRET);
};

module.exports = { signToken, verifyToken };
