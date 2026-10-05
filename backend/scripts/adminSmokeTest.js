// ============================================================================
// PHASE 5 SMOKE TEST - Admin & alerting
// ----------------------------------------------------------------------------
// Run from the backend folder with:  npm run smoke:admin
//
// Uses the REAL DATABASE. Gemini is MOCKED (geminiService.setMockGenerate) so
// the HIGH risk triage result is fully deterministic. Every temporary record
// (users, farms, animals, reports, symptoms, alerts) is cleaned up at the end.
// ============================================================================
process.env.NODE_ENV = 'test';

const bcrypt = require('bcrypt');

const app = require('../src/app');
const prisma = require('../src/config/prisma');
const geminiService = require('../src/services/geminiService');
const { env } = require('../src/config/env');

const ADMIN = { name: 'Phase5 Admin', email: 'phase5.temp.admin@example.com', password: 'AdminPass123' };
const VET = { name: 'Phase5 Vet', email: 'phase5.temp.vet@example.com', password: 'VetPass123' };
const FARMER_PASSWORD = 'Phase5Pass123';

// One farmer per test district (Phase 5 needs several isolated districts).
const FARMER_EMAILS = [
  'phase5.temp.f1@example.com', // Phase5 HighRisk
  'phase5.temp.f2@example.com', // Phase5 Cluster One
  'phase5.temp.f3@example.com', // Phase5 Cluster One
  'phase5.temp.f4@example.com', // Phase5 Old Reports
  'phase5.temp.f5@example.com', // Phase5 DiffA
  'phase5.temp.f6@example.com', // Phase5 DiffB
  'phase5.temp.f7@example.com', // Phase5 No Shared
];

const TEMP_EMAILS = [ADMIN.email, VET.email, ...FARMER_EMAILS];
const SYMPTOM_NAMES = [
  'PHASE5_SYM_HR',
  'PHASE5_SYM_SHARED',
  'PHASE5_SYM_OLD',
  'PHASE5_SYM_DIFF',
  'PHASE5_SYM_N1',
  'PHASE5_SYM_N2',
  'PHASE5_SYM_N3',
  'PHASE5_SYM_N4',
  'PHASE5_SYM_N5',
];

const D_HR = 'Phase5 HighRisk';
const D_CLUSTER = 'Phase5 Cluster One';
const D_OLD = 'Phase5 Old Reports';
const D_DIFF_A = 'Phase5 DiffA';
const D_DIFF_B = 'Phase5 DiffB';
const D_NO_SHARE = 'Phase5 No Shared';
const D_ADMIN = 'Phase5 Admin District';

const results = [];
let passed = 0;
let failed = 0;
const seenBodies = []; // every response body received (for the secret-leak checks)

const check = (name, condition, detail = '') => {
  if (condition) {
    passed += 1;
    results.push(`PASS  ${name}`);
  } else {
    failed += 1;
    results.push(`FAIL  ${name}${detail ? ` -> ${detail}` : ''}`);
  }
};

const api = async (base, path, options = {}) => {
  const res = await fetch(base + path, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
  });
  let body = null;
  try {
    body = await res.json();
  } catch {
    body = null;
  }
  seenBodies.push(JSON.stringify(body));
  return { status: res.status, body };
};

const auth = (token) => ({ Authorization: `Bearer ${token}` });
const postJson = (token, body) => ({ method: 'POST', headers: auth(token), body: JSON.stringify(body) });
const patchJson = (token, body) => ({ method: 'PATCH', headers: auth(token), body: JSON.stringify(body) });
const sumValues = (obj) => Object.values(obj).reduce((total, value) => total + value, 0);

const cleanup = async () => {
  // Alerts first: HIGH_RISK alerts point at reports via reportId, and cluster /
  // system alerts are recognised by their Phase5 test markers.
  const tempReports = await prisma.healthReport.findMany({
    where: { farmer: { email: { startsWith: 'phase5.temp.' } } },
    select: { id: true },
  });
  await prisma.alert.deleteMany({ where: { reportId: { in: tempReports.map((r) => r.id) } } });
  await prisma.alert.deleteMany({ where: { district: { startsWith: 'Phase5' } } });
  await prisma.alert.deleteMany({ where: { type: 'SYSTEM', title: { startsWith: 'Phase5' } } });

  await prisma.user.deleteMany({ where: { email: { startsWith: 'phase5.temp.' } } });
  await prisma.symptom.deleteMany({ where: { name: { startsWith: 'PHASE5' } } });
};

const run = async () => {
  await cleanup();

  // Test symptoms (shared symptom drives the cluster rule; the rest are unique).
  const symptoms = {};
  for (const name of SYMPTOM_NAMES) {
    symptoms[name] = await prisma.symptom.create({ data: { name } });
  }

  // Vet and admin accounts are created directly (registration only makes farmers).
  await prisma.user.create({
    data: { ...VET, password: await bcrypt.hash(VET.password, 10), role: 'VETERINARY_PROFESSIONAL' },
  });
  await prisma.user.create({
    data: { ...ADMIN, password: await bcrypt.hash(ADMIN.password, 10), role: 'ADMIN' },
  });

  const server = app.listen(0);
  const base = `http://127.0.0.1:${server.address().port}`;

  const setupFarmer = async (email, district) => {
    const reg = await api(base, '/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name: `Phase5 ${email}`, email, password: FARMER_PASSWORD }),
    });
    const token = reg.body?.data?.token;
    const userId = reg.body?.data?.user?.id;
    const farmRes = await api(
      base,
      '/api/farmer/farm',
      postJson(token, {
        name: 'Phase5 Test Farm',
        province: 'Masvingo',
        district,
        ward: 'Ward 1',
        village: 'Phase5 Village',
      }),
    );
    return { token, userId, farmId: farmRes.body?.data?.farm?.id };
  };

  const createAnimal = async (farmer) => {
    const res = await api(base, '/api/animals', postJson(farmer.token, { animalType: 'CATTLE', name: 'Phase5 Cow' }));
    return res.body?.data?.animal?.id;
  };

  const createReport = async (farmer, symptomIds, animalId) => {
    const res = await api(
      base,
      '/api/reports',
      postJson(farmer.token, {
        title: 'Phase5 health report',
        description: 'Smoke test health report created by the Phase 5 admin and alerting suite.',
        symptomIds,
        ...(animalId ? { animalId } : {}),
      }),
    );
    return res.body?.data?.report?.id;
  };

  const listAlerts = async (query, token) => api(base, `/api/admin/alerts${query}`, { headers: auth(token) });

  try {
    // --- Setup: farmers, farms, animals ------------------------------------
    const fHR = await setupFarmer(FARMER_EMAILS[0], D_HR);
    const fC1 = await setupFarmer(FARMER_EMAILS[1], D_CLUSTER);
    const fC2 = await setupFarmer(FARMER_EMAILS[2], D_CLUSTER);
    const fOld = await setupFarmer(FARMER_EMAILS[3], D_OLD);
    const fDiffA = await setupFarmer(FARMER_EMAILS[4], D_DIFF_A);
    const fDiffB = await setupFarmer(FARMER_EMAILS[5], D_DIFF_B);
    const fNoShare = await setupFarmer(FARMER_EMAILS[6], D_NO_SHARE);
    const farmers = [fHR, fC1, fC2, fOld, fDiffA, fDiffB, fNoShare];
    check(
      'All 7 test farmers registered with farms',
      farmers.every((f) => !!f.token && !!f.farmId),
    );

    const animalHR = await createAnimal(fHR);
    const animalC1 = await createAnimal(fC1);
    const animalC2 = await createAnimal(fC2);
    check('Cattle animals created for alert animal-type checks', !!animalHR && !!animalC1 && !!animalC2);

    const vetLogin = await api(base, '/api/auth/login', { method: 'POST', body: JSON.stringify({ email: VET.email, password: VET.password }) });
    const adminLogin = await api(base, '/api/auth/login', { method: 'POST', body: JSON.stringify({ email: ADMIN.email, password: ADMIN.password }) });
    const vetToken = vetLogin.body?.data?.token;
    const adminToken = adminLogin.body?.data?.token;
    check('Vet and admin test accounts can log in', !!vetToken && !!adminToken);

    // --- 1. Admin authorization --------------------------------------------
    const guestList = await api(base, '/api/admin/alerts');
    check('Unauthenticated admin list is rejected (401)', guestList.status === 401);
    const guestStats = await api(base, '/api/admin/stats');
    check('Unauthenticated admin statistics are rejected (401)', guestStats.status === 401);
    const guestCreate = await api(base, '/api/admin/alerts', postJson(null, { title: 'Nope alert', message: 'A message that is definitely long enough.' }));
    check('Unauthenticated alert creation is rejected (401)', guestCreate.status === 401);
    const guestScan = await api(base, '/api/admin/alerts/cluster-scan', postJson(null, {}));
    check('Unauthenticated cluster scan is rejected (401)', guestScan.status === 401);
    const guestAck = await api(base, '/api/admin/alerts/ckdoesnotexist000000000000/acknowledge', patchJson(null, {}));
    check('Unauthenticated acknowledgement is rejected (401)', guestAck.status === 401);

    const farmerList = await api(base, '/api/admin/alerts', { headers: auth(fHR.token) });
    check('Farmer cannot list admin alerts (403)', farmerList.status === 403);
    const farmerStats = await api(base, '/api/admin/stats', { headers: auth(fHR.token) });
    check('Farmer cannot read admin statistics (403)', farmerStats.status === 403);
    const farmerCreate = await api(base, '/api/admin/alerts', postJson(fHR.token, { title: 'Farmer alert', message: 'A message that is definitely long enough.' }));
    check('Farmer cannot create admin alerts (403)', farmerCreate.status === 403);
    const farmerScan = await api(base, '/api/admin/alerts/cluster-scan', postJson(fHR.token, {}));
    check('Farmer cannot run the cluster scan (403)', farmerScan.status === 403);
    const farmerAck = await api(base, '/api/admin/alerts/ckdoesnotexist000000000000/acknowledge', patchJson(fHR.token, {}));
    check('Farmer cannot acknowledge alerts (403)', farmerAck.status === 403);

    const vetList = await api(base, '/api/admin/alerts', { headers: auth(vetToken) });
    check('Veterinary professional cannot list admin alerts (403)', vetList.status === 403);
    const vetStats = await api(base, '/api/admin/stats', { headers: auth(vetToken) });
    check('Veterinary professional cannot read admin statistics (403)', vetStats.status === 403);
    const vetScan = await api(base, '/api/admin/alerts/cluster-scan', postJson(vetToken, {}));
    check('Veterinary professional cannot run the cluster scan (403)', vetScan.status === 403);

    const adminList = await api(base, '/api/admin/alerts', { headers: auth(adminToken) });
    check('Admin can list alerts (200)', adminList.status === 200 && Array.isArray(adminList.body?.data?.alerts));
    check('Admin sees an empty alert list before any alert exists', adminList.body?.data?.count === 0, `count ${adminList.body?.data?.count}`);

    // --- 2. Alert creation, detail, filters --------------------------------
    const systemCreate = await api(
      base,
      '/api/admin/alerts',
      postJson(adminToken, {
        title: 'Phase5 system notice',
        message: 'Routine Phase 5 system notice used to verify manual admin alert creation.',
        province: 'Masvingo',
        district: D_ADMIN,
        animalType: 'CATTLE',
      }),
    );
    const systemAlert = systemCreate.body?.data?.alert;
    check('Admin can create a SYSTEM alert (201)', systemCreate.status === 201 && !!systemAlert?.id, `status ${systemCreate.status}`);
    check('Manually created alert has type SYSTEM', systemAlert?.type === 'SYSTEM');
    check('Manually created alert starts active', systemAlert?.isActive === true);

    const systemDetail = await api(base, `/api/admin/alerts/${systemAlert.id}`, { headers: auth(adminToken) });
    check('Admin can retrieve an alert by id (200)', systemDetail.status === 200 && systemDetail.body?.data?.alert?.id === systemAlert.id);
    check(
      'Alert detail keeps the supplied location fields',
      systemDetail.body?.data?.alert?.province === 'Masvingo' &&
        systemDetail.body?.data?.alert?.district === D_ADMIN &&
        systemDetail.body?.data?.alert?.animalType === 'CATTLE',
    );
    check('Alert detail never exposes passwords', !JSON.stringify(systemDetail.body).toLowerCase().includes('password'));

    const allList = await listAlerts('', adminToken);
    check('Admin list returns the created alert', allList.body?.data?.count >= 1);

    const typeList = await listAlerts('?type=SYSTEM', adminToken);
    check('Filter by type returns only SYSTEM alerts', typeList.body?.data?.alerts.every((a) => a.type === 'SYSTEM'));

    const districtList = await listAlerts(`?district=${encodeURIComponent(D_ADMIN)}`, adminToken);
    check(
      'Filter by district returns only that district',
      districtList.body?.data?.count === 1 && districtList.body?.data?.alerts.every((a) => a.district === D_ADMIN),
      `count ${districtList.body?.data?.count}`,
    );

    const provinceList = await listAlerts('?province=Masvingo', adminToken);
    check('Filter by province works', provinceList.status === 200 && provinceList.body?.data?.alerts.every((a) => a.province === 'Masvingo'));

    const animalList = await listAlerts('?animalType=CATTLE', adminToken);
    check('Filter by animal type works', animalList.status === 200 && animalList.body?.data?.alerts.every((a) => a.animalType === 'CATTLE'));

    const activeList = await listAlerts('?isActive=true', adminToken);
    check('Filter by isActive=true works', activeList.status === 200 && activeList.body?.data?.alerts.every((a) => a.isActive === true));

    // --- 3. Invalid filters and payloads are rejected ----------------------
    const badType = await listAlerts('?type=NOT_A_REAL_TYPE', adminToken);
    check('Invalid alert type filter is rejected (400)', badType.status === 400);
    const badProvince = await listAlerts('?province=Atlantis', adminToken);
    check('Invalid province filter is rejected (400)', badProvince.status === 400);
    const badAnimalType = await listAlerts('?animalType=RABBIT', adminToken);
    check('Invalid animal type filter is rejected (400)', badAnimalType.status === 400);
    const badActive = await listAlerts('?isActive=maybe', adminToken);
    check('Invalid isActive filter is rejected (400)', badActive.status === 400);

    const withType = await api(base, '/api/admin/alerts', postJson(adminToken, { title: 'Phase5 smuggle', message: 'A message that is definitely long enough.', type: 'POSSIBLE_CLUSTER' }));
    check('Client-supplied alert type is rejected (400)', withType.status === 400);
    const withActive = await api(base, '/api/admin/alerts', postJson(adminToken, { title: 'Phase5 smuggle', message: 'A message that is definitely long enough.', isActive: false }));
    check('Client-supplied isActive is rejected (400)', withActive.status === 400);
    const withReportId = await api(base, '/api/admin/alerts', postJson(adminToken, { title: 'Phase5 smuggle', message: 'A message that is definitely long enough.', reportId: 'ckfake000000000000000000' }));
    check('Client-supplied reportId is rejected (400)', withReportId.status === 400);
    const missingMessage = await api(base, '/api/admin/alerts', postJson(adminToken, { title: 'Phase5 incomplete' }));
    check('Creating an alert without a message is rejected (400)', missingMessage.status === 400);

    const malformedId = await api(base, '/api/admin/alerts/abc', { headers: auth(adminToken) });
    check('Malformed alert id is rejected (400)', malformedId.status === 400);
    const unknownId = await api(base, '/api/admin/alerts/ckdoesnotexist000000000000', { headers: auth(adminToken) });
    check('Unknown alert id returns 404', unknownId.status === 404);

    // --- 4. Acknowledgement (deactivate via isActive=false) ----------------
    const ack1 = await api(base, `/api/admin/alerts/${systemAlert.id}/acknowledge`, patchJson(adminToken, {}));
    check('Admin can acknowledge an alert (200)', ack1.status === 200, `status ${ack1.status}`);
    check('Acknowledged alert is no longer active', ack1.body?.data?.alert?.isActive === false);

    const afterAckDetail = await api(base, `/api/admin/alerts/${systemAlert.id}`, { headers: auth(adminToken) });
    check('Acknowledged alert stays inactive on retrieval', afterAckDetail.body?.data?.alert?.isActive === false);

    const stillActive = await listAlerts('?isActive=true', adminToken);
    check('Acknowledged alert is excluded from active alerts', !stillActive.body?.data?.alerts.some((a) => a.id === systemAlert.id));
    const nowInactive = await listAlerts('?isActive=false', adminToken);
    check('Acknowledged alert appears in inactive alerts', nowInactive.body?.data?.alerts.some((a) => a.id === systemAlert.id));

    const ack2 = await api(base, `/api/admin/alerts/${systemAlert.id}/acknowledge`, patchJson(adminToken, {}));
    check('Acknowledging twice is idempotent (200, still inactive)', ack2.status === 200 && ack2.body?.data?.alert?.isActive === false);

    const ackUnknown = await api(base, '/api/admin/alerts/ckdoesnotexist000000000000/acknowledge', patchJson(adminToken, {}));
    check('Acknowledging an unknown alert returns 404', ackUnknown.status === 404);
    const ackMalformed = await api(base, '/api/admin/alerts/abc/acknowledge', patchJson(adminToken, {}));
    check('Acknowledging with a malformed id is rejected (400)', ackMalformed.status === 400);

    // --- 5. HIGH_RISK alerts from triage -----------------------------------
    const VALID_HIGH = JSON.stringify({
      riskLevel: 'HIGH',
      assessment: 'The reported signs may indicate a significant health concern affecting several animals. This is a risk indication only and is not a diagnosis.',
      recommendations: 'Separate the affected animals, provide clean water and normal feed, and contact a veterinary professional as soon as possible.',
      warningSigns: ['Difficulty breathing', 'Not eating at all'],
      veterinaryAttentionRecommended: true,
      followUpQuestions: ['How many days has the group been unwell?'],
    });
    const VALID_LOW = JSON.stringify({
      riskLevel: 'LOW',
      assessment: 'The reported signs may indicate a minor health concern. This is a risk indication only and is not a diagnosis.',
      recommendations: 'Monitor the animal, keep it comfortable, and contact a veterinary professional if it gets worse.',
      warningSigns: ['Worsening appetite', 'Difficulty standing'],
      veterinaryAttentionRecommended: false,
      followUpQuestions: ['Has the animal been treated recently?'],
    });

    const highReportId = await createReport(fHR, [symptoms.PHASE5_SYM_HR.id], animalHR);
    check('High-risk report created', !!highReportId);

    // Mocked so the Phase 5 suite stays deterministic (no live AI call needed).
    geminiService.setMockGenerate(async () => VALID_HIGH);
    const highTriage = await api(base, `/api/reports/${highReportId}/triage`, { method: 'POST', headers: auth(fHR.token) });
    check('HIGH risk triage returns riskLevel HIGH', highTriage.status === 200 && highTriage.body?.data?.aiTriage?.riskLevel === 'HIGH');

    const highRiskList = await listAlerts('?type=HIGH_RISK', adminToken);
    const highRiskAlerts = (highRiskList.body?.data?.alerts || []).filter((a) => a.reportId === highReportId);
    check('HIGH risk triage created a HIGH_RISK alert', highRiskAlerts.length === 1, `got ${highRiskAlerts.length}`);
    const highRiskAlert = highRiskAlerts[0];
    check('HIGH_RISK alert links to the report', highRiskAlert?.reportId === highReportId);
    check('HIGH_RISK alert has the province', highRiskAlert?.province === 'Masvingo');
    check('HIGH_RISK alert has the district', highRiskAlert?.district === D_HR);
    check('HIGH_RISK alert has the animal type', highRiskAlert?.animalType === 'CATTLE');
    check('HIGH_RISK alert is active', highRiskAlert?.isActive === true);
    check(
      'HIGH_RISK message is factual and safety-oriented',
      typeof highRiskAlert?.message === 'string' && highRiskAlert.message.includes('requires veterinary attention'),
    );
    check('HIGH_RISK message never claims confirmation or an outbreak', !/confirmed|outbreak|guaranteed|definitely/i.test(highRiskAlert?.message || ''));

    // Duplicate prevention: triage the SAME report again.
    const highTriageAgain = await api(base, `/api/reports/${highReportId}/triage`, { method: 'POST', headers: auth(fHR.token) });
    check('Triaging again still returns HIGH', highTriageAgain.body?.data?.aiTriage?.riskLevel === 'HIGH');
    const highRiskAfter = (await listAlerts('?type=HIGH_RISK', adminToken)).body?.data?.alerts.filter((a) => a.reportId === highReportId) || [];
    check('No duplicate active HIGH_RISK alert for the same report', highRiskAfter.length === 1, `got ${highRiskAfter.length}`);

    // A LOW result must not raise a HIGH_RISK alert.
    const lowReportId = await createReport(fHR, [], null);
    geminiService.setMockGenerate(async () => VALID_LOW);
    const lowTriage = await api(base, `/api/reports/${lowReportId}/triage`, { method: 'POST', headers: auth(fHR.token) });
    check('LOW triage returns riskLevel LOW', lowTriage.status === 200 && lowTriage.body?.data?.aiTriage?.riskLevel === 'LOW');
    const lowAlerts = (await listAlerts('?type=HIGH_RISK', adminToken)).body?.data?.alerts.filter((a) => a.reportId === lowReportId) || [];
    check('LOW risk triage does not create a HIGH_RISK alert', lowAlerts.length === 0, `got ${lowAlerts.length}`);

    const highDetail = await api(base, `/api/admin/alerts/${highRiskAlert.id}`, { headers: auth(adminToken) });
    check('HIGH_RISK alert detail includes the linked health report', highDetail.body?.data?.alert?.report?.id === highReportId);
    check('HIGH_RISK alert detail includes the linked report farm', !!highDetail.body?.data?.alert?.report?.farm);
    check('HIGH_RISK alert detail never exposes passwords', !JSON.stringify(highDetail.body).toLowerCase().includes('password'));

    // --- 6. POSSIBLE_CLUSTER detection -------------------------------------
    // Qualifying group (4 of 5 so far) in District 1, shared symptom.
    const clusterReports = [
      await createReport(fC1, [symptoms.PHASE5_SYM_SHARED.id], animalC1),
      await createReport(fC1, [symptoms.PHASE5_SYM_SHARED.id], animalC1),
      await createReport(fC1, [symptoms.PHASE5_SYM_SHARED.id], animalC1),
      await createReport(fC2, [symptoms.PHASE5_SYM_SHARED.id], animalC2),
    ];
    check('Four qualifying reports created in the cluster district', clusterReports.every(Boolean));

    // 7-day window: 3 fresh reports, one backdated beyond 7 days, then a 4th
    // fresh report so detection runs while the group is split across the window.
    const oldFresh1 = await createReport(fOld, [symptoms.PHASE5_SYM_OLD.id], null);
    const oldFresh2 = await createReport(fOld, [symptoms.PHASE5_SYM_OLD.id], null);
    const oldFresh3 = await createReport(fOld, [symptoms.PHASE5_SYM_OLD.id], null);
    await prisma.healthReport.create({
      data: {
        title: 'Phase5 backdated report',
        description: 'Backdated Phase 5 report used to verify the 7 day cluster window.',
        farmerId: fOld.userId,
        farmId: fOld.farmId,
        symptoms: { create: [{ symptomId: symptoms.PHASE5_SYM_OLD.id }] },
        createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
      },
    });
    const oldFresh4 = await createReport(fOld, [symptoms.PHASE5_SYM_OLD.id], null);
    check('Old-window district reports created', !!oldFresh1 && !!oldFresh2 && !!oldFresh3 && !!oldFresh4);

    // District separation: 4 reports in DiffA + 1 report in DiffB share a symptom.
    const diffReports = [
      await createReport(fDiffA, [symptoms.PHASE5_SYM_DIFF.id], null),
      await createReport(fDiffA, [symptoms.PHASE5_SYM_DIFF.id], null),
      await createReport(fDiffA, [symptoms.PHASE5_SYM_DIFF.id], null),
      await createReport(fDiffA, [symptoms.PHASE5_SYM_DIFF.id], null),
      await createReport(fDiffB, [symptoms.PHASE5_SYM_DIFF.id], null),
    ];
    check('Different-district reports created', diffReports.every(Boolean));

    // Symptom separation: 5 reports in one district, each with a unique symptom.
    const noShareSymptoms = [
      symptoms.PHASE5_SYM_N1.id,
      symptoms.PHASE5_SYM_N2.id,
      symptoms.PHASE5_SYM_N3.id,
      symptoms.PHASE5_SYM_N4.id,
      symptoms.PHASE5_SYM_N5.id,
    ];
    const noShareReports = [];
    for (const symptomId of noShareSymptoms) {
      noShareReports.push(await createReport(fNoShare, [symptomId], null));
    }
    check('Five non-sharing reports created', noShareReports.every(Boolean));

    // A full scan now must find nothing: every group is below the threshold,
    // outside the window, split across districts, or missing a shared symptom.
    const scan1 = await api(base, '/api/admin/alerts/cluster-scan', postJson(adminToken, {}));
    check('Cluster scan finds no qualifying group yet (count 0)', scan1.status === 200 && scan1.body?.data?.count === 0, `count ${scan1.body?.data?.count}`);

    const allClusters = await listAlerts('?type=POSSIBLE_CLUSTER', adminToken);
    const phase5Clusters = (allClusters.body?.data?.alerts || []).filter((a) => (a.district || '').startsWith('Phase5'));
    check('No cluster alert exists before 5 qualifying reports', phase5Clusters.length === 0, `found ${phase5Clusters.length}`);

    const clusterCount = async (district) => (await listAlerts(`?type=POSSIBLE_CLUSTER&district=${encodeURIComponent(district)}`, adminToken)).body?.data?.count;
    check('Fewer than 5 reports do not trigger a cluster alert', (await clusterCount(D_CLUSTER)) === 0);
    check('Reports outside the 7-day window do not qualify', (await clusterCount(D_OLD)) === 0);
    check('Reports split across different districts do not qualify', (await clusterCount(D_DIFF_A)) === 0 && (await clusterCount(D_DIFF_B)) === 0);
    check('Reports without a shared symptom do not qualify', (await clusterCount(D_NO_SHARE)) === 0);

    const badScanBody = await api(base, '/api/admin/alerts/cluster-scan', postJson(adminToken, { foo: 'bar' }));
    check('Cluster scan rejects unknown body fields (400)', badScanBody.status === 400);

    // The 5th qualifying report completes the cluster -> alert is created
    // automatically during report creation.
    const fifthReport = await createReport(fC2, [symptoms.PHASE5_SYM_SHARED.id], animalC2);
    check('Fifth qualifying report created', !!fifthReport);

    const clusterAlertList = await listAlerts(`?type=POSSIBLE_CLUSTER&district=${encodeURIComponent(D_CLUSTER)}`, adminToken);
    check('Cluster alert created after the 5th qualifying report', clusterAlertList.body?.data?.count === 1, `count ${clusterAlertList.body?.data?.count}`);
    const clusterAlert = (clusterAlertList.body?.data?.alerts || [])[0];
    check('Cluster alert type is POSSIBLE_CLUSTER', clusterAlert?.type === 'POSSIBLE_CLUSTER');
    check('Cluster alert reportCount is at least 5', (clusterAlert?.reportCount || 0) >= 5, `reportCount ${clusterAlert?.reportCount}`);
    check('Cluster alert has the correct district', clusterAlert?.district === D_CLUSTER);
    check('Cluster alert has the correct province', clusterAlert?.province === 'Masvingo');
    check('Cluster alert carries the shared animal type', clusterAlert?.animalType === 'CATTLE');
    check('Cluster alert is active', clusterAlert?.isActive === true);
    check('Cluster alert is not tied to a single report', clusterAlert?.reportId === null);
    check(
      'Cluster message uses the approved non-confirmatory wording',
      typeof clusterAlert?.message === 'string' &&
        clusterAlert.message.includes('Possible health cluster detected; further veterinary investigation is recommended.'),
    );
    check('Cluster message never claims confirmation or an outbreak', !/confirmed|outbreak|guaranteed|definitely/i.test(clusterAlert?.message || ''));

    // Duplicate prevention: a repeat scan must not create another alert.
    const scan2 = await api(base, '/api/admin/alerts/cluster-scan', postJson(adminToken, {}));
    check('Repeat cluster scan creates no duplicate alerts (count 0)', scan2.status === 200 && scan2.body?.data?.count === 0, `count ${scan2.body?.data?.count}`);
    check('Only one cluster alert exists for the district after re-scan', (await clusterCount(D_CLUSTER)) === 1);

    // --- 7. Admin oversight statistics -------------------------------------
    const statsRes = await api(base, '/api/admin/stats', { headers: auth(adminToken) });
    check('Admin statistics endpoint works (200)', statsRes.status === 200);
    const stats = statsRes.body?.data?.statistics;
    check('Statistics report a sensible report total', !!stats && stats.reports.total >= 22, `total ${stats?.reports?.total}`);
    check('Reports by status sum to the total', sumValues(stats.reports.byStatus) === stats.reports.total);
    check('Reports by risk level sum to the total', sumValues(stats.reports.byRiskLevel) === stats.reports.total);
    check('Reports by province sum to the total', sumValues(stats.reports.byProvince) === stats.reports.total);
    check('Reports by animal type sum to the total', sumValues(stats.reports.byAnimalType) === stats.reports.total);
    check('Statistics count the test farmers', stats.users.farmers >= 7, `farmers ${stats.users.farmers}`);
    check('Statistics count veterinary professionals', stats.users.veterinaryProfessionals >= 1);
    check(
      'Statistics count alert totals',
      stats.alerts.total >= 3 && stats.alerts.active >= 2,
      `total ${stats.alerts.total}, active ${stats.alerts.active}`,
    );
    check(
      'Statistics break alerts down by type',
      stats.alerts.byType.HIGH_RISK >= 1 && stats.alerts.byType.POSSIBLE_CLUSTER >= 1 && stats.alerts.byType.SYSTEM >= 1,
    );
    check('Referral counts are present and consistent', sumValues(stats.referrals.byStatus) === stats.referrals.total);
    check('Statistics never include passwords', !JSON.stringify(statsRes.body).toLowerCase().includes('password'));

    // --- 8. Secrets must never appear in any response ----------------------
    check('No API response contains the admin password', seenBodies.every((b) => !b.includes(ADMIN.password)));
    check('No API response contains the vet password', seenBodies.every((b) => !b.includes(VET.password)));
    check('No API response contains the farmer password', seenBodies.every((b) => !b.includes(FARMER_PASSWORD)));
    check(
      'No API response contains the Gemini API key',
      !env.GEMINI_API_KEY || seenBodies.every((b) => !b.includes(env.GEMINI_API_KEY)),
    );

  } catch (err) {
    failed += 1;
    results.push(`FAIL  Unexpected error -> ${err.message}`);
  } finally {
    server.close();
    geminiService.resetMockGenerate();
    await cleanup();
    await prisma.$disconnect();
  }

  console.log('\nPhase 5 smoke test results (admin & alerting)');
  console.log('============================================================');
  results.forEach((line) => console.log(line));
  console.log('============================================================');
  console.log(`${passed} passed, ${failed} failed\n`);

  process.exit(failed === 0 ? 0 : 1);
};

run();