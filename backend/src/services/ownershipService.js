const prisma = require('../config/prisma');
const ApiError = require('../utils/ApiError');

const NOT_FOUND = 'Unable to find that record.';

const getOwnedFarm = (userId) => {
  return prisma.farm.findUnique({ where: { farmerId: userId } });
};

const requireOwnedAnimal = async (userId, animalId) => {
  const animal = await prisma.animal.findFirst({
    where: { id: animalId, farm: { farmerId: userId } },
  });

  if (!animal) {
    throw new ApiError(404, NOT_FOUND);
  }

  return animal;
};

const requireOwnedReport = async (userId, reportId) => {
  const report = await prisma.healthReport.findFirst({
    where: { id: reportId, farmerId: userId },
  });

  if (!report) {
    throw new ApiError(404, NOT_FOUND);
  }

  return report;
};

module.exports = { getOwnedFarm, requireOwnedAnimal, requireOwnedReport };
