// ============================================================================
// PHASE 2 SMOKE TEST - Farmer functionality + ownership security
// ----------------------------------------------------------------------------
// Run from the backend folder with:  npm run smoke:farmer
//
// It starts the API in-process, creates TWO farmers (A and B), and proves that:
//   - a farmer can fully manage their OWN farm, animals and reports, and
//   - a farmer CANNOT read or change another farmer's records (404), and
//   - veterinary/admin accounts are blocked from farmer routes (403).
//
// Every temporary record it creates is deleted at the end.
// ============================================================================
const bcrypt = require('bcrypt');

const app = require('../src/app');
const prisma = require('../src/config/prisma');

const FARMER_A = { name: 'Phase2 Farmer A', email: 'phase2.temp.farmer.a@example.com', password: 'FarmerPass123' };
const FARMER_B = { name: 'Phase2 Farmer B', email: 'phase2.temp.farmer.b@example.com', password: 'FarmerPass123' };
const FARMER_C = { name: 'Phase2 Farmer C', email: 'phase2.temp.farmer.c@example.com', password: 'FarmerPass123' };
const VET = { name: 'Phase2 Vet', email: 'phase2.temp.vet@example.com', password: 'VetPass123' };
const ADMIN = { name: 'Phase2 Admin', email: 'phase2.temp.admin@example.com', password: 'AdminPass123' };

const TEMP_EMAILS = [FARMER_A.email, FARMER_B.email, FARMER_C.email, VET.email, ADMIN.email];
const SYMPTOM_NAMES = ['PHASE2_TEST_SYMPTOM_A', 'PHASE2_TEST_SYMPTOM_B'];

const FARM_A = {
  name: 'A Test Farm',
  province: 'Harare',
  district: 'Harare',
  ward: 'Ward 1',
  village: 'Village 1',
  address: '1 Test Road',
};
const FARM_B = { name: 'B Test Farm', province: 'Midlands', district: 'Gweru', ward: 'Ward 2' };

const ANIMAL_A = { animalType: 'CATTLE', name: 'A Cow', tagNumber: 'A-001', breed: 'Mashona', age: 3, sex: 'FEMALE' };

const results = [];
let passed = 0;
let failed = 0;

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
  return { status: res.status, body };
};

const auth = (token) => ({ Authorization: `Bearer ${token}` });
const post = (token, body) => ({ method: 'POST', headers: auth(token), body: JSON.stringify(body) });
const put = (token, body) => ({ method: 'PUT', headers: auth(token), body: JSON.stringify(body) });

const cleanup = async () => {
  // Deleting a user cascades to their farm, animals, reports and report-symptoms.
  await prisma.user.deleteMany({ where: { email: { in: TEMP_EMAILS } } });
  await prisma.symptom.deleteMany({ where: { name: { in: SYMPTOM_NAMES } } });
};

const run = async () => {
  await cleanup(); // remove leftovers from a previous incomplete run

  // Reference symptoms that reports can link to.
  const [symptomA, symptomB] = await Promise.all(
    SYMPTOM_NAMES.map((name) => prisma.symptom.create({ data: { name } })),
  );

  // A vet and an admin account, used to prove role blocking on farmer routes.
  await prisma.user.create({
    data: { ...VET, password: await bcrypt.hash(VET.password, 10), role: 'VETERINARY_PROFESSIONAL' },
  });
  await prisma.user.create({
    data: { ...ADMIN, password: await bcrypt.hash(ADMIN.password, 10), role: 'ADMIN' },
  });

  const server = app.listen(0);
  const base = `http://127.0.0.1:${server.address().port}`;

  try {
    // --- Accounts ---------------------------------------------------------
    const regA = await api(base, '/api/auth/register', { method: 'POST', body: JSON.stringify(FARMER_A) });
    const regB = await api(base, '/api/auth/register', { method: 'POST', body: JSON.stringify(FARMER_B) });
    const tokenA = regA.body?.data?.token;
    const tokenB = regB.body?.data?.token;
    check('Farmer A registered', regA.status === 201 && !!tokenA);
    check('Farmer B registered', regB.status === 201 && !!tokenB);

    const vetLogin = await api(base, '/api/auth/login', { method: 'POST', body: JSON.stringify({ email: VET.email, password: VET.password }) });
    const adminLogin = await api(base, '/api/auth/login', { method: 'POST', body: JSON.stringify({ email: ADMIN.email, password: ADMIN.password }) });
    const vetToken = vetLogin.body?.data?.token;
    const adminToken = adminLogin.body?.data?.token;
    check('Vet and admin can log in', !!vetToken && !!adminToken);

    // --- Farm profile -----------------------------------------------------
    const noFarm = await api(base, '/api/farmer/farm', { headers: auth(tokenA) });
    check('New farmer has no farm yet (farm = null)', noFarm.status === 200 && noFarm.body?.data?.farm === null);

    const createFarmA = await api(base, '/api/farmer/farm', post(tokenA, FARM_A));
    check('Farmer A can create a farm', createFarmA.status === 201 && createFarmA.body?.data?.farm?.name === FARM_A.name);

    const duplicateFarmA = await api(base, '/api/farmer/farm', post(tokenA, FARM_A));
    check('A second farm for the same farmer is rejected (409)', duplicateFarmA.status === 409);

    const badFarm = await api(base, '/api/farmer/farm', post(tokenB, { name: 'x', province: 'Atlantis', district: 'y' }));
    check('Invalid farm body is rejected (400)', badFarm.status === 400);

    const updateFarmA = await api(base, '/api/farmer/farm', put(tokenA, { district: 'Harare Central' }));
    check('Farmer A can update their farm', updateFarmA.status === 200 && updateFarmA.body?.data?.farm?.district === 'Harare Central');

    const createFarmB = await api(base, '/api/farmer/farm', post(tokenB, FARM_B));
    check('Farmer B can create their own farm', createFarmB.status === 201);

    const getFarmA = await api(base, '/api/farmer/farm', { headers: auth(tokenA) });
    const getFarmB = await api(base, '/api/farmer/farm', { headers: auth(tokenB) });
    check('Farmer A sees only their own farm', getFarmA.body?.data?.farm?.name === FARM_A.name);
    check('Farmer B sees only their own farm', getFarmB.body?.data?.farm?.name === FARM_B.name);

    // --- Animals ----------------------------------------------------------
    const createAnimalA = await api(base, '/api/animals', post(tokenA, ANIMAL_A));
    const animalAId = createAnimalA.body?.data?.animal?.id;
    check('Farmer A can add an animal', createAnimalA.status === 201 && !!animalAId);

    const badAnimal = await api(base, '/api/animals', post(tokenA, { animalType: 'DRAGON' }));
    check('Invalid animalType is rejected (400)', badAnimal.status === 400);

    const listA = await api(base, '/api/animals', { headers: auth(tokenA) });
    const listB = await api(base, '/api/animals', { headers: auth(tokenB) });
    check('Farmer A sees 1 animal', listA.body?.data?.count === 1);
    check('Farmer B sees 0 animals (isolation)', listB.body?.data?.count === 0);

    const getOwnAnimal = await api(base, `/api/animals/${animalAId}`, { headers: auth(tokenA) });
    check('Farmer A can read their own animal', getOwnAnimal.status === 200);

    // CROSS-FARMER: B must not touch A's animal.
    const crossRead = await api(base, `/api/animals/${animalAId}`, { headers: auth(tokenB) });
    check('Farmer B CANNOT read A\'s animal (404)', crossRead.status === 404);
    const crossUpdate = await api(base, `/api/animals/${animalAId}`, put(tokenB, { name: 'Stolen' }));
    check('Farmer B CANNOT update A\'s animal (404)', crossUpdate.status === 404);
    const crossDelete = await api(base, `/api/animals/${animalAId}`, { method: 'DELETE', headers: auth(tokenB) });
    check('Farmer B CANNOT delete A\'s animal (404)', crossDelete.status === 404);
    const stillThere = await api(base, `/api/animals/${animalAId}`, { headers: auth(tokenA) });
    check('A\'s animal is unchanged after B\'s attempts', stillThere.body?.data?.animal?.name === ANIMAL_A.name);

    const updateOwnAnimal = await api(base, `/api/animals/${animalAId}`, put(tokenA, { name: 'A Cow Updated' }));
    check('Farmer A can update their own animal', updateOwnAnimal.status === 200 && updateOwnAnimal.body?.data?.animal?.name === 'A Cow Updated');

    const badId = await api(base, '/api/animals/abc', { headers: auth(tokenA) });
    check('Malformed id is rejected (400)', badId.status === 400);

    const missing = await api(base, '/api/animals/ckdoesnotexist000000000000', { headers: auth(tokenA) });
    check('Unknown animal id returns 404', missing.status === 404);
    // --- Health reports ---------------------------------------------------
    const reportBodyA = {
      title: 'Cow with fever',
      description: 'My cow has had a high temperature and is eating very little for two days.',
      animalId: animalAId,
      symptomIds: [symptomA.id, symptomB.id],
      symptomsDuration: '2 days',
      appetite: 'Reduced',
      breathingDifficulty: false,
      affectedAnimals: 1,
      recentMovement: false,
      recentVaccination: true,
      additionalNotes: 'No other animals affected yet.',
    };

    const createReportA = await api(base, '/api/reports', post(tokenA, reportBodyA));
    const reportAId = createReportA.body?.data?.report?.id;
    check('Farmer A can create a health report', createReportA.status === 201 && !!reportAId);
    check(
      'New report starts as PENDING with no AI risk level yet',
      createReportA.body?.data?.report?.status === 'PENDING' && createReportA.body?.data?.report?.riskLevel === null,
    );
    check('Report links the selected symptoms', createReportA.body?.data?.report?.symptoms?.length === 2);
    check('Report links the chosen animal', createReportA.body?.data?.report?.animalId === animalAId);

    const listReportsA = await api(base, '/api/reports', { headers: auth(tokenA) });
    const listReportsB = await api(base, '/api/reports', { headers: auth(tokenB) });
    check('Farmer A sees 1 report', listReportsA.body?.data?.count === 1);
    check('Farmer B sees 0 reports (isolation)', listReportsB.body?.data?.count === 0);

    const ownReport = await api(base, `/api/reports/${reportAId}`, { headers: auth(tokenA) });
    check('Farmer A can read their own report', ownReport.status === 200 && ownReport.body?.data?.report?.farm?.name === FARM_A.name);

    // CROSS-FARMER: B must not read A's report, nor attach a report to A's animal.
    const crossReport = await api(base, `/api/reports/${reportAId}`, { headers: auth(tokenB) });
    check('Farmer B CANNOT read A\'s report (404)', crossReport.status === 404);
    const crossReportCreate = await api(base, '/api/reports', post(tokenB, { ...reportBodyA, symptomIds: [] }));
    check('Farmer B CANNOT create a report against A\'s animal (404)', crossReportCreate.status === 404);

    // Validation
    const badSymptom = await api(
      base,
      '/api/reports',
      post(tokenA, {
        title: 'Bad symptom',
        description: 'A description long enough to pass validation.',
        symptomIds: ['cknonexistent00000000000000'],
      }),
    );
    check('Unknown symptom id is rejected (400)', badSymptom.status === 400);

    const badAnimalId = await api(
      base,
      '/api/reports',
      post(tokenA, {
        title: 'Bad animal',
        description: 'A description long enough to pass validation.',
        animalId: 'abc',
      }),
    );
    check('Malformed animalId is rejected (400)', badAnimalId.status === 400);

    const filtered = await api(base, '/api/reports?status=PENDING', { headers: auth(tokenA) });
    const filteredNone = await api(base, '/api/reports?status=RESOLVED', { headers: auth(tokenA) });
    const badFilter = await api(base, '/api/reports?status=NONSENSE', { headers: auth(tokenA) });
    check('Report list can be filtered by status', filtered.body?.data?.count === 1 && filteredNone.body?.data?.count === 0);
    check('Invalid list filter is rejected (400)', badFilter.status === 400);

    // --- Farmer with no farm yet -----------------------------------------
    const regC = await api(base, '/api/auth/register', { method: 'POST', body: JSON.stringify(FARMER_C) });
    const tokenC = regC.body?.data?.token;
    const noFarmAnimal = await api(base, '/api/animals', post(tokenC, ANIMAL_A));
    const noFarmReport = await api(
      base,
      '/api/reports',
      post(tokenC, { title: 'No farm', description: 'A description long enough to pass validation.' }),
    );
    check('Adding an animal without a farm is rejected (400)', noFarmAnimal.status === 400);
    check('Submitting a report without a farm is rejected (400)', noFarmReport.status === 400);

    // --- Role + authentication guards ------------------------------------
    const guest = await api(base, '/api/animals');
    check('Guest cannot read animals (401)', guest.status === 401);
    const vetBlocked = await api(base, '/api/animals', { headers: auth(vetToken) });
    check('Vet is blocked from farmer animal routes (403)', vetBlocked.status === 403);
    const adminBlocked = await api(base, '/api/reports', { headers: auth(adminToken) });
    check('Admin is blocked from farmer report routes (403)', adminBlocked.status === 403);
    const vetFarm = await api(base, '/api/farmer/farm', { headers: auth(vetToken) });
    check('Vet is blocked from the farm profile route (403)', vetFarm.status === 403);

    // --- Deletion rules --------------------------------------------------
    const deleteOwnAnimal = await api(base, `/api/animals/${animalAId}`, { method: 'DELETE', headers: auth(tokenA) });
    check('Farmer A can delete their own animal', deleteOwnAnimal.status === 200);
    const reportAfterAnimalDelete = await api(base, `/api/reports/${reportAId}`, { headers: auth(tokenA) });
    check(
      'Report survives and its animalId becomes null',
      reportAfterAnimalDelete.status === 200 && reportAfterAnimalDelete.body?.data?.report?.animalId === null,
    );

    const deleteOwnFarm = await api(base, '/api/farmer/farm', { method: 'DELETE', headers: auth(tokenA) });
    const animalsAfterFarmDelete = await api(base, '/api/animals', { headers: auth(tokenA) });
    const reportsAfterFarmDelete = await api(base, '/api/reports', { headers: auth(tokenA) });
    check('Farmer A can delete their farm', deleteOwnFarm.status === 200);
    check('Deleting the farm also removes its animals', animalsAfterFarmDelete.body?.data?.count === 0);
    check('Deleting the farm also removes its reports', reportsAfterFarmDelete.body?.data?.count === 0);
  } catch (err) {
    failed += 1;
    results.push(`FAIL  Unexpected error -> ${err.message}`);
  } finally {
    server.close();
    await cleanup();
    await prisma.$disconnect();
  }

  console.log('\nPhase 2 smoke test results (farmer functionality + ownership)');
  console.log('============================================================');
  results.forEach((line) => console.log(line));
  console.log('============================================================');
  console.log(`${passed} passed, ${failed} failed\n`);

  process.exit(failed === 0 ? 0 : 1);
};

run();
