
const prisma = require('../config/prisma');
const ApiError = require('../utils/ApiError');
const { sendSuccess } = require('../utils/response');
const { getOwnedFarm } = require('../services/ownershipService');
const getFarm = async (req, res) => {
  const farm = await getOwnedFarm(req.user.id);
  return sendSuccess(res, { farm: farm || null });
};

const createFarm = async (req, res) => {
  const existing = await getOwnedFarm(req.user.id);
  if (existing) {
    throw new ApiError(409, 'You already have a farm profile.');
  }

  const farm = await prisma.farm.create({
    data: { ...req.body, farmerId: req.user.id },
  });

  return sendSuccess(res, { farm }, 201);
};

const updateFarm = async (req, res) => {
  const existing = await getOwnedFarm(req.user.id);
  if (!existing) {
    throw new ApiError(404, 'You have not created a farm profile yet.');
  }

  const farm = await prisma.farm.update({
    where: { id: existing.id },
    data: req.body,
  });

  return sendSuccess(res, { farm });
};

const deleteFarm = async (req, res) => {
  const existing = await getOwnedFarm(req.user.id);
  if (!existing) {
    throw new ApiError(404, 'You have not created a farm profile yet.');
  }

  await prisma.farm.delete({ where: { id: existing.id } });

  return sendSuccess(res, {
    message: 'Farm profile deleted. Its animals and health reports were removed too.',
  });
};

module.exports = { getFarm, createFarm, updateFarm, deleteFarm };
