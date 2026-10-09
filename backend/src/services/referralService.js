const prisma = require('../config/prisma');
const ApiError = require('../utils/ApiError');

const NOT_FOUND = 'Unable to find that record.';

const REFERRAL_STATUS_TRANSITIONS = {
  PENDING: ['ACCEPTED', 'DECLINED'],
  ACCEPTED: ['IN_PROGRESS'],
  IN_PROGRESS: ['COMPLETED'],
  COMPLETED: [],
  DECLINED: [],
};

const canTransition = (from, to) => (REFERRAL_STATUS_TRANSITIONS[from] || []).includes(to);

const assertTransition = (from, to) => {
  if (!canTransition(from, to)) {
    throw new ApiError(409, `A referral cannot move from ${from} to ${to}.`);
  }
};

const referralReportInclude = {
  report: {
    include: {
      animal: true,
      farm: true,
      symptoms: { include: { symptom: true } },
    },
  },
};

const requireOwnedReferral = async (userId, referralId, include) => {
  const referral = await prisma.referral.findFirst({
    where: { id: referralId, farmerId: userId },
    include,
  });
  if (!referral) throw new ApiError(404, NOT_FOUND);
  return referral;
};

const requireAssignedReferral = async (professionalId, referralId, include) => {
  const referral = await prisma.referral.findFirst({
    where: { id: referralId, professionalId },
    include,
  });
  if (!referral) throw new ApiError(404, NOT_FOUND);
  return referral;
};

module.exports = {
  NOT_FOUND,
  REFERRAL_STATUS_TRANSITIONS,
  canTransition,
  assertTransition,
  referralReportInclude,
  requireOwnedReferral,
  requireAssignedReferral,
};
