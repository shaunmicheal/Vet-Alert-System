
const prisma = require('../config/prisma');
const ApiError = require('../utils/ApiError');
const { sendSuccess } = require('../utils/response');
const alertService = require('../services/alertService');
const { PUBLIC_PROFESSIONAL_SELECT } = require('../services/professionalService');
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

const parsePagination = (query) => {
  const page = Math.min(Math.max(Number.parseInt(query.page, 10) || 1, 1), 1000);
  const limit = Math.min(Math.max(Number.parseInt(query.limit, 10) || 20, 1), 100);
  return { page, limit, skip: (page - 1) * limit };
};

const toPagination = (page, limit, total) => ({
  page,
  limit,
  total,
  totalPages: Math.max(Math.ceil(total / limit), 1),
});

const ADMIN_SAFE_USER_SELECT = {
  id: true,
  name: true,
  email: true,
  phone: true,
  role: true,
  createdAt: true,
  updatedAt: true,
};

const listUsers = async (req, res) => {
  const { page, limit, skip } = parsePagination(req.query);
  const where = {};
  if (req.query.role) where.role = req.query.role;
  if (req.query.search) {
    const term = req.query.search.trim();
    where.OR = [
      { name: { contains: term, mode: 'insensitive' } },
      { email: { contains: term, mode: 'insensitive' } },
    ];
  }

  const [total, users] = await Promise.all([
    prisma.user.count({ where }),
    prisma.user.findMany({
      where,
      orderBy: [{ createdAt: 'desc' }, { id: 'asc' }],
      skip,
      take: limit,
      select: {
        ...ADMIN_SAFE_USER_SELECT,
        veterinaryProfessional: { select: { id: true, name: true, isActive: true } },
        farm: { select: { id: true, name: true, province: true, district: true } },
      },
    }),
  ]);

  return sendSuccess(res, { users, pagination: toPagination(page, limit, total) });
};

const getUser = async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.params.id },
    select: {
      ...ADMIN_SAFE_USER_SELECT,
      farm: true,
      veterinaryProfessional: { select: { ...PUBLIC_PROFESSIONAL_SELECT, userId: true } },
      healthReports: {
        select: { id: true, title: true, status: true, riskLevel: true, createdAt: true },
        orderBy: { createdAt: 'desc' },
        take: 10,
      },
      referralsMade: {
        select: { id: true, status: true, createdAt: true, professionalId: true },
        orderBy: { createdAt: 'desc' },
        take: 10,
      },
    },
  });

  if (!user) {
    throw new ApiError(404, 'Unable to find that record.');
  }

  return sendSuccess(res, { user });
};

const ADMIN_REPORT_SELECT = {
  id: true,
  title: true,
  description: true,
  riskLevel: true,
  status: true,
  createdAt: true,
  updatedAt: true,
  farmer: { select: { id: true, name: true, email: true } },
  farm: { select: { id: true, name: true, province: true, district: true } },
  animal: true,
  symptoms: { include: { symptom: true } },
};

const ADMIN_REFERRAL_SELECT = {
  id: true,
  status: true,
  farmerMessage: true,
  createdAt: true,
  updatedAt: true,
  farmer: { select: { id: true, name: true, email: true, phone: true } },
  professional: { select: { ...PUBLIC_PROFESSIONAL_SELECT, userId: true } },
  report: {
    select: {
      id: true,
      title: true,
      status: true,
      riskLevel: true,
      createdAt: true,
      farm: { select: { id: true, name: true, province: true, district: true } },
      animal: { select: { id: true, animalType: true, name: true, tagNumber: true } },
    },
  },
};

const listReports = async (req, res) => {
  const { page, limit, skip } = parsePagination(req.query);
  const where = {};
  if (req.query.status) where.status = req.query.status;
  if (req.query.riskLevel) where.riskLevel = req.query.riskLevel;
  if (req.query.province) where.farm = { province: req.query.province };
  if (req.query.animalType) where.animal = { animalType: req.query.animalType };
  if (req.query.search) {
    const term = req.query.search.trim();
    where.OR = [
      { title: { contains: term, mode: 'insensitive' } },
      { description: { contains: term, mode: 'insensitive' } },
    ];
  }

  const [total, reports] = await Promise.all([
    prisma.healthReport.count({ where }),
    prisma.healthReport.findMany({
      where,
      orderBy: [{ createdAt: 'desc' }, { id: 'asc' }],
      skip,
      take: limit,
      select: ADMIN_REPORT_SELECT,
    }),
  ]);

  return sendSuccess(res, { reports, pagination: toPagination(page, limit, total) });
};

const getReport = async (req, res) => {
  const report = await prisma.healthReport.findUnique({
    where: { id: req.params.id },
    include: {
      farmer: { select: { id: true, name: true, email: true, phone: true } },
      farm: true,
      animal: true,
      symptoms: { include: { symptom: true } },
      referrals: { select: { id: true, status: true, createdAt: true, professionalId: true } },
      alerts: { select: { id: true, title: true, type: true, isActive: true, createdAt: true } },
    },
  });

  if (!report) {
    throw new ApiError(404, 'Unable to find that record.');
  }

  return sendSuccess(res, { report });
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

const listReferrals = async (req, res) => {
  const { page, limit, skip } = parsePagination(req.query);
  const where = {};
  if (req.query.status) where.status = req.query.status;
  if (req.query.province) where.report = { farm: { province: req.query.province } };
  if (req.query.search) {
    const term = req.query.search.trim();
    where.OR = [
      { farmer: { name: { contains: term, mode: 'insensitive' } } },
      { farmer: { email: { contains: term, mode: 'insensitive' } } },
    ];
  }

  const [total, referrals] = await Promise.all([
    prisma.referral.count({ where }),
    prisma.referral.findMany({
      where,
      orderBy: [{ createdAt: 'desc' }, { id: 'asc' }],
      skip,
      take: limit,
      select: ADMIN_REFERRAL_SELECT,
    }),
  ]);

  return sendSuccess(res, { referrals, pagination: toPagination(page, limit, total) });
};

const getReferral = async (req, res) => {
  const referral = await prisma.referral.findUnique({
    where: { id: req.params.id },
    select: ADMIN_REFERRAL_SELECT,
  });

  if (!referral) {
    throw new ApiError(404, 'Unable to find that record.');
  }

  return sendSuccess(res, { referral });
};

const listProfessionals = async (req, res) => {
  const { page, limit, skip } = parsePagination(req.query);
  const where = {};
  if (req.query.isActive === 'true') where.isActive = true;
  if (req.query.isActive === 'false') where.isActive = false;
  if (req.query.province) where.province = req.query.province;
  if (req.query.search) {
    const term = req.query.search.trim();
    where.OR = [
      { name: { contains: term, mode: 'insensitive' } },
      { email: { contains: term, mode: 'insensitive' } },
      { district: { contains: term, mode: 'insensitive' } },
    ];
  }

  const [total, professionals] = await Promise.all([
    prisma.veterinaryProfessional.count({ where }),
    prisma.veterinaryProfessional.findMany({
      where,
      orderBy: [{ name: 'asc' }, { id: 'asc' }],
      skip,
      take: limit,
      select: {
        ...PUBLIC_PROFESSIONAL_SELECT,
        userId: true,
        user: { select: { id: true, name: true, email: true, role: true } },
        _count: { select: { referrals: true } },
      },
    }),
  ]);

  return sendSuccess(res, { professionals, pagination: toPagination(page, limit, total) });
};

const getProfessional = async (req, res) => {
  const professional = await prisma.veterinaryProfessional.findUnique({
    where: { id: req.params.id },
    select: {
      ...PUBLIC_PROFESSIONAL_SELECT,
      userId: true,
      user: { select: { id: true, name: true, email: true, role: true, createdAt: true } },
      referrals: {
        select: { id: true, status: true, createdAt: true, farmerId: true, reportId: true },
        orderBy: { createdAt: 'desc' },
        take: 10,
      },
    },
  });

  if (!professional) {
    throw new ApiError(404, 'Unable to find that record.');
  }

  return sendSuccess(res, { professional });
};

module.exports = {
  listAlerts,
  getAlert,
  createAlert,
  acknowledgeAlert,
  runClusterScan,
  getStatistics,
  listUsers,
  getUser,
  listReports,
  getReport,
  listReferrals,
  getReferral,
  listProfessionals,
  getProfessional,
};
