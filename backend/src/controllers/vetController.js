const prisma = require('../config/prisma');
const { sendSuccess } = require('../utils/response');
const {
  PUBLIC_PROFESSIONAL_SELECT,
  getProfessionalByUserId,
  requireProfessionalByUserId,
} = require('../services/professionalService');
const { assertTransition, referralReportInclude, requireAssignedReferral } = require('../services/referralService');

const FARMER_PUBLIC_SELECT = { id: true, name: true, email: true, phone: true, createdAt: true };

const caseInclude = {
  ...referralReportInclude,
  farmer: { select: FARMER_PUBLIC_SELECT },
  professional: { select: PUBLIC_PROFESSIONAL_SELECT },
};

const getProfile = async (req, res) => {
  const profile = await getProfessionalByUserId(req.user.id);
  return sendSuccess(res, { profile: profile || null });
};

const updateProfile = async (req, res) => {
  const me = await requireProfessionalByUserId(req.user.id);

  const profile = await prisma.veterinaryProfessional.update({
    where: { id: me.id },
    data: req.body,
    select: PUBLIC_PROFESSIONAL_SELECT,
  });

  return sendSuccess(res, { profile });
};

const listCases = async (req, res) => {
  const me = await getProfessionalByUserId(req.user.id);
  if (!me) {
    return sendSuccess(res, { cases: [], count: 0 });
  }

  const cases = await prisma.referral.findMany({
    where: { professionalId: me.id },
    orderBy: { updatedAt: 'desc' },
    include: caseInclude,
  });

  return sendSuccess(res, { cases, count: cases.length });
};

const getCase = async (req, res) => {
  const me = await requireProfessionalByUserId(req.user.id);
  const referral = await requireAssignedReferral(me.id, req.params.id, caseInclude);
  return sendSuccess(res, { case: referral });
};

const updateCaseStatus = async (req, res) => {
  const me = await requireProfessionalByUserId(req.user.id);

  const referral = await requireAssignedReferral(me.id, req.params.id);
  assertTransition(referral.status, req.body.status);

  const updated = await prisma.referral.update({
    where: { id: referral.id },
    data: { status: req.body.status },
    include: caseInclude,
  });

  return sendSuccess(res, { case: updated });
};

const updateCaseResponse = async (req, res) => {
  const me = await requireProfessionalByUserId(req.user.id);

  const referral = await requireAssignedReferral(me.id, req.params.id);

  const updated = await prisma.referral.update({
    where: { id: referral.id },
    data: { professionalResponse: req.body.professionalResponse },
    include: caseInclude,
  });

  return sendSuccess(res, { case: updated });
};

module.exports = {
  getProfile,
  updateProfile,
  listCases,
  getCase,
  updateCaseStatus,
  updateCaseResponse,
};
