// ============================================================================
// PHASE 1 SMOKE TEST
// ----------------------------------------------------------------------------
// Run from the backend folder with:  npm run smoke
//
// It starts the API in-process on a random port, sends real HTTP requests to
// every Phase 1 endpoint, checks the results, and then deletes the temporary
// test users it created (so the database is left exactly as it was).
// ============================================================================
const bcrypt = require('bcrypt');

const app = require('../src/app');
const prisma = require('../src/config/prisma');

const TEST_FARMER = {
  name: 'Phase One Tester',
  email: 'phase1.temp.farmer@example.com',
  password: 'FarmerPass123',
};

const TEST_ADMIN = {
  name: 'Phase One Admin',
  email: 'phase1.temp.admin@example.com',
  password: 'AdminPass123',
};

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

const run = async () => {
  // Remove any leftovers from a previous incomplete run.
  await prisma.user.deleteMany({
    where: { email: { in: [TEST_FARMER.email, TEST_ADMIN.email] } },
  });

  const server = app.listen(0);
  const base = `http://127.0.0.1:${server.address().port}`;

  try {
    // 1. Health check + database connectivity.
    const health = await api(base, '/api/health');
    check('GET /api/health returns ok', health.status === 200 && health.body?.data?.status === 'ok');
    check('Database is connected', health.body?.data?.database === 'connected', `got "${health.body?.data?.database}"`);

    // 2. Farmer registration.
    const reg = await api(base, '/api/auth/register', { method: 'POST', body: JSON.stringify(TEST_FARMER) });
    check('Register creates an account', reg.status === 201, `status ${reg.status}`);
    check('Public registration always creates a FARMER', reg.body?.data?.user?.role === 'FARMER');
    check('Register response never includes a password', reg.body?.data?.user?.password === undefined);
    const farmerToken = reg.body?.data?.token;
    check('Register returns a token', typeof farmerToken === 'string' && farmerToken.length > 0);

    // 2b. A role sent in the request body is ignored (cannot self-register as admin).
    const sneaky = await api(base, '/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ ...TEST_FARMER, email: 'phase1.temp.sneaky@example.com', role: 'ADMIN' }),
    });
    check('Attempting to register as ADMIN is ignored (still FARMER)', sneaky.body?.data?.user?.role === 'FARMER');

    // 3. Validation + duplicate handling.
    const dup = await api(base, '/api/auth/register', { method: 'POST', body: JSON.stringify(TEST_FARMER) });
    check('Duplicate email is rejected (409)', dup.status === 409 && dup.body?.success === false);

    const badBody = await api(base, '/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name: 'x', email: 'not-an-email', password: '123' }),
    });
    check('Invalid registration body is rejected (400)', badBody.status === 400);
    // 4. Login.
    const login = await api(base, '/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: TEST_FARMER.email, password: TEST_FARMER.password }),
    });
    check('Login returns a token', login.status === 200 && typeof login.body?.data?.token === 'string');

    const wrongPassword = await api(base, '/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: TEST_FARMER.email, password: 'WrongPassword1' }),
    });
    check('Wrong password is rejected (401)', wrongPassword.status === 401);

    const unknownEmail = await api(base, '/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: 'nobody@example.com', password: 'WrongPassword1' }),
    });
    check('Unknown email is rejected (401)', unknownEmail.status === 401);

    // 5. Current user + token protection.
    const me = await api(base, '/api/auth/me', { headers: { Authorization: `Bearer ${farmerToken}` } });
    check('GET /api/auth/me returns the logged-in user', me.status === 200 && me.body?.data?.user?.email === TEST_FARMER.email);

    const noToken = await api(base, '/api/auth/me');
    check('GET /api/auth/me without a token is 401', noToken.status === 401);

    const badToken = await api(base, '/api/auth/me', { headers: { Authorization: 'Bearer not.a.real.token' } });
    check('Invalid token is rejected (401)', badToken.status === 401);

    // 6. Role authorization with the farmer token.
    const farmerAllowed = await api(base, '/api/dev/farmer-only', { headers: { Authorization: `Bearer ${farmerToken}` } });
    check('Farmer can reach the farmer-only route', farmerAllowed.status === 200);

    const farmerBlocked = await api(base, '/api/dev/admin-only', { headers: { Authorization: `Bearer ${farmerToken}` } });
    check('Farmer is blocked from the admin-only route (403)', farmerBlocked.status === 403);

    // 7. Admin account (created temporarily, then removed at the end).
    const adminHash = await bcrypt.hash(TEST_ADMIN.password, 10);
    await prisma.user.create({
      data: { name: TEST_ADMIN.name, email: TEST_ADMIN.email, password: adminHash, role: 'ADMIN' },
    });

    const adminLogin = await api(base, '/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: TEST_ADMIN.email, password: TEST_ADMIN.password }),
    });
    check('Admin can log in', adminLogin.status === 200 && adminLogin.body?.data?.user?.role === 'ADMIN');
    const adminToken = adminLogin.body?.data?.token;

    const adminAllowed = await api(base, '/api/dev/admin-only', { headers: { Authorization: `Bearer ${adminToken}` } });
    check('Admin can reach the admin-only route', adminAllowed.status === 200);

    const adminBlocked = await api(base, '/api/dev/farmer-only', { headers: { Authorization: `Bearer ${adminToken}` } });
    check('Admin is blocked from the farmer-only route (403)', adminBlocked.status === 403);

    // 8. Unknown route -> centralized 404 handler.
    const notFoundRes = await api(base, '/api/this-does-not-exist');
    check('Unknown route returns a clean 404', notFoundRes.status === 404 && notFoundRes.body?.success === false);

    // 9. Malformed JSON -> centralized 400 handler.
    const malformed = await fetch(`${base}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: '{"email": "broken"',
    });
    check('Malformed JSON returns 400', malformed.status === 400);
  } catch (err) {
    failed += 1;
    results.push(`FAIL  Unexpected error -> ${err.message}`);
  } finally {
    server.close();
    // Clean up every temporary user this script created.
    await prisma.user.deleteMany({
      where: { email: { in: [TEST_FARMER.email, TEST_ADMIN.email, 'phase1.temp.sneaky@example.com'] } },
    });
    await prisma.$disconnect();
  }

  console.log('\nPhase 1 smoke test results');
  console.log('==========================');
  results.forEach((line) => console.log(line));
  console.log('==========================');
  console.log(`${passed} passed, ${failed} failed\n`);

  process.exit(failed === 0 ? 0 : 1);
};

run();
