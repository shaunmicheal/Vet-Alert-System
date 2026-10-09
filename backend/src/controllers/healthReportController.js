const prisma = require('../config/prisma');
const ApiError = require('../utils/ApiError');
const { sendSuccess } = require('../utils/response');
const { getOwnedFarm, requireOwnedAnimal } = require('../services/ownershipService');
const triageService = require('../services/triageService');
const alertService = require('../services/alertService');

const reportInclude = {
  animal: true,
  symptoms: { include: { symptom: true } },
};

const listReports = async (req, res) => {
  const where = { farmerId: req.user.id };

  if (req.query.status) where.status = req.query.status;
  if (req.query.riskLevel) where.riskLevel = req.query.riskLevel;
  if (req.query.animalType) where.animal = { animalType: req.query.animalType };

  const reports = await prisma.healthReport.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    include: reportInclude,
  });

  return sendSuccess(res, { reports, count: reports.length });
};

const createReport = async (req, res) => {
  const farm = await getOwnedFarm(req.user.id);
  if (!farm) {
    throw new ApiError(400, 'Create your farm profile before submitting health reports.');
  }

  const { animalId, symptomIds, ...reportFields } = req.body;

  if (animalId) {
    await requireOwnedAnimal(req.user.id, animalId);
  }

  let symptomLinks = [];
  if (Array.isArray(symptomIds) && symptomIds.length) {
    symptomLinks = [...new Set(symptomIds)];
    const found = await prisma.symptom.count({ where: { id: { in: symptomLinks } } });
    if (found !== symptomLinks.length) {
      throw new ApiError(400, 'One or more selected symptoms do not exist.');
    }
  }

  const report = await prisma.healthReport.create({
    data: {
      ...reportFields,
      farmerId: req.user.id,
      farmId: farm.id,
      animalId: animalId || null,
      symptoms: { create: symptomLinks.map((symptomId) => ({ symptomId })) },
    },
    include: reportInclude,
  });

  await alertService.detectPossibleClusters({ district: farm.district });

  return sendSuccess(res, { report }, 201);
};

const getReport = async (req, res) => {
  const report = await prisma.healthReport.findFirst({
    where: { id: req.params.id, farmerId: req.user.id },
    include: {
      ...reportInclude,
      farm: true,
      referrals: { include: { professional: true } },
    },
  });

  if (!report) {
    throw new ApiError(404, 'Unable to find that record.');
  }

  return sendSuccess(res, { report });
};

const triageReport = async (req, res) => {
  const report = await prisma.healthReport.findFirst({
    where: { id: req.params.id, farmerId: req.user.id },
    include: { animal: true, farm: true, symptoms: { include: { symptom: true } } },
  });

  if (!report) {
    throw new ApiError(404, 'Unable to find that record.');
  }

  const structured = triageService.buildStructuredInput(report);
  const result = await triageService.triageHealthReport(structured);

  const updated = await prisma.healthReport.update({
    where: { id: report.id },
    data: {
      riskLevel: result.riskLevel,
      aiAssessment: result.assessment,
      aiRecommendations: result.recommendations,
    },
    include: reportInclude,
  });

  await alertService.createHighRiskAlertForReport({ ...report, riskLevel: result.riskLevel });

  return sendSuccess(res, {
    report: updated,
    aiTriage: {
      source: result.source,
      riskLevel: result.riskLevel,
      assessment: result.assessment,
      recommendations: result.recommendations,
      warningSigns: result.warningSigns,
      veterinaryAttentionRecommended: result.veterinaryAttentionRecommended,
      followUpQuestions: result.followUpQuestions,
      disclaimer: triageService.DISCLAIMER,
    },
  });
};

module.exports = { listReports, createReport, getReport, triageReport };
