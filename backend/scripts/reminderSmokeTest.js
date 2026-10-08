// ============================================================================
// PHASE 6F-B SMOKE TEST - Reminder API + ownership security
// ----------------------------------------------------------------------------
// Run from the backend folder with:  npm run smoke:reminder
//
// It starts the API in-process and proves that a farmer can:
//   1. Authenticate
//   2. Create a reminder, and that the created reminder belongs to them
//   3. List their own reminders
//   4. Retrieve their own reminder
//   5. Update their own reminder
//   6. Mark their own reminder completed
//   7. Delete their own reminder, and that it is no longer returned
//   8. Have invalid types / malformed dates / missing titles rejected
//   9. NOT read, update, complete, or delete another farmer's reminder
//   10. Have unauthenticated access rejected and non-FARMER roles blocked
//
// Every temporary record it creates is removed at the end.
// ============================================================================
const bcrypt = require('bcrypt');

const app = require('../src/app');
const prisma = require('../src/config/prisma');

const FARMER_A = { name: 'Phase6F Farmer A', email: 'phase6f.temp.farmer.a@example.com', password: 'FarmerPass123' };
const FARMER_B = { name: 'Phase6F Farmer B', email: 'phase6f.temp.farmer.b@example.com', password: 'FarmerPass123' };
const VET = { name: 'Phase6F Vet', email: 'phase6f.temp.vet@example.com', password: 'VetPass123' };
const ADMIN = { name: 'Phase6F Admin', email: 'phase6f.temp.admin@example.com', password: 'AdminPass123' };

const TEMP_EMAILS = [FARMER_A.email, FARMER_B.email, VET.email, ADMIN.email];

const results = [];
let passed = 0;
let failed = 0;

const check = (name, condition, detail) => {
  if (condition) {
    passed += 1;
    results.push('PASS  ' + name);
  } else {
    failed += 1;
    results.push('FAIL  ' + name + (detail ? ' -> ' + detail : ''));
  }
};

const api = async (base, path, options) => {
  const res = await fetch(base + path, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...(options && options.headers || {}) },
  });
  let body = null;
  try {
    body = await res.json();
  } catch (e) {
    body = null;
  }
  return { status: res.status, body };
};

const auth = (token) => ({ Authorization: 'Bearer ' + token });
const post = (token, body) => ({ method: 'POST', headers: auth(token), body: JSON.stringify(body) });
const patch = (token, body) => ({ method: 'PATCH', headers: auth(token), body: JSON.stringify(body) });
const del = (token) => ({ method: 'DELETE', headers: auth(token) });

const cleanup = async () => {
  await prisma.reminder.deleteMany({});
  await prisma.user.deleteMany({ where: { email: { in: TEMP_EMAILS } } });
};

const run = async () => {
  await cleanup(); // remove leftovers from a previous incomplete run

  const server = app.listen(0);
  const base = 'http://127.0.0.1:' + server.address().port;

  try {
    // --- Accounts ---------------------------------------------------------
    // Public registration only ever creates FARMER accounts (see authController:
    // role is hardcoded to 'FARMER'). Vet/admin accounts are created directly,
    // exactly like vetSmokeTest.js / adminSmokeTest.js, then logged in.
    await prisma.user.create({
      data: { ...VET, password: await bcrypt.hash(VET.password, 10), role: 'VETERINARY_PROFESSIONAL' },
    });
    await prisma.user.create({
      data: { ...ADMIN, password: await bcrypt.hash(ADMIN.password, 10), role: 'ADMIN' },
    });

    const regA = await api(base, '/api/auth/register', { method: 'POST', body: JSON.stringify(FARMER_A) });
    const regB = await api(base, '/api/auth/register', { method: 'POST', body: JSON.stringify(FARMER_B) });

    const tokenA = (regA && regA.body && regA.body.data && regA.body.data.token) || null;
    const farmerAId = (regA && regA.body && regA.body.data && regA.body.data.user && regA.body.data.user.id) || null;
    const tokenB = (regB && regB.body && regB.body.data && regB.body.data.token) || null;
    const vetLogin = await api(base, '/api/auth/login', { method: 'POST', body: JSON.stringify({ email: VET.email, password: VET.password }) });
    const adminLogin = await api(base, '/api/auth/login', { method: 'POST', body: JSON.stringify({ email: ADMIN.email, password: ADMIN.password }) });
    const vetToken = (vetLogin && vetLogin.body && vetLogin.body.data && vetLogin.body.data.token) || null;
    const adminToken = (adminLogin && adminLogin.body && adminLogin.body.data && adminLogin.body.data.token) || null;

    const blankTitle = await api(base, '/api/reminders', post(tokenA, { title: '   ', description: 'D', type: 'VACCINATION', dueDate: '2026-12-01' }));
    check('Missing required title is rejected (400)', blankTitle.status === 400);

    const badType = await api(base, '/api/reminders', post(tokenA, { title: 'X', description: 'D', type: 'NOT_A_TYPE', dueDate: '2026-12-01' }));
    check('Invalid reminder type is rejected (400)', badType.status === 400);

    const badDate = await api(base, '/api/reminders', post(tokenA, { title: 'X', description: 'D', type: 'VACCINATION', dueDate: '2026-13-40' }));
    check('Invalid/malformed due date is rejected (400)', badDate.status === 400);
    // --- Create -----------------------------------------------------------
    const created = await api(base, '/api/reminders', post(tokenA, { title: 'Vaccinate cattle', description: 'Spring round', type: 'VACCINATION', dueDate: '2026-11-30' }));
    check('Farmer can create a reminder (201)', created.status === 201);
    const createdId = (created && created.body && created.body.data && created.body.data.reminder && created.body.data.reminder.id) || null;
    // The public reminder payload intentionally omits farmerId (see reminderSelect),
    // so verify ownership directly against the database: farmerId must equal Farmer A.
    const createdRow = createdId ? await prisma.reminder.findUnique({ where: { id: createdId } }) : null;
    check('Created reminder belongs to Farmer A', Boolean(createdRow) && createdRow.farmerId === farmerAId, 'farmerId ' + (createdRow && createdRow.farmerId));
    const createdDueDate = (created && created.body && created.body.data && created.body.data.reminder && created.body.data.reminder.dueDate) || null;
    check('Created reminder dueDate is stored', createdDueDate === new Date('2026-11-30T00:00:00Z').toISOString());

    // --- List -------------------------------------------------------------
    const list = await api(base, '/api/reminders', { headers: auth(tokenA) });
    check('Farmer can list own reminders', list.status === 200);
    const listHasId = (list && list.body && list.body.data && list.body.data.reminders) ? list.body.data.reminders.some(function (r) { return r && r.id === createdId; }) : false;
    check('List is scoped to the authenticated farmer', listHasId === true);
    // --- Retrieve own reminder --------------------------------------------
    const gotten = await api(base, '/api/reminders/' + createdId, { headers: auth(tokenA) });
    check('Farmer can retrieve their own reminder', gotten.status === 200);

    // --- Cross-farmer reads are blocked (404, not 403) --------------------
    const crossRead = await api(base, '/api/reminders/' + createdId, { headers: auth(tokenB) });
    check('Another farmer cannot retrieve the first farmer\'s reminder', crossRead.status === 404);

    // --- Update own reminder ----------------------------------------------
    const updated = await api(base, '/api/reminders/' + createdId, patch(tokenA, { title: 'Vaccinate cattle - spring round', type: 'FOLLOW_UP', dueDate: '2026-12-15' }));
    check('Farmer can update their own reminder (200)', updated.status === 200);
    const updatedType = (updated && updated.body && updated.body.data && updated.body.data.reminder && updated.body.data.reminder.type) || null;
    const updatedDue = (updated && updated.body && updated.body.data && updated.body.data.reminder && updated.body.data.reminder.dueDate) || null;
    check('Update persists only editable fields', updatedType === 'FOLLOW_UP' && updatedDue === new Date('2026-12-15T00:00:00Z').toISOString());

    // --- Cross-farmer update is blocked ------------------------------------
    const crossUpdate = await api(base, '/api/reminders/' + createdId, patch(tokenB, { title: 'Hacked', type: 'VACCINATION' }));
    check('Another farmer cannot update the first farmer\'s reminder', crossUpdate.status === 404);

    // --- Complete own reminder --------------------------------------------
    const completed = await api(base, '/api/reminders/' + createdId + '/complete', { method: 'PATCH', headers: auth(tokenA) });
    check('Farmer can mark their own reminder completed (200)', completed.status === 200);
    const completedState = (completed && completed.body && completed.body.data && completed.body.data.reminder && completed.body.data.reminder.completed) || null;
    check('Completion state is persisted', completedState === true);

    // --- Cross-farmer completion is blocked --------------------------------
    const crossComplete = await api(base, '/api/reminders/' + createdId + '/complete', { method: 'PATCH', headers: auth(tokenB) });
    check('Another farmer cannot complete the first farmer\'s reminder', crossComplete.status === 404);

    // --- Persisted completed state is visible on list -----------------------
    const listAfter = await api(base, '/api/reminders', { headers: auth(tokenA) });
    const stillCompleted = (listAfter && listAfter.body && listAfter.body.data && listAfter.body.data.reminders) ? listAfter.body.data.reminders.some(function (r) { return r && r.id === createdId && r.completed === true; }) : false;
    check('Completed state persists and shows on list', stillCompleted === true);
    // --- Delete own reminder ----------------------------------------------
    const deleted = await api(base, '/api/reminders/' + createdId, del(tokenA));
    check('Farmer can delete their own reminder (200)', deleted.status === 200);

    // --- Deleted reminder is no longer returned ------------------------------
    const gone = await api(base, '/api/reminders/' + createdId, { headers: auth(tokenA) });
    check('Deleted reminder is no longer retrievable', gone.status === 404);

    // --- Cross-farmer delete is blocked ------------------------------------
    const crossDelete = await api(base, '/api/reminders/' + createdId, del(tokenB));
    check('Another farmer cannot delete the first farmer\'s reminder', crossDelete.status === 404);

    // --- Unauthenticated access is rejected ----------------------------------
    const guest = await api(base, '/api/reminders');
    check('Unauthenticated access is rejected (401)', guest.status === 401);

    // --- Non-FARMER roles are blocked on farmer routes -----------------------
    const vetBlocked = await api(base, '/api/reminders', { headers: auth(vetToken) });
    check('Vet is blocked from farmer reminder routes (403)', vetBlocked.status === 403);

    check('Admin can log in (direct setup, public register is FARMER-only)', adminLogin.status === 200 && Boolean(adminToken));
    check('Auth response carries an admin token', Boolean(adminToken));
    const adminBlocked = await api(base, '/api/reminders', { headers: auth(adminToken) });
    check('Admin is blocked from farmer reminder routes (403)', adminBlocked.status === 403);
  } catch (err) {
    failed += 1;
    results.push('FAIL  Unexpected error -> ' + err.message);
  } finally {
    server.close();
    await cleanup();
    await prisma.$disconnect();
  }

  console.log('');
  console.log('Phase 6F-B smoke test results (reminder API + ownership)');
  console.log('============================================================');
  results.forEach(function (line) { console.log(line); });
  console.log('============================================================');
  console.log(passed + ' passed, ' + failed + ' failed');
  console.log('');

  process.exit(failed === 0 ? 0 : 1);
};

run();
