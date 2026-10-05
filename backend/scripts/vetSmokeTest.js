// ============================================================================
// PHASE 4 SMOKE TEST - Veterinary functionality
// ----------------------------------------------------------------------------
// Run from the backend folder with:  npm run smoke:vet
//
// It starts the API in-process, creates TWO vets (each with a linked professional
// record), an admin and TWO farmers, then proves:
//   - the directory lists ACTIVE professionals only, and filters correctly,
//   - a vet can read/update ONLY their own profile (never role/isActive/userId),
//   - a farmer can refer ONLY their own reports to an ACTIVE professional,
//   - a vet can manage ONLY their own assigned cases,
//   - status transitions are enforced and arbitrary status changes are rejected.
//
// Every temporary record it creates is deleted at the end.
// ============================================================================
const bcrypt = require('bcrypt');

const app = require('../src/app');
const prisma = require('../src/config/prisma');

const FARMER_A = { name: 'Phase4 Farmer A', email: 'phase4.temp.farmer.a@example.com', password: 'FarmerPass123' };
const FARMER_B = { name: 'Phase4 Farmer B', email: 'phase4.temp.farmer.b@example.com', password: 'FarmerPass123' };
const VET_ONE = { name: 'Phase4 Vet One', email: 'phase4.temp.vet.one@example.com', password: 'VetPass123' };
const VET_TWO = { name: 'Phase4 Vet Two', email: 'phase4.temp.vet.two@example.com', password: 'VetPass123' };
const ADMIN = { name: 'Phase4 Admin', email: 'phase4.temp.admin@example.com', password: 'AdminPass123' };

const TEMP_EMAILS = [FARMER_A.email, FARMER_B.email, VET_ONE.email, VET_TWO.email, ADMIN.email];
const SYMPTOM_NAMES = ['PHASE4_TEST_FEVER', 'PHASE4_TEST_COUGH'];

const PROF_ONE_NAME = 'Phase4 Professional One';
const PROF_TWO_NAME = 'Phase4 Professional Two';
const PROF_INACTIVE_NAME = 'Phase4 Professional Inactive';
const PROF_NAMES = [PROF_ONE_NAME, PROF_TWO_NAME, PROF_INACTIVE_NAME];

const FARM_A = { name: 'Phase4 Farm A', province: 'Harare', district: 'Harare', ward: 'Ward 1' };
const FARM_B = { name: 'Phase4 Farm B', province: 'Masvingo', district: 'Masvingo', ward: 'Ward 2' };

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
const get = (token) => ({ headers: auth(token) });
const post = (token, body) => ({ method: 'POST', headers: auth(token), body: JSON.stringify(body) });
const patch = (token, body) => ({ method: 'PATCH', headers: auth(token), body: JSON.stringify(body) });

const cleanup = async () => {
  // Deleting a farmer cascades to their farm, animals, reports and referrals.
  await prisma.user.deleteMany({ where: { email: { in: TEMP_EMAILS } } });
  await prisma.veterinaryProfessional.deleteMany({ where: { name: { in: PROF_NAMES } } });
  await prisma.symptom.deleteMany({ where: { name: { in: SYMPTOM_NAMES } } });
};

const run = async () => {
  await cleanup(); // remove leftovers from a previous incomplete run

  const [symptomFever, symptomCough] = await Promise.all(
    SYMPTOM_NAMES.map((name) => prisma.symptom.create({ data: { name } })),
  );

  // Vets + an admin (public registration only ever creates farmers).
  const vetOneUser = await prisma.user.create({
    data: { ...VET_ONE, password: await bcrypt.hash(VET_ONE.password, 10), role: 'VETERINARY_PROFESSIONAL' },
  });
  const vetTwoUser = await prisma.user.create({
    data: { ...VET_TWO, password: await bcrypt.hash(VET_TWO.password, 10), role: 'VETERINARY_PROFESSIONAL' },
  });
  await prisma.user.create({
    data: { ...ADMIN, password: await bcrypt.hash(ADMIN.password, 10), role: 'ADMIN' },
  });

  // Professional records: two ACTIVE (each linked to a vet user) + one INACTIVE.
  const profOne = await prisma.veterinaryProfessional.create({
    data: {
      name: PROF_ONE_NAME,
      professionalType: 'Veterinarian',
      phone: '+263771000001',
      email: 'phase4.prof.one@example.com',
      province: 'Harare',
      district: 'Harare',
      specialisation: 'Cattle',
      availability: 'Weekdays',
      isActive: true,
      userId: vetOneUser.id,
    },
  });
  const profTwo = await prisma.veterinaryProfessional.create({
    data: {
      name: PROF_TWO_NAME,
      professionalType: 'Animal Health Technician',
      phone: '+263771000002',
      email: 'phase4.prof.two@example.com',
      province: 'Masvingo',
      district: 'Masvingo',
      specialisation: 'Goats',
      availability: 'On call',
      isActive: true,
      userId: vetTwoUser.id,
    },
  });
  const profInactive = await prisma.veterinaryProfessional.create({
    data: {
      name: PROF_INACTIVE_NAME,
      professionalType: 'Veterinarian',
      phone: '+263771000003',
      province: 'Harare',
      district: 'Harare',
      specialisation: 'Poultry',
      isActive: false,
    },
  });

  const server = app.listen(0);
  const base = `http://127.0.0.1:${server.address().port}`;

  try {
    // --- Accounts --------------------------------------------------------
    const regA = await api(base, '/api/auth/register', { method: 'POST', body: JSON.stringify(FARMER_A) });
    const regB = await api(base, '/api/auth/register', { method: 'POST', body: JSON.stringify(FARMER_B) });
    const tokenA = regA.body?.data?.token;
    const tokenB = regB.body?.data?.token;
    const farmerAId = regA.body?.data?.user?.id;

    const vetOneLogin = await api(base, '/api/auth/login', { method: 'POST', body: JSON.stringify({ email: VET_ONE.email, password: VET_ONE.password }) });
    const vetTwoLogin = await api(base, '/api/auth/login', { method: 'POST', body: JSON.stringify({ email: VET_TWO.email, password: VET_TWO.password }) });
    const adminLogin = await api(base, '/api/auth/login', { method: 'POST', body: JSON.stringify({ email: ADMIN.email, password: ADMIN.password }) });
    const vetOneToken = vetOneLogin.body?.data?.token;
    const vetTwoToken = vetTwoLogin.body?.data?.token;
    const adminToken = adminLogin.body?.data?.token;
    check('Accounts are ready', !!tokenA && !!tokenB && !!vetOneToken && !!vetTwoToken && !!adminToken);

    // --- Farmer data: farms + reports ------------------------------------
    await api(base, '/api/farmer/farm', post(tokenA, FARM_A));
    await api(base, '/api/farmer/farm', post(tokenB, FARM_B));

    const reportARes = await api(base, '/api/reports', post(tokenA, {
      title: 'Cow with fever',
      description: 'My cow has had a high temperature and is eating very little for two days.',
      symptomIds: [symptomFever.id, symptomCough.id],
    }));
    const reportBRes = await api(base, '/api/reports', post(tokenB, {
      title: 'Goat limping',
      description: 'One of my goats has a mild limp on the front leg but is eating normally.',
    }));
    const reportAId = reportARes.body?.data?.report?.id;
    const reportBId = reportBRes.body?.data?.report?.id;
    check('Farmers created reports', !!reportAId && !!reportBId);

    // --- AUTHORIZATION ---------------------------------------------------
    const guestCases = await api(base, '/api/vet/cases');
    check('Guest cannot access vet cases (401)', guestCases.status === 401);

    const farmerCases = await api(base, '/api/vet/cases', get(tokenA));
    check('Farmer cannot access vet case management (403)', farmerCases.status === 403);

    const adminCases = await api(base, '/api/vet/cases', get(adminToken));
    check('Admin cannot access vet case management (403)', adminCases.status === 403);

    const guestProfile = await api(base, '/api/vet/profile');
    check('Guest cannot access the vet profile (401)', guestProfile.status === 401);

    const farmerProfile = await api(base, '/api/vet/profile', get(tokenA));
    check('Farmer cannot access the vet profile (403)', farmerProfile.status === 403);

    const farmerProfileWrite = await api(base, '/api/vet/profile', patch(tokenA, { availability: 'x' }));
    check('Farmer cannot update a vet profile (403)', farmerProfileWrite.status === 403);


    // --- DIRECTORY -------------------------------------------------------
    const guestDir = await api(base, '/api/vets');
    check('Guest cannot list the directory (401)', guestDir.status === 401);

    const adminDir = await api(base, '/api/vets', get(adminToken));
    check('Admin is not granted the vet directory (403)', adminDir.status === 403);

    const farmerDir = await api(base, '/api/vets', get(tokenA));
    const dir = farmerDir.body?.data?.professionals || [];
    const dirIds = dir.map((p) => p.id);
    check('Farmer can list active professionals', farmerDir.status === 200 && dirIds.includes(profOne.id) && dirIds.includes(profTwo.id));
    check('Inactive professionals are excluded from the directory', !dirIds.includes(profInactive.id));
    check('Directory never exposes a password field', dir.every((p) => p.password === undefined));
    check('Directory does not expose the internal userId link', dir.every((p) => p.userId === undefined));

    const provFilter = await api(base, '/api/vets?province=Harare', get(tokenA));
    const provIds = (provFilter.body?.data?.professionals || []).map((p) => p.id);
    check('Province filter keeps only matching professionals', provIds.includes(profOne.id) && !provIds.includes(profTwo.id));

    const distFilter = await api(base, '/api/vets?district=Masvingo', get(tokenA));
    const distIds = (distFilter.body?.data?.professionals || []).map((p) => p.id);
    check('District filter keeps only matching professionals', distIds.includes(profTwo.id) && !distIds.includes(profOne.id));

    const typeFilter = await api(base, '/api/vets?professionalType=Animal%20Health%20Technician', get(tokenA));
    const typeIds = (typeFilter.body?.data?.professionals || []).map((p) => p.id);
    check('Professional type filter works', typeIds.includes(profTwo.id) && !typeIds.includes(profOne.id));

    const specFilter = await api(base, '/api/vets?specialisation=Goats', get(tokenA));
    const specIds = (specFilter.body?.data?.professionals || []).map((p) => p.id);
    check('Specialisation filter works', specIds.includes(profTwo.id) && !specIds.includes(profOne.id));

    const badProvFilter = await api(base, '/api/vets?province=Atlantis', get(tokenA));
    check('Invalid province filter is rejected (400)', badProvFilter.status === 400);

    const badDistrictFilter = await api(base, '/api/vets?district=x', get(tokenA));
    check('Too-short district filter is rejected (400)', badDistrictFilter.status === 400);


    // --- PROFILE ---------------------------------------------------------
    const ownProfile = await api(base, '/api/vet/profile', get(vetOneToken));
    check('Vet can read their own profile', ownProfile.status === 200 && ownProfile.body?.data?.profile?.name === PROF_ONE_NAME);
    check('Own profile never exposes a password field', ownProfile.body?.data?.profile?.password === undefined);

    const updateAvail = await api(base, '/api/vet/profile', patch(vetOneToken, { availability: 'Weekends 9-1' }));
    check('Vet can update their availability', updateAvail.status === 200 && updateAvail.body?.data?.profile?.availability === 'Weekends 9-1');

    const updateSpec = await api(base, '/api/vet/profile', patch(vetOneToken, { specialisation: 'Cattle and goats' }));
    check('Vet can update their specialisation', updateSpec.status === 200 && updateSpec.body?.data?.profile?.specialisation === 'Cattle and goats');

    const tryRole = await api(base, '/api/vet/profile', patch(vetOneToken, { role: 'ADMIN' }));
    check('Vet cannot change their role through profile update (400)', tryRole.status === 400);

    const tryIsActive = await api(base, '/api/vet/profile', patch(vetOneToken, { isActive: false }));
    check('Vet cannot change the administrative isActive field (400)', tryIsActive.status === 400);

    const tryUserId = await api(base, '/api/vet/profile', patch(vetOneToken, { userId: 'ckhacker000000000000000' }));
    check('Vet cannot set an arbitrary userId (400)', tryUserId.status === 400);

    const meAfter = await api(base, '/api/auth/me', get(vetOneToken));
    check('Vet role is unchanged after the profile attempts', meAfter.body?.data?.user?.role === 'VETERINARY_PROFESSIONAL');

    // Profile updates are self-scoped: Vet Two editing their own profile must not
    // touch Vet One's record.
    await api(base, '/api/vet/profile', patch(vetTwoToken, { availability: 'Nights' }));
    const vetOneProfileAfter = await api(base, '/api/vet/profile', get(vetOneToken));
    check('A vet cannot modify another vet\'s profile', vetOneProfileAfter.body?.data?.profile?.availability === 'Weekends 9-1');


    // --- REFERRALS: creation ---------------------------------------------
    const createRef = await api(base, '/api/referrals', post(tokenA, {
      reportId: reportAId,
      professionalId: profOne.id,
      farmerMessage: 'Please advise, my cow is unwell.',
    }));
    const referralId = createRef.body?.data?.referral?.id;
    check('Farmer can create a referral for their own report', createRef.status === 201 && !!referralId);
    check('New referral starts PENDING', createRef.body?.data?.referral?.status === 'PENDING');
    check('Referral farmerId is derived from the token, not the client', createRef.body?.data?.referral?.farmerId === farmerAId);

    const crossRef = await api(base, '/api/referrals', post(tokenA, { reportId: reportBId, professionalId: profOne.id }));
    check('Farmer cannot refer to another farmer\'s report (404)', crossRef.status === 404);

    const badProfId = await api(base, '/api/referrals', post(tokenA, { reportId: reportAId, professionalId: 'abc' }));
    check('Malformed professionalId is rejected (400)', badProfId.status === 400);

    const missingProf = await api(base, '/api/referrals', post(tokenA, { reportId: reportAId, professionalId: 'ckdoesnotexist000000000000' }));
    check('Unknown professionalId is not found (404)', missingProf.status === 404);

    const inactiveProf = await api(base, '/api/referrals', post(tokenA, { reportId: reportAId, professionalId: profInactive.id }));
    check('Farmer cannot refer to an inactive professional (400)', inactiveProf.status === 400);

    const sneakyField = await api(base, '/api/referrals', post(tokenA, { reportId: reportAId, professionalId: profOne.id, farmerId: farmerAId }));
    check('Unexpected ownership fields in a referral are rejected (400)', sneakyField.status === 400);

    const guestRefCreate = await api(base, '/api/referrals', { method: 'POST', body: JSON.stringify({ reportId: reportAId, professionalId: profOne.id }) });
    check('Guest cannot create a referral (401)', guestRefCreate.status === 401);

    // --- REFERRALS: farmer visibility ------------------------------------
    const listRefA = await api(base, '/api/referrals', get(tokenA));
    check('Farmer A sees their own referral', listRefA.body?.data?.count === 1 && listRefA.body?.data?.referrals?.[0]?.id === referralId);

    const listRefB = await api(base, '/api/referrals', get(tokenB));
    check('Farmer B sees no referrals (isolation)', listRefB.body?.data?.count === 0);

    const crossRefRead = await api(base, `/api/referrals/${referralId}`, get(tokenB));
    check('Farmer B cannot read Farmer A\'s referral (404)', crossRefRead.status === 404);

    const ownRefRead = await api(base, `/api/referrals/${referralId}`, get(tokenA));
    check('Farmer A can read their own referral', ownRefRead.status === 200 && ownRefRead.body?.data?.referral?.report?.id === reportAId);

    // --- REFERRALS: vet case access --------------------------------------
    const vetOneCases = await api(base, '/api/vet/cases', get(vetOneToken));
    const vetOneCaseIds = (vetOneCases.body?.data?.cases || []).map((c) => c.id);
    check('Vet One sees the referral assigned to them', vetOneCases.status === 200 && vetOneCaseIds.includes(referralId));

    const vetTwoCases = await api(base, '/api/vet/cases', get(vetTwoToken));
    const vetTwoCaseIds = (vetTwoCases.body?.data?.cases || []).map((c) => c.id);
    check('Vet Two does NOT see Vet One\'s referral', !vetTwoCaseIds.includes(referralId));

    const vetTwoReadCase = await api(base, `/api/vet/cases/${referralId}`, get(vetTwoToken));
    check('Vet Two cannot read Vet One\'s case (404)', vetTwoReadCase.status === 404);

    const vetOneCase = await api(base, `/api/vet/cases/${referralId}`, get(vetOneToken));
    const caseData = vetOneCase.body?.data?.case;
    check('Vet case exposes the report, farmer and farm', vetOneCase.status === 200 && caseData?.report?.id === reportAId && caseData?.farmer?.id === farmerAId && caseData?.report?.farm?.name === FARM_A.name);
    check('Vet case never exposes a farmer password', caseData?.farmer?.password === undefined);

    const guestCaseRead = await api(base, `/api/vet/cases/${referralId}`);
    check('Guest cannot read a vet case (401)', guestCaseRead.status === 401);


    // --- STATUS TRANSITIONS ----------------------------------------------
    // Still PENDING: skipping straight to IN_PROGRESS must be refused.
    const skip = await api(base, `/api/vet/cases/${referralId}/status`, patch(vetOneToken, { status: 'IN_PROGRESS' }));
    check('A PENDING referral cannot skip to IN_PROGRESS (409)', skip.status === 409);

    const badStatusValue = await api(base, `/api/vet/cases/${referralId}/status`, patch(vetOneToken, { status: 'NONSENSE' }));
    check('An unknown status value is rejected (400)', badStatusValue.status === 400);

    const statusExtraField = await api(base, `/api/vet/cases/${referralId}/status`, patch(vetOneToken, { status: 'ACCEPTED', professionalResponse: 'x' }));
    check('Unexpected fields in a status update are rejected (400)', statusExtraField.status === 400);

    const unassignedStatus = await api(base, `/api/vet/cases/${referralId}/status`, patch(vetTwoToken, { status: 'ACCEPTED' }));
    check('An unassigned vet cannot change the status (404)', unassignedStatus.status === 404);

    const farmerStatus = await api(base, `/api/vet/cases/${referralId}/status`, patch(tokenA, { status: 'ACCEPTED' }));
    check('A farmer cannot change a referral status (403)', farmerStatus.status === 403);

    const guestStatus = await api(base, `/api/vet/cases/${referralId}/status`, { method: 'PATCH', body: JSON.stringify({ status: 'ACCEPTED' }) });
    check('A guest cannot change a referral status (401)', guestStatus.status === 401);

    const accept = await api(base, `/api/vet/cases/${referralId}/status`, patch(vetOneToken, { status: 'ACCEPTED' }));
    check('PENDING -> ACCEPTED works', accept.status === 200 && accept.body?.data?.case?.status === 'ACCEPTED');

    const acceptedToCompleted = await api(base, `/api/vet/cases/${referralId}/status`, patch(vetOneToken, { status: 'COMPLETED' }));
    check('ACCEPTED -> COMPLETED is rejected (409)', acceptedToCompleted.status === 409);

    const inProgress = await api(base, `/api/vet/cases/${referralId}/status`, patch(vetOneToken, { status: 'IN_PROGRESS' }));
    check('ACCEPTED -> IN_PROGRESS works', inProgress.status === 200 && inProgress.body?.data?.case?.status === 'IN_PROGRESS');

    const completed = await api(base, `/api/vet/cases/${referralId}/status`, patch(vetOneToken, { status: 'COMPLETED' }));
    check('IN_PROGRESS -> COMPLETED works', completed.status === 200 && completed.body?.data?.case?.status === 'COMPLETED');

    const completedTerminal = await api(base, `/api/vet/cases/${referralId}/status`, patch(vetOneToken, { status: 'ACCEPTED' }));
    check('A COMPLETED referral is terminal (409)', completedTerminal.status === 409);

    // A second referral to prove the DECLINED path is terminal too.
    const refTwo = await api(base, '/api/referrals', post(tokenA, { reportId: reportAId, professionalId: profOne.id }));
    const referralTwoId = refTwo.body?.data?.referral?.id;
    const decline = await api(base, `/api/vet/cases/${referralTwoId}/status`, patch(vetOneToken, { status: 'DECLINED' }));
    check('PENDING -> DECLINED works', decline.status === 200 && decline.body?.data?.case?.status === 'DECLINED');

    const declinedTerminal = await api(base, `/api/vet/cases/${referralTwoId}/status`, patch(vetOneToken, { status: 'ACCEPTED' }));
    check('A DECLINED referral is terminal (409)', declinedTerminal.status === 409);


    // --- PROFESSIONAL RESPONSE -------------------------------------------
    const responseRes = await api(base, `/api/vet/cases/${referralId}/response`, patch(vetOneToken, {
      professionalResponse: 'Please isolate the cow and provide clean water. Contact me if it worsens.',
    }));
    check('Assigned vet can provide a professional response', responseRes.status === 200 && typeof responseRes.body?.data?.case?.professionalResponse === 'string');

    const reread = await api(base, `/api/vet/cases/${referralId}`, get(vetOneToken));
    check('Professional response is persisted', reread.body?.data?.case?.professionalResponse?.startsWith('Please isolate'));

    const unassignedResponse = await api(base, `/api/vet/cases/${referralId}/response`, patch(vetTwoToken, { professionalResponse: 'I should not be able to write this response.' }));
    check('An unassigned vet cannot provide a response (404)', unassignedResponse.status === 404);

    const farmerResponse = await api(base, `/api/vet/cases/${referralId}/response`, patch(tokenA, { professionalResponse: 'A farmer must not write a vet response.' }));
    check('A farmer cannot provide a professional response (403)', farmerResponse.status === 403);

    const emptyResponse = await api(base, `/api/vet/cases/${referralId}/response`, patch(vetOneToken, { professionalResponse: '' }));
    check('An empty response is rejected (400)', emptyResponse.status === 400);

    const longResponse = await api(base, `/api/vet/cases/${referralId}/response`, patch(vetOneToken, { professionalResponse: 'x'.repeat(2001) }));
    check('An over-long response is rejected (400)', longResponse.status === 400);

    const responseExtraField = await api(base, `/api/vet/cases/${referralId}/response`, patch(vetOneToken, { professionalResponse: 'A valid long enough response.', status: 'COMPLETED' }));
    check('Unexpected fields in a response are rejected (400)', responseExtraField.status === 400);
  } catch (err) {
    failed += 1;
    results.push(`FAIL  Unexpected error -> ${err.message}`);
  } finally {
    server.close();
    await cleanup();
    await prisma.$disconnect();
  }

  console.log('\nPhase 4 smoke test results (veterinary functionality)');
  console.log('============================================================');
  results.forEach((line) => console.log(line));
  console.log('============================================================');
  console.log(`${passed} passed, ${failed} failed\n`);

  process.exit(failed === 0 ? 0 : 1);
};

run();

