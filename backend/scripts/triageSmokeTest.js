// ============================================================================
// PHASE 3 SMOKE TEST - Gemini AI triage
// ----------------------------------------------------------------------------
// Run from the backend folder with:  npm run smoke:triage
//
// Gemini is MOCKED (see geminiService.setMockGenerate). No real network call is
// made, no API key is needed, and every result is fully deterministic.
// ============================================================================
const SENTINEL_GEMINI_KEY = 'SENTINEL_GEMINI_KEY_SHOULD_NEVER_LEAK_9f3a1';

// Set BEFORE the app is loaded so we can prove the key never appears in a response.
process.env.GEMINI_API_KEY = SENTINEL_GEMINI_KEY;
process.env.NODE_ENV = 'test';

const bcrypt = require('bcrypt');

const app = require('../src/app');
const prisma = require('../src/config/prisma');
const geminiService = require('../src/services/geminiService');

const FARMER_A = { name: 'Phase3 Farmer A', email: 'phase3.temp.farmer.a@example.com', password: 'FarmerPass123' };
const FARMER_B = { name: 'Phase3 Farmer B', email: 'phase3.temp.farmer.b@example.com', password: 'FarmerPass123' };
const VET = { name: 'Phase3 Vet', email: 'phase3.temp.vet@example.com', password: 'VetPass123' };
const ADMIN = { name: 'Phase3 Admin', email: 'phase3.temp.admin@example.com', password: 'AdminPass123' };

const TEMP_EMAILS = [FARMER_A.email, FARMER_B.email, VET.email, ADMIN.email];
const SYMPTOM_NAMES = ['PHASE3_TEST_FEVER', 'PHASE3_TEST_COUGH', 'PHASE3_TEST_DIARRHOEA'];

const FARM_A = { name: 'Phase3 Farm', province: 'Masvingo', district: 'Masvingo', ward: 'Ward 3', village: 'Village 3' };

// A worrying report (should score HIGH on the fallback scale).
const SEVERE_REPORT = {
  title: 'Severe breathing problem',
  description: 'The cow is breathing with difficulty and the whole group looks unwell for three days.',
  symptomsDuration: '3 days',
  appetite: 'None',
  breathingDifficulty: true,
  affectedAnimals: 6,
  recentMovement: true,
  recentVaccination: false,
  additionalNotes: 'Several animals affected in the same kraal.',
};

// A minor report (should score LOW on the fallback scale).
const MILD_REPORT = {
  title: 'Slight limp',
  description: 'One goat has a small limp on the front leg but is eating and drinking normally.',
  appetite: 'Normal',
  breathingDifficulty: false,
  affectedAnimals: 1,
};

const results = [];
let passed = 0;
let failed = 0;
const seenBodies = []; // every response body we received (for the key-leak check)
let capturedPrompt = null; // the last prompt handed to the mocked Gemini

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
const postEmpty = (token) => (token ? { method: 'POST', headers: auth(token) } : { method: 'POST' });

const cleanup = async () => {
  // Phase 5: a HIGH risk triage can create an Alert linked to these reports.
  // Alerts are removed FIRST, while their reportId link still exists.
  const tempReports = await prisma.healthReport.findMany({
    where: { farmer: { email: { in: TEMP_EMAILS } } },
    select: { id: true },
  });
  await prisma.alert.deleteMany({ where: { reportId: { in: tempReports.map((r) => r.id) } } });

  await prisma.user.deleteMany({ where: { email: { in: TEMP_EMAILS } } });
  await prisma.symptom.deleteMany({ where: { name: { in: SYMPTOM_NAMES } } });
};

const run = async () => {
  await cleanup();

  const symptoms = await Promise.all(
    SYMPTOM_NAMES.map((name) => prisma.symptom.create({ data: { name } })),
  );

  await prisma.user.create({
    data: { ...VET, password: await bcrypt.hash(VET.password, 10), role: 'VETERINARY_PROFESSIONAL' },
  });
  await prisma.user.create({
    data: { ...ADMIN, password: await bcrypt.hash(ADMIN.password, 10), role: 'ADMIN' },
  });

  const server = app.listen(0);
  const base = `http://127.0.0.1:${server.address().port}`;

  try {
    const regA = await api(base, '/api/auth/register', { method: 'POST', body: JSON.stringify(FARMER_A) });
    const regB = await api(base, '/api/auth/register', { method: 'POST', body: JSON.stringify(FARMER_B) });
    const tokenA = regA.body?.data?.token;
    const tokenB = regB.body?.data?.token;

    const vetLogin = await api(base, '/api/auth/login', { method: 'POST', body: JSON.stringify({ email: VET.email, password: VET.password }) });
    const adminLogin = await api(base, '/api/auth/login', { method: 'POST', body: JSON.stringify({ email: ADMIN.email, password: ADMIN.password }) });
    const vetToken = vetLogin.body?.data?.token;
    const adminToken = adminLogin.body?.data?.token;
    check('Test accounts are ready', !!tokenA && !!tokenB && !!vetToken && !!adminToken);

    // Farmer A data: farm, animal and two reports.
    await api(base, '/api/farmer/farm', postJson(tokenA, FARM_A));
    const animalRes = await api(base, '/api/animals', postJson(tokenA, { animalType: 'CATTLE', name: 'Phase3 Cow', tagNumber: 'P3-001' }));
    const animalId = animalRes.body?.data?.animal?.id;

    const severeRes = await api(
      base,
      '/api/reports',
      postJson(tokenA, { ...SEVERE_REPORT, animalId, symptomIds: symptoms.map((s) => s.id) }),
    );
    const severeId = severeRes.body?.data?.report?.id;

    const mildRes = await api(base, '/api/reports', postJson(tokenA, MILD_REPORT));
    const mildId = mildRes.body?.data?.report?.id;

    check('Farmer A has two reports to triage', !!severeId && !!mildId);

    const VALID_LOW = JSON.stringify({
      riskLevel: 'LOW',
      assessment: 'The reported signs may indicate a minor health concern. This is a risk indication only and is not a diagnosis.',
      recommendations: 'Monitor the animal, keep it comfortable, and contact a veterinary professional if it gets worse.',
      warningSigns: ['Worsening appetite', 'Difficulty standing'],
      veterinaryAttentionRecommended: false,
      followUpQuestions: ['Has the animal been treated recently?'],
    });

    const VALID_HIGH = JSON.stringify({
      riskLevel: 'HIGH',
      assessment: 'The reported signs may indicate a significant health concern affecting several animals. This is a risk indication only and is not a diagnosis.',
      recommendations: 'Separate the affected animals, provide clean water and normal feed, and contact a veterinary professional as soon as possible.',
      warningSigns: ['Difficulty breathing', 'Not eating at all'],
      veterinaryAttentionRecommended: true,
      followUpQuestions: ['How many days has the group been unwell?'],
    });

    // --- 1. Successful (mocked) AI triage --------------------------------
    geminiService.setMockGenerate(async (prompt) => {
      capturedPrompt = prompt;
      return VALID_HIGH;
    });

    const triageOk = await api(base, `/api/reports/${severeId}/triage`, postEmpty(tokenA));
    check('Farmer A can triage their own report (200)', triageOk.status === 200, `status ${triageOk.status}`);
    check('Successful AI triage reports source GEMINI', triageOk.body?.data?.aiTriage?.source === 'GEMINI');
    check('riskLevel is returned and valid', ['LOW', 'MODERATE', 'HIGH'].includes(triageOk.body?.data?.aiTriage?.riskLevel));
    check('warningSigns is an array', Array.isArray(triageOk.body?.data?.aiTriage?.warningSigns));
    check('veterinaryAttentionRecommended is a boolean', typeof triageOk.body?.data?.aiTriage?.veterinaryAttentionRecommended === 'boolean');
    check('followUpQuestions is an array', Array.isArray(triageOk.body?.data?.aiTriage?.followUpQuestions));
    check('A safety disclaimer is always returned', typeof triageOk.body?.data?.aiTriage?.disclaimer === 'string');

    check(
      'Prompt includes trusted report data from the database',
      typeof capturedPrompt === 'string' && capturedPrompt.includes(SEVERE_REPORT.title),
    );
    check(
      'Prompt does NOT include the farmer email or password',
      !!capturedPrompt && !capturedPrompt.includes(FARMER_A.email) && !capturedPrompt.includes(FARMER_A.password),
    );

    const persisted = await api(base, `/api/reports/${severeId}`, { headers: auth(tokenA) });
    check('riskLevel is persisted on the report', persisted.body?.data?.report?.riskLevel === 'HIGH');
    check(
      'aiAssessment is persisted',
      typeof persisted.body?.data?.report?.aiAssessment === 'string' && persisted.body.data.report.aiAssessment.length > 10,
    );
    check(
      'aiRecommendations is persisted',
      typeof persisted.body?.data?.report?.aiRecommendations === 'string' && persisted.body.data.report.aiRecommendations.length > 10,
    );

    geminiService.setMockGenerate(async () => VALID_LOW);
    const triageAgain = await api(base, `/api/reports/${severeId}/triage`, postEmpty(tokenA));
    check('Triaging again updates the stored risk level', triageAgain.body?.data?.report?.riskLevel === 'LOW');

    // --- 2. Invalid or unsafe AI answers must fall back safely -----------
    const expectFallback = async (label, mockFn) => {
      geminiService.setMockGenerate(mockFn);
      const res = await api(base, `/api/reports/${mildId}/triage`, postEmpty(tokenA));
      check(
        label,
        res.status === 200 && res.body?.data?.aiTriage?.source === 'FALLBACK',
        `status ${res.status}, source ${res.body?.data?.aiTriage?.source}`,
      );
    };

    await expectFallback('Invalid JSON from the AI falls back safely', async () => 'this is not json');
    await expectFallback('Invalid risk level from the AI falls back safely', async () => {
      const o = JSON.parse(VALID_LOW);
      o.riskLevel = 'CRITICAL';
      return JSON.stringify(o);
    });
    await expectFallback('Missing required field falls back safely', async () => {
      const o = JSON.parse(VALID_LOW);
      delete o.recommendations;
      return JSON.stringify(o);
    });
    await expectFallback('Unexpected extra field falls back safely', async () =>
      JSON.stringify({ ...JSON.parse(VALID_LOW), confidence: 0.9 }),
    );
    await expectFallback('Wrong field type falls back safely', async () =>
      JSON.stringify({ ...JSON.parse(VALID_LOW), warningSigns: 'none' }),
    );
    await expectFallback('Diagnostic wording from the AI falls back safely', async () =>
      JSON.stringify({ ...JSON.parse(VALID_LOW), assessment: 'This animal definitely has foot and mouth disease.' }),
    );
    await expectFallback('AI service failure falls back safely', async () => {
      throw new Error('simulated outage');
    });

    // --- 3. Fallback risk levels are deterministic -----------------------
    geminiService.setMockGenerate(async () => {
      throw new Error('outage');
    });
    const fallbackSevere = await api(base, `/api/reports/${severeId}/triage`, postEmpty(tokenA));
    const fallbackMild = await api(base, `/api/reports/${mildId}/triage`, postEmpty(tokenA));
    check('Fallback rates a severe report HIGH', fallbackSevere.body?.data?.aiTriage?.riskLevel === 'HIGH');
    check('Fallback rates a mild report LOW', fallbackMild.body?.data?.aiTriage?.riskLevel === 'LOW');
    check('Fallback never claims a diagnosis', /not a diagnosis/i.test(fallbackSevere.body?.data?.aiTriage?.assessment || ''));
    check(
      'Fallback recommends veterinary attention for HIGH risk',
      fallbackSevere.body?.data?.aiTriage?.veterinaryAttentionRecommended === true,
    );

    // --- 4. Ownership and role guards ------------------------------------
    geminiService.setMockGenerate(async () => VALID_HIGH);

    const guestTriage = await api(base, `/api/reports/${severeId}/triage`, postEmpty(null));
    check('Unauthenticated triage is rejected (401)', guestTriage.status === 401);

    const vetTriage = await api(base, `/api/reports/${severeId}/triage`, postEmpty(vetToken));
    check('Vet cannot use the farmer triage endpoint (403)', vetTriage.status === 403);

    const adminTriage = await api(base, `/api/reports/${severeId}/triage`, postEmpty(adminToken));
    check('Admin cannot use the farmer triage endpoint (403)', adminTriage.status === 403);

    const crossTriage = await api(base, `/api/reports/${severeId}/triage`, postEmpty(tokenB));
    check('Farmer B CANNOT triage Farmer A\'s report (404)', crossTriage.status === 404);

    const afterCross = await api(base, `/api/reports/${severeId}`, { headers: auth(tokenA) });
    check('Cross-farmer attempt did not change A\'s report', afterCross.body?.data?.report?.id === severeId);

    const unknownReport = await api(base, '/api/reports/ckdoesnotexist000000000000/triage', postEmpty(tokenA));
    check('Unknown report id is handled safely (404)', unknownReport.status === 404);

    const malformedReport = await api(base, '/api/reports/abc/triage', postEmpty(tokenA));
    check('Malformed report id is rejected (400)', malformedReport.status === 400);

    // --- 5. The Gemini API key must never appear in any response ---------
    check('No API response contains the Gemini API key', seenBodies.every((b) => !b.includes(SENTINEL_GEMINI_KEY)));
  } catch (err) {
    failed += 1;
    results.push(`FAIL  Unexpected error -> ${err.message}`);
  } finally {
    server.close();
    geminiService.resetMockGenerate();
    await cleanup();
    await prisma.$disconnect();
  }

  console.log('\nPhase 3 smoke test results (Gemini AI triage)');
  console.log('============================================================');
  results.forEach((line) => console.log(line));
  console.log('============================================================');
  console.log(`${passed} passed, ${failed} failed\n`);

  process.exit(failed === 0 ? 0 : 1);
};

run();
