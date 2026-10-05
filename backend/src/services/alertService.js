// Alert creation logic for Phase 5 (admin & alerting).
//
// Two machine-generated alert types are supported, both strictly EARLY-WARNING:
//   HIGH_RISK        - a health report came back at HIGH risk after triage.
//   POSSIBLE_CLUSTER - many similar recent reports in the same district.
//
// Safety rules for every message generated here:
//   - factual and safety-oriented only,
//   - never claim a confirmed disease, outbreak or diagnosis,
//   - never restate AI output as a definitive conclusion.
//
// Every function is failure-tolerant: alerting must never break the report or
// triage flow that triggered it. Failures are logged with a short, non-sensitive
// reason only (never report contents or credentials).
const prisma = require('../config/prisma');

// Approved V1 early-warning rule:
//   same district + shared symptom + at least 5 reports + within 7 days.
const CLUSTER_MIN_REPORTS = 5;
const CLUSTER_WINDOW_DAYS = 7;
const MS_PER_DAY = 24 * 60 * 60 * 1000;

const HIGH_RISK_TITLE = 'High-risk health report';
const CLUSTER_TITLE = 'Possible health cluster detected';

const logFailure = (operation, err) => {
  console.warn(`[alert] ${operation} failed (${(err && err.name) || 'unknown error'}).`);
};

const clusterWindowStart = () => new Date(Date.now() - CLUSTER_WINDOW_DAYS * MS_PER_DAY);

// ---- HIGH_RISK -------------------------------------------------------------
// Factual wording only. The alert points at the triage result and recommends
// attention - it never names a disease or claims anything is confirmed.
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

// Called from the Phase 3 triage flow. Returns the created alert, or null when
// the report is not HIGH risk, a duplicate already exists, or anything fails.
const createHighRiskAlertForReport = async (report) => {
  try {
    if (!report || report.riskLevel !== 'HIGH') return null;

    // Duplicate prevention: one ACTIVE HIGH_RISK alert per report.
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

// ---- POSSIBLE_CLUSTER ------------------------------------------------------
// The approved statement is always the first sentence of the message.
const buildClusterMessage = (district, reportCount) =>
  'Possible health cluster detected; further veterinary investigation is recommended. ' +
  `${reportCount} health reports sharing a common symptom were recorded in ${district} district ` +
  `within the last ${CLUSTER_WINDOW_DAYS} days. ` +
  'This early-warning notice is based on reported patterns only.';

// Scans recent reports (optionally limited to one district) and creates a
// POSSIBLE_CLUSTER alert for every district that qualifies under the approved
// rule. Returns only the alerts created by THIS run.
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

    // Group recent reports by district + shared symptom (the approved rule).
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

    // One alert per district: keep the largest qualifying symptom group.
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
      // Duplicate prevention: skip while an ACTIVE cluster alert already covers
      // this district, or a recent one from the same 7-day episode was just
      // acknowledged. A new alert is allowed again for a later, separate episode.
      const existing = await prisma.alert.findFirst({
        where: {
          type: 'POSSIBLE_CLUSTER',
          district: cluster.district,
          OR: [{ isActive: true }, { isActive: false, updatedAt: { gte: since } }],
        },
        select: { id: true },
      });
      if (existing) continue;

      // Animal type is only stated when every report in the cluster shares one.
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