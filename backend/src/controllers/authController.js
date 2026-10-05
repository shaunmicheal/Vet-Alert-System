
const bcrypt = require('bcrypt');
const prisma = require('../config/prisma');
const ApiError = require('../utils/ApiError');
const { signToken } = require('../utils/token');
const { sendSuccess } = require('../utils/response');

const SALT_ROUNDS = 10;

const toPublicUser = (user) => ({
  id: user.id,
  name: user.name,
  email: user.email,
  phone: user.phone,
  role: user.role,
  createdAt: user.createdAt,
});

const registerFarmer = async (req, res) => {
  const email = req.body.email.toLowerCase().trim();

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    throw new ApiError(409, 'An account with this email already exists.');
  }

  const hashedPassword = await bcrypt.hash(req.body.password, SALT_ROUNDS);
  const phone = req.body.phone ? req.body.phone.trim() : null;

  const user = await prisma.user.create({
    data: {
      name: req.body.name.trim(),
      email,
      password: hashedPassword,
      phone: phone || null,
      role: 'FARMER',
    },
  });

  const token = signToken(user);
  return sendSuccess(res, { token, user: toPublicUser(user) }, 201);
};

const login = async (req, res) => {
  const email = req.body.email.toLowerCase().trim();

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    throw new ApiError(401, 'Invalid email or password.');
  }

  const passwordMatches = await bcrypt.compare(req.body.password, user.password);
  if (!passwordMatches) {
    throw new ApiError(401, 'Invalid email or password.');
  }

  const token = signToken(user);
  return sendSuccess(res, { token, user: toPublicUser(user) });
};

const getMe = async (req, res) => {
  return sendSuccess(res, { user: req.user });
};

module.exports = { registerFarmer, login, getMe };
