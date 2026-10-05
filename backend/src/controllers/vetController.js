// Veterinary professional workspace: own PROFILE + assigned CASE management.
//
// Every case query is scoped by the professional record linked to the logged-in
// user, so a vet can only ever see or change referrals assigned to THEM.
const prisma = require('../config/prisma');
const { sendSuccess } = require('../utils/response');
const {
  PUBLIC_PROFESSIONAL_SELECT,
  getProfessionalByUserId,
  requireProfessionalByUserId,
} = require('../services/professionalService');
const { assertTransition, referralReportInclude, requireAssignedReferral } = require('../services/referralService');

// Farmer details a vet needs to handle a case. Selected explicitly so the
// linked user's password can never be returned.
const FARMER_PUBLIC_SELECT = { id: true, name: true, email: true, phone: true, createdAt: true };

const caseInclude = {
  ...referralReportInclude,
  farmer: { select: FARMER_PUBLIC_SELECT },
  professional: { select: PUBLIC_PROFESSIONAL_SELECT },
};

// GET /api/vet/profile -> the vet's own professional record (or null if not set up).
const getProfile = async (req, res) => {
  const profile = await getProfessionalByUserId(req.user.id);
  return sendSuccess(res, { profile: profile || null });
};

// PATCH /api/vet/profile -> update only the allowed professional fields.
// req.body has already been validated + stripped to the allowed keys, so a role,
// isActive or userId value in the request can never reach the database.
const updateProfile = async (req, res) => {
  const me = await requireProfessionalByUserId(req.user.id);

  const profile = await prisma.veterinaryProfessional.update({
    where: { id: me.id },
    data: req.body,
    select: PUBLIC_PROFESSIONAL_SELECT,
  });

  return sendSuccess(res, { profile });
};

// GET /api/vet/cases -> referrals assigned to this professional.
const listCases = async (req, res) => {
  const me = await getProfessionalByUserId(req.user.id);
  if (!me) {
    // No professional record yet -> no cases (never leak anything).
    return sendSuccess(res, { cases: [], count: 0 });
  }

  const cases = await prisma.referral.findMany({
    where: { professionalId: me.id },
    orderBy: { updatedAt: 'desc' },
    include: caseInclude,
  });

  return sendSuccess(res, { cases, count: cases.length });
};

// GET /api/vet/cases/:id -> one assigned case in full (report, animal, farm,
// symptoms, AI triage, farmer contact details).
const getCase = async (req, res) => {
  const me = await requireProfessionalByUserId(req.user.id);
  const referral = await requireAssignedReferral(me.id, req.params.id, caseInclude);
  return sendSuccess(res, { case: referral });
};

// PATCH /api/vet/cases/:id/status -> move the referral through allowed transitions.
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

// PATCH /api/vet/cases/:id/response -> record the professional's response.
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
