// Health report creation, listing and detail for the logged-in farmer.
//
// Phase 2 stores the structured health information only. The AI risk assessment
// (riskLevel / aiAssessment / aiRecommendations) is added in Phase 3, so those
// fields stay null here and the status stays PENDING.
const prisma = require('../config/prisma');
const ApiError = require('../utils/ApiError');
const { sendSuccess } = require('../utils/response');
const { getOwnedFarm, requireOwnedAnimal } = require('../services/ownershipService');
const triageService = require('../services/triageService');
const alertService = require('../services/alertService');

// The relations every report response includes, so the frontend gets everything
// it needs in a single request.
const reportInclude = {
  animal: true,
  symptoms: { include: { symptom: true } },
};

// GET /api/reports
// Always scoped by farmerId. Optional filters: status, riskLevel, animalType.
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

// POST /api/reports
const createReport = async (req, res) => {
  const farm = await getOwnedFarm(req.user.id);
  if (!farm) {
    throw new ApiError(400, 'Create your farm profile before submitting health reports.');
  }

  // These two fields are not columns on HealthReport - pull them out first.
  const { animalId, symptomIds, ...reportFields } = req.body;

  // If an animal was chosen it must belong to THIS farmer (404 otherwise).
  if (animalId) {
    await requireOwnedAnimal(req.user.id, animalId);
  }

  // Symptoms must be existing reference records. We de-duplicate and verify.
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

  // Phase 5: early-warning cluster detection for this district. It never blocks
  // report creation - alerting failures are swallowed inside alertService.
  await alertService.detectPossibleClusters({ district: farm.district });

  return sendSuccess(res, { report }, 201);
};

// GET /api/reports/:id
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

// POST /api/reports/:id/triage
// Runs the AI-assisted risk triage for ONE report owned by the logged-in farmer.
// The ownership filter below means another farmer's report is simply "not found".
const triageReport = async (req, res) => {
  const report = await prisma.healthReport.findFirst({
    where: { id: req.params.id, farmerId: req.user.id },
    include: { animal: true, farm: true, symptoms: { include: { symptom: true } } },
  });

  if (!report) {
    throw new ApiError(404, 'Unable to find that record.');
  }

  // The AI only ever sees data loaded from the database (never client-supplied
  // fields) and never sees the farmer's account details.
  const structured = triageService.buildStructuredInput(report);
  const result = await triageService.triageHealthReport(structured);

  // Persist exactly the three columns that exist in the schema.
  const updated = await prisma.healthReport.update({
    where: { id: report.id },
    data: {
      riskLevel: result.riskLevel,
      aiAssessment: result.assessment,
      aiRecommendations: result.recommendations,
    },
    include: reportInclude,
  });

  // Phase 5: a HIGH risk result raises an associated HIGH_RISK alert for admin
  // oversight. alertService only acts on HIGH risk, de-duplicates, and never throws.
  await alertService.createHighRiskAlertForReport({ ...report, riskLevel: result.riskLevel });

  return sendSuccess(res, {
    report: updated,
    aiTriage: {
      // 'GEMINI' = live AI assessment, 'FALLBACK' = safe general guidance.
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
