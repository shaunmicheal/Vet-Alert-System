// Farmer ownership helpers - the heart of Phase 2 authorization.
//
// IMPORTANT SECURITY RULE:
// A record that belongs to ANOTHER farmer is treated as if it does not exist.
// We return 404 (not 403) so a farmer cannot use the API to discover which
// record ids exist on other people's farms.
//
// These lookups always filter by the logged-in user id, so "scoping" happens in
// the database query itself - not in the frontend and not by trusting any id
// the client sends.
const prisma = require('../config/prisma');
const ApiError = require('../utils/ApiError');

const NOT_FOUND = 'Unable to find that record.';

// A farmer can have at most one farm (Farm.farmerId is unique). Returns null when
// the farmer has not created one yet - callers decide whether that is an error.
const getOwnedFarm = (userId) => {
  return prisma.farm.findUnique({ where: { farmerId: userId } });
};

// Finds an animal ONLY if it belongs to this farmer's farm. Throws 404 otherwise.
const requireOwnedAnimal = async (userId, animalId) => {
  const animal = await prisma.animal.findFirst({
    where: { id: animalId, farm: { farmerId: userId } },
  });

  if (!animal) {
    throw new ApiError(404, NOT_FOUND);
  }

  return animal;
};

// Finds a health report ONLY if this farmer created it. Throws 404 otherwise.
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
