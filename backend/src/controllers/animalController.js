
const prisma = require('../config/prisma');
const ApiError = require('../utils/ApiError');
const { sendSuccess } = require('../utils/response');
const { getOwnedFarm, requireOwnedAnimal } = require('../services/ownershipService');

const listAnimals = async (req, res) => {
  const animals = await prisma.animal.findMany({
    where: { farm: { farmerId: req.user.id } },
    orderBy: { createdAt: 'desc' },
  });

  return sendSuccess(res, { animals, count: animals.length });
};

const createAnimal = async (req, res) => {
  const farm = await getOwnedFarm(req.user.id);
  if (!farm) {
    throw new ApiError(400, 'Create your farm profile before adding animals.');
  }

  const animal = await prisma.animal.create({
    data: { ...req.body, farmId: farm.id },
  });

  return sendSuccess(res, { animal }, 201);
};

const getAnimal = async (req, res) => {
  const animal = await requireOwnedAnimal(req.user.id, req.params.id);
  return sendSuccess(res, { animal });
};

const updateAnimal = async (req, res) => {
  const existing = await requireOwnedAnimal(req.user.id, req.params.id);

  const animal = await prisma.animal.update({
    where: { id: existing.id },
    data: req.body,
  });

  return sendSuccess(res, { animal });
};

const deleteAnimal = async (req, res) => {
  const existing = await requireOwnedAnimal(req.user.id, req.params.id);

  await prisma.animal.delete({ where: { id: existing.id } });

  return sendSuccess(res, { message: 'Animal deleted.' });
};

module.exports = { listAnimals, createAnimal, getAnimal, updateAnimal, deleteAnimal };
