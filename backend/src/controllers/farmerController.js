
const prisma = require('../config/prisma');
const ApiError = require('../utils/ApiError');
const { sendSuccess } = require('../utils/response');
const { getOwnedFarm } = require('../services/ownershipService');
const getFarm = async (req, res) => {
  const farm = await getOwnedFarm(req.user.id);
  return sendSuccess(res, { farm: farm || null });
};

// POST /api/farmer/farm
const createFarm = async (req, res) => {
  const existing = await getOwnedFarm(req.user.id);
  if (existing) {
    throw new ApiError(409, 'You already have a farm profile.');
  }

  // req.body is already validated and stripped of unknown keys by the route.
  const farm = await prisma.farm.create({
    data: { ...req.body, farmerId: req.user.id },
  });

  return sendSuccess(res, { farm }, 201);
};

// PUT/PATCH /api/farmer/farm  (updates only the fields that were sent)
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

// DELETE /api/farmer/farm
// Note: the schema cascades - deleting a farm also removes its animals and
// health reports. The message tells the farmer exactly what happened.
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
