
const prisma = require('../config/prisma');
const ApiError = require('../utils/ApiError');
const { sendSuccess } = require('../utils/response');
const alertService = require('../services/alertService');
const {
  ALERT_TYPES,
  ANIMAL_TYPES,
  PROVINCES,
  RISK_LEVELS,
  REPORT_STATUSES,
  REFERRAL_STATUSES,
} = require('../utils/constants');

const listAlerts = async (req, res) => {
  const where = {};
  if (req.query.type) where.type = req.query.type;
  if (req.query.province) where.province = req.query.province;
  if (req.query.district) where.district = req.query.district;
  if (req.query.animalType) where.animalType = req.query.animalType;
  if (req.query.isActive) where.isActive = req.query.isActive === 'true';

  const alerts = await prisma.alert.findMany({
    where,
    orderBy: [{ createdAt: 'desc' }, { id: 'asc' }],
  });

  return sendSuccess(res, { alerts, count: alerts.length });
};
const getAlert = async (req, res) => {
  const alert = await prisma.alert.findUnique({
    where: { id: req.params.id },
    include: {
      report: {
        include: {
          animal: true,
          farm: true,
          symptoms: { include: { symptom: true } },
        },
      },
    },
  });

  if (!alert) {
    throw new ApiError(404, 'Unable to find that record.');
  }

  return sendSuccess(res, { alert });
};

const createAlert = async (req, res) => {
  const { title, message, province, district, animalType } = req.body;

  const alert = await prisma.alert.create({
    data: {
      title,
      message,
      type: 'SYSTEM',
      province: province || null,
      district: district || null,
      animalType: animalType || null,
    },
  });

  return sendSuccess(res, { alert }, 201);
};

const acknowledgeAlert = async (req, res) => {
  const existing = await prisma.alert.findUnique({ where: { id: req.params.id } });
  if (!existing) {
    throw new ApiError(404, 'Unable to find that record.');
  }

  const alert = existing.isActive
    ? await prisma.alert.update({ where: { id: existing.id }, data: { isActive: false } })
    : existing;

  return sendSuccess(res, { alert });
};
const runClusterScan = async (req, res) => {
  const { district } = req.body || {};
  const alerts = await alertService.detectPossibleClusters({ district });
  return sendSuccess(res, { alerts, count: alerts.length });
};

const getStatistics = async (req, res) => {
  const [
    totalUsers,
    totalFarmers,
    totalVetAccounts,
    totalAdmins,
    totalProfessionals,
    activeProfessionals,
    reports,
    totalAlerts,
    activeAlerts,
    totalReferrals,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { role: 'FARMER' } }),
    prisma.user.count({ where: { role: 'VETERINARY_PROFESSIONAL' } }),
    prisma.user.count({ where: { role: 'ADMIN' } }),
    prisma.veterinaryProfessional.count(),
    prisma.veterinaryProfessional.count({ where: { isActive: true } }),
    prisma.healthReport.findMany({
      select: {
        status: true,
        riskLevel: true,
        farm: { select: { province: true } },
        animal: { select: { animalType: true } },
      },
    }),
    prisma.alert.count(),
    prisma.alert.count({ where: { isActive: true } }),
    prisma.referral.count(),
  ]);
  const reportsByStatus = Object.fromEntries(REPORT_STATUSES.map((value) => [value, 0]));
  const reportsByRiskLevel = Object.fromEntries([...RISK_LEVELS, 'UNSET'].map((value) => [value, 0]));
  const reportsByProvince = Object.fromEntries([...PROVINCES, 'UNSET'].map((value) => [value, 0]));
  const reportsByAnimalType = Object.fromEntries([...ANIMAL_TYPES, 'UNSET'].map((value) => [value, 0]));

  for (const report of reports) {
    const riskLevel = report.riskLevel || 'UNSET';
    const province = (report.farm && report.farm.province) || 'UNSET';
    const animalType = (report.animal && report.animal.animalType) || 'UNSET';

    reportsByStatus[report.status] = (reportsByStatus[report.status] || 0) + 1;
    reportsByRiskLevel[riskLevel] = (reportsByRiskLevel[riskLevel] || 0) + 1;
    reportsByProvince[province] = (reportsByProvince[province] || 0) + 1;
    reportsByAnimalType[animalType] = (reportsByAnimalType[animalType] || 0) + 1;
  }

  const alertsByType = {};
  await Promise.all(
    ALERT_TYPES.map(async (type) => {
      alertsByType[type] = await prisma.alert.count({ where: { type } });
    }),
  );

  const referralsByStatus = {};
  await Promise.all(
    REFERRAL_STATUSES.map(async (status) => {
      referralsByStatus[status] = await prisma.referral.count({ where: { status } });
    }),
  );

  const statistics = {
    users: {
      total: totalUsers,
      farmers: totalFarmers,
      veterinaryProfessionals: totalVetAccounts,
      admins: totalAdmins,
    },
    professionals: { total: totalProfessionals, active: activeProfessionals },
    reports: {
      total: reports.length,
      byStatus: reportsByStatus,
      byRiskLevel: reportsByRiskLevel,
      byProvince: reportsByProvince,
      byAnimalType: reportsByAnimalType,
    },
    alerts: { total: totalAlerts, active: activeAlerts, byType: alertsByType },
    referrals: { total: totalReferrals, byStatus: referralsByStatus },
  };

  return sendSuccess(res, { statistics });
};

module.exports = {
  listAlerts,
  getAlert,
  createAlert,
  acknowledgeAlert,
  runClusterScan,
  getStatistics,
};
