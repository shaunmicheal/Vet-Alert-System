// Referral helpers: status-transition rules and ownership/assignment lookups.
//
// SECURITY: exactly like ownershipService, a referral that belongs to ANOTHER
// farmer - or is assigned to ANOTHER professional - is treated as if it does not
// exist, so we return 404 (never 403) and never reveal that the id is real.
const prisma = require('../config/prisma');
const ApiError = require('../utils/ApiError');

const NOT_FOUND = 'Unable to find that record.';

// The ONLY status changes the API allows. Anything else is rejected (409), so a
// client can never jump straight to an arbitrary status.
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

// Report shape shared by the farmer + vet referral responses. The report carries
// the health data, the animal, the farm and the existing AI triage columns.
const referralReportInclude = {
  report: {
    include: {
      animal: true,
      farm: true,
      symptoms: { include: { symptom: true } },
    },
  },
};

// Farmer view: only the logged-in farmer's OWN referrals.
const requireOwnedReferral = async (userId, referralId, include) => {
  const referral = await prisma.referral.findFirst({
    where: { id: referralId, farmerId: userId },
    include,
  });
  if (!referral) throw new ApiError(404, NOT_FOUND);
  return referral;
};

// Vet view: only referrals assigned to THIS professional record.
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
