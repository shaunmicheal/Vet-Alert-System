const prisma = require('../config/prisma');
const ApiError = require('../utils/ApiError');
const { sendSuccess } = require('../utils/response');
const { requireOwnedReport } = require('../services/ownershipService');
const { NOT_FOUND, PUBLIC_PROFESSIONAL_SELECT } = require('../services/professionalService');
const { referralReportInclude, requireOwnedReferral } = require('../services/referralService');

const referralInclude = {
  ...referralReportInclude,
  professional: { select: PUBLIC_PROFESSIONAL_SELECT },
};

const listReferrals = async (req, res) => {
  const referrals = await prisma.referral.findMany({
    where: { farmerId: req.user.id },
    orderBy: { createdAt: 'desc' },
    include: referralInclude,
  });

  return sendSuccess(res, { referrals, count: referrals.length });
};

const createReferral = async (req, res) => {
  const { reportId, professionalId, farmerMessage } = req.body;

  const report = await requireOwnedReport(req.user.id, reportId);

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
      farmerId: req.user.id,
      professionalId: professional.id,
      status: 'PENDING',
      farmerMessage: farmerMessage || null,
    },
    include: referralInclude,
  });

  return sendSuccess(res, { referral }, 201);
};

const getReferral = async (req, res) => {
  const referral = await requireOwnedReferral(req.user.id, req.params.id, referralInclude);
  return sendSuccess(res, { referral });
};

module.exports = { listReferrals, createReferral, getReferral };
