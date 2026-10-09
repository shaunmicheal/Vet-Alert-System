const prisma = require('../config/prisma');
const ApiError = require('../utils/ApiError');
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

const createProfile = async (req, res) => {
  const existing = await getProfessionalByUserId(req.user.id);
  if (existing) {
    throw new ApiError(409, 'Your professional profile already exists.');
  }

  const profile = await prisma.veterinaryProfessional.create({
    data: {
      name: req.body.name.trim(),
      professionalType: req.body.professionalType.trim(),
      phone: req.body.phone.trim(),
      email: (req.body.email || req.user.email || '').trim() || null,
      province: req.body.province,
      district: req.body.district.trim(),
      specialisation: req.body.specialisation ? req.body.specialisation.trim() : null,
      availability: req.body.availability ? req.body.availability.trim() : null,
      userId: req.user.id,
    },
    select: PUBLIC_PROFESSIONAL_SELECT,
  });

  return sendSuccess(res, { profile }, 201);
};

const updateProfile = async (req, res) => {
  const me = await requireProfessionalByUserId(req.user.id);

  const allowed = {};
  ['name', 'professionalType', 'phone', 'province', 'district'].forEach((field) => {
    if (req.body[field] !== undefined) allowed[field] = req.body[field];
  });
  if (req.body.email !== undefined) {
    allowed.email = req.body.email === '' ? null : req.body.email;
  }
  if (req.body.specialisation !== undefined) {
    allowed.specialisation = req.body.specialisation === '' ? null : req.body.specialisation;
  }
  if (req.body.availability !== undefined) {
    allowed.availability = req.body.availability === '' ? null : req.body.availability;
  }

  const profile = await prisma.veterinaryProfessional.update({
    where: { id: me.id },
    data: allowed,
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
  createProfile,
  updateProfile,
  listCases,
  getCase,
  updateCaseStatus,
  updateCaseResponse,
};
