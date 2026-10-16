const bcrypt = require('bcrypt');
const prisma = require('../config/prisma');
const ApiError = require('../utils/ApiError');
const { sendSuccess } = require('../utils/response');

const SALT_ROUNDS = 10;

const toSafeUser = (user) => ({
  id: user.id,
  name: user.name,
  email: user.email,
  phone: user.phone,
  role: user.role,
  createdAt: user.createdAt,
  updatedAt: user.updatedAt,
});

const userSelect = {
  id: true,
  name: true,
  email: true,
  phone: true,
  role: true,
  createdAt: true,
  updatedAt: true,
};

const findOwnAccount = (id, select = userSelect) =>
  prisma.user.findUnique({ where: { id }, select });

const updateOwnAccount = (id, data, select = userSelect) =>
  prisma.user.update({ where: { id }, data, select });

const getOwnAccount = async (req, res) => {
  const user = await findOwnAccount(req.user.id);

  if (!user) {
    throw new ApiError(401, 'Your account could not be found. Please log in again.');
  }

  return sendSuccess(res, { user: toSafeUser(user) });
};

const updateOwnProfile = async (req, res) => {
  const data = {};
  if (req.body.name !== undefined) data.name = req.body.name.trim();
  if (req.body.phone !== undefined) {
    const phone = req.body.phone === '' ? null : req.body.phone.trim();
    data.phone = phone || null;
  }

  if (Object.keys(data).length === 0) {
    throw new ApiError(400, 'Provide at least one field to update.');
  }

  const user = await updateOwnAccount(req.user.id, data);

  return sendSuccess(res, { user: toSafeUser(user) });
};

const updateOwnEmail = async (req, res) => {
  const normalizedEmail = req.body.email.toLowerCase().trim();

  const owner = await prisma.user.findUnique({
    where: { id: req.user.id },
    select: { id: true, email: true, password: true },
  });

  if (!owner) {
    throw new ApiError(401, 'Your account could not be found. Please log in again.');
  }

  const passwordMatches = await bcrypt.compare(req.body.currentPassword, owner.password);
  if (!passwordMatches) {
    throw new ApiError(401, 'Your current password is incorrect.');
  }

  if (normalizedEmail === owner.email.toLowerCase()) {
    throw new ApiError(400, 'That is already your current email address.');
  }

  const existing = await prisma.user.findUnique({ where: { email: normalizedEmail } });
  if (existing) {
    throw new ApiError(409, 'An account with this email already exists.');
  }

  const user = await updateOwnAccount(req.user.id, { email: normalizedEmail }).catch((error) => {
    if (error && error.code === 'P2002') {
      throw new ApiError(409, 'An account with this email already exists.');
    }
    throw error;
  });

  return sendSuccess(res, {
    user: toSafeUser(user),
    message: 'Email updated. Please use your new email next time you sign in.',
  });
};

const updateOwnPassword = async (req, res) => {
  const owner = await prisma.user.findUnique({
    where: { id: req.user.id },
    select: { id: true, password: true },
  });

  if (!owner) {
    throw new ApiError(401, 'Your account could not be found. Please log in again.');
  }

  const passwordMatches = await bcrypt.compare(req.body.currentPassword, owner.password);
  if (!passwordMatches) {
    throw new ApiError(401, 'Your current password is incorrect.');
  }

  const sameAsCurrent = await bcrypt.compare(req.body.newPassword, owner.password);
  if (sameAsCurrent) {
    throw new ApiError(400, 'Your new password must be different from the current password.');
  }

  const hashedPassword = await bcrypt.hash(req.body.newPassword, SALT_ROUNDS);
  await prisma.user.update({
    where: { id: req.user.id },
    data: { password: hashedPassword },
  });

  return sendSuccess(res, {
    message:
      'Password updated. Your current session stays signed in on this device, but please sign in again on other devices.',
  });
};

module.exports = { getOwnAccount, updateOwnProfile, updateOwnEmail, updateOwnPassword };
