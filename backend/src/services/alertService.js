const prisma = require('../config/prisma');

const CLUSTER_MIN_REPORTS = 5;
const CLUSTER_WINDOW_DAYS = 7;
const MS_PER_DAY = 24 * 60 * 60 * 1000;

const HIGH_RISK_TITLE = 'High-risk health report';
const CLUSTER_TITLE = 'Possible health cluster detected';

const logFailure = (operation, err) => {
  console.warn(`[alert] ${operation} failed (${(err && err.name) || 'unknown error'}).`);
};

const clusterWindowStart = () => new Date(Date.now() - CLUSTER_WINDOW_DAYS * MS_PER_DAY);

const buildHighRiskMessage = (report) => {
  const location = [report.farm && report.farm.district, report.farm && report.farm.province]
    .filter(Boolean)
    .join(', ');

  return (
    'High-risk animal health report requires veterinary attention.' +
    (location ? ` Location: ${location}.` : '') +
    ' The report was rated HIGH risk from the signs the farmer described, so veterinary follow-up may be appropriate.' +
    ' This is a risk signal only and is not a diagnosis.'
  );
};

const createHighRiskAlertForReport = async (report) => {
  try {
    if (!report || report.riskLevel !== 'HIGH') return null;

    const existing = await prisma.alert.findFirst({
      where: { type: 'HIGH_RISK', reportId: report.id, isActive: true },
      select: { id: true },
    });
    if (existing) return null;

    return await prisma.alert.create({
      data: {
        title: HIGH_RISK_TITLE,
        message: buildHighRiskMessage(report),
        type: 'HIGH_RISK',
        province: report.farm ? report.farm.province : null,
        district: report.farm ? report.farm.district : null,
        animalType: report.animal ? report.animal.animalType : null,
        reportId: report.id,
      },
    });
  } catch (err) {
    logFailure('high-risk alert', err);
    return null;
  }
};

const buildClusterMessage = (district, reportCount) =>
  'Possible health cluster detected; further veterinary investigation is recommended. ' +
  `${reportCount} health reports sharing a common symptom were recorded in ${district} district ` +
  `within the last ${CLUSTER_WINDOW_DAYS} days. ` +
  'This early-warning notice is based on reported patterns only.';

const detectPossibleClusters = async ({ district } = {}) => {
  try {
    const since = clusterWindowStart();

    const reports = await prisma.healthReport.findMany({
      where: {
        createdAt: { gte: since },
        ...(district ? { farm: { district } } : {}),
      },
      select: {
        id: true,
        farm: { select: { province: true, district: true } },
        animal: { select: { animalType: true } },
        symptoms: { select: { symptomId: true } },
      },
    });

    const groups = new Map();
    for (const report of reports) {
      if (!report.farm) continue;
      for (const link of report.symptoms) {
        const key = `${report.farm.district}::${link.symptomId}`;
        const group = groups.get(key) || { district: report.farm.district, reports: [] };
        group.reports.push(report);
        groups.set(key, group);
      }
    }

    const clusters = new Map();
    for (const group of groups.values()) {
      if (group.reports.length < CLUSTER_MIN_REPORTS) continue;
      const current = clusters.get(group.district);
      if (!current || group.reports.length > current.reports.length) {
        clusters.set(group.district, group);
      }
    }

    const created = [];
    for (const cluster of clusters.values()) {
      const existing = await prisma.alert.findFirst({
        where: {
          type: 'POSSIBLE_CLUSTER',
          district: cluster.district,
          OR: [{ isActive: true }, { isActive: false, updatedAt: { gte: since } }],
        },
        select: { id: true },
      });
      if (existing) continue;

      const animalTypes = new Set(
        cluster.reports.map((report) => (report.animal ? report.animal.animalType : null)).filter(Boolean),
      );
      const reportCount = cluster.reports.length;

      const alert = await prisma.alert.create({
        data: {
          title: CLUSTER_TITLE,
          message: buildClusterMessage(cluster.district, reportCount),
          type: 'POSSIBLE_CLUSTER',
          province: cluster.reports[0].farm.province || null,
          district: cluster.district,
          animalType: animalTypes.size === 1 ? [...animalTypes][0] : null,
          reportCount,
        },
      });
      created.push(alert);
    }

    return created;
  } catch (err) {
    logFailure('cluster detection', err);
    return [];
  }
};

module.exports = {
  CLUSTER_MIN_REPORTS,
  CLUSTER_WINDOW_DAYS,
  createHighRiskAlertForReport,
  detectPossibleClusters,
};
