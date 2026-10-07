// Shared helpers for the veterinary professional DIRECTORY and PROFILE.
//
// The "public" shape below is the ONLY set of fields we ever expose to other
// users. It deliberately omits the internal `userId` link to a User account.
// (VeterinaryProfessional has no password column, so none can leak here.)
const prisma = require('../config/prisma');
const ApiError = require('../utils/ApiError');

const NOT_FOUND = 'Unable to find that record.';

// Fields safe to show farmers (and other professionals) in the directory.
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

// Farmer-facing directory. Only ACTIVE professionals are ever returned, and the
// scoping/filtering happens in the database query itself.
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
  // Free-text search across the fields a farmer would recognise: who they are,
  // what they help with, how to reach them, and where they operate.
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

// The professional record linked to the logged-in vet (VeterinaryProfessional.userId is unique).
const getProfessionalByUserId = (userId) => {
  return prisma.veterinaryProfessional.findUnique({ where: { userId } });
};

// Same as above, but throws 404 when the vet has no professional record yet.
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
