// Farmer referral creation, listing and detail.
// Every query is scoped by `farmerId: req.user.id`, so a farmer can only ever
// see or create referrals for their OWN reports.
const prisma = require('../config/prisma');
const ApiError = require('../utils/ApiError');
const { sendSuccess } = require('../utils/response');
const { requireOwnedReport } = require('../services/ownershipService');
const { NOT_FOUND, PUBLIC_PROFESSIONAL_SELECT } = require('../services/professionalService');
const { referralReportInclude, requireOwnedReferral } = require('../services/referralService');

// Farmer-facing referral shape: the report (with animal/farm/symptoms + AI triage
// columns) and the public view of the professional.
const referralInclude = {
  ...referralReportInclude,
  professional: { select: PUBLIC_PROFESSIONAL_SELECT },
};

// GET /api/referrals -> the logged-in farmer's own referrals only.
const listReferrals = async (req, res) => {
  const referrals = await prisma.referral.findMany({
    where: { farmerId: req.user.id },
    orderBy: { createdAt: 'desc' },
    include: referralInclude,
  });

  return sendSuccess(res, { referrals, count: referrals.length });
};

// POST /api/referrals
// Body: { reportId, professionalId, farmerMessage? }. `farmerId` is NEVER taken
// from the client - it is derived from the authenticated user.
const createReferral = async (req, res) => {
  const { reportId, professionalId, farmerMessage } = req.body;

  // The report must belong to THIS farmer (404 otherwise).
  const report = await requireOwnedReport(req.user.id, reportId);

  // The professional must exist AND be active.
  const professional = await prisma.veterinaryProfessional.findUnique({
    where: { id: professionalId },
    select: { id: true, isActive: true },
  });
  if (!professional) {
    throw new ApiError(404, NOT_FOUND);
  }
  if (!professional.isActive) {
    throw new ApiError(400, 'That veterinary professional is not currently available.');
  }

  const referral = await prisma.referral.create({
    data: {
      reportId: report.id,
      farmerId: req.user.id, // derived from the token, never the client
      professionalId: professional.id,
      status: 'PENDING', // every new referral starts pending
      farmerMessage: farmerMessage || null,
    },
    include: referralInclude,
  });

  return sendSuccess(res, { referral }, 201);
};

// GET /api/referrals/:id -> the farmer's own referral only (404 otherwise).
const getReferral = async (req, res) => {
  const referral = await requireOwnedReferral(req.user.id, req.params.id, referralInclude);
  return sendSuccess(res, { referral });
};

module.exports = { listReferrals, createReferral, getReferral };
