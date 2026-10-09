const prisma = require('../config/prisma');
const ApiError = require('../utils/ApiError');

const NOT_FOUND = 'Unable to find that record.';

const PUBLIC_PROFESSIONAL_SELECT = {
  id: true,
  name: true,
  professionalType: true,
  phone: true,
  email: true,
  province: true,
  district: true,
  specialisation: true,
  availability: true,
  isActive: true,
  createdAt: true,
  updatedAt: true,
};

const listActiveProfessionals = (filters = {}) => {
  const where = { isActive: true };

  if (filters.province) where.province = filters.province;
  if (filters.district) where.district = { contains: filters.district, mode: 'insensitive' };
  if (filters.professionalType) {
    where.professionalType = { contains: filters.professionalType, mode: 'insensitive' };
  }
  if (filters.specialisation) {
    where.specialisation = { contains: filters.specialisation, mode: 'insensitive' };
  }
  if (filters.search) {
    where.OR = [
      { name: { contains: filters.search, mode: 'insensitive' } },
      { email: { contains: filters.search, mode: 'insensitive' } },
      { phone: { contains: filters.search, mode: 'insensitive' } },
      { specialisation: { contains: filters.search, mode: 'insensitive' } },
      { district: { contains: filters.search, mode: 'insensitive' } },
      { province: { contains: filters.search, mode: 'insensitive' } },
    ];
  }

  return prisma.veterinaryProfessional.findMany({
    where,
    orderBy: [{ name: 'asc' }],
    select: PUBLIC_PROFESSIONAL_SELECT,
  });
};

const getProfessionalByUserId = (userId) => {
  return prisma.veterinaryProfessional.findUnique({ where: { userId } });
};

const requireProfessionalByUserId = async (userId) => {
  const professional = await getProfessionalByUserId(userId);
  if (!professional) {
    throw new ApiError(404, 'Your professional profile has not been set up yet.');
  }
  return professional;
};

module.exports = {
  NOT_FOUND,
  PUBLIC_PROFESSIONAL_SELECT,
  listActiveProfessionals,
  getProfessionalByUserId,
  requireProfessionalByUserId,
};
