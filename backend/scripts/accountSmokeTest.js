const bcrypt = require('bcrypt');

const app = require('../src/app');
const prisma = require('../src/config/prisma');

const FIRST = {
  name: 'Account Test Farmer One',
  email: 'account.test.one@example.com',
  password: 'AccountPass123',
};
const SECOND = {
  name: 'Account Test Farmer Two',
  email: 'account.test.two@example.com',
  password: 'AccountPass123',
};

const results = [];
let passed = 0;
let failed = 0;
let skipped = 0;

const check = (name, condition, detail = '') => {
  if (condition) {
    passed += 1;
    results.push(`PASS  ${name}`);
  } else {
    failed += 1;
    results.push(`FAIL  ${name}${detail ? ` -> ${detail}` : ''}`);
  }
};

const isIsolatedLocalDb = () => {
  const raw = process.env.DATABASE_URL || '';
  try {
    const url = new URL(raw);
    if (!['postgres:', 'postgresql:'].includes(url.protocol)) return false;
    if (url.hostname !== '127.0.0.1') return false;
    if (url.port !== '5432') return false;
    if (url.pathname !== '/vetalert_phase4') return false;
    const lower = raw.toLowerCase();
    if (lower.includes('neon.tech') || lower.includes('neon-')) return false;
    return true;
  } catch {
    return false;
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
// Fail only on real exposure: a password/hash field, a bcrypt hash value,
// or an actual fixture secret echoed back. A message merely containing the
// English word "password" (e.g. "Password updated.") is not a leak.
const leak = (value) => {
  const serialized = JSON.stringify(value || {});
  if (/"password"\s*:/i.test(serialized)) return true;
  if (/passwordhash/i.test(serialized)) return true;
  if (/\$2[aby]\$\d{2}\$/.test(serialized)) return true;
  const secrets = [FIRST.password, SECOND.password, 'BrandNewPass123', 'AnotherPass123'];
  return secrets.some((secret) => secret && serialized.includes(secret));
};
const cleanup = () =>
  prisma.user.deleteMany({ where: { email: { in: [FIRST.email, SECOND.email] } } });

const run = async () => {
  if (!isIsolatedLocalDb()) {
    skipped += 1;
    results.push(
      'SKIP  Refusing database-backed account tests: DATABASE_URL is not strictly 127.0.0.1:5432/vetalert_phase4 (fail closed). Pass the isolated URL explicitly in the process environment; never rely on backend/.env.',
    );
    console.log('\nAccount smoke test results');
    console.log('==========================');
    results.forEach((line) => console.log(line));
    console.log('==========================');
    console.log(`${passed} passed, ${failed} failed, ${skipped} skipped\n`);
    process.exit(0);
  }

  await cleanup();
  const server = app.listen(0);
  const base = `http://127.0.0.1:${server.address().port}`;

  try {
    const firstHash = await bcrypt.hash(FIRST.password, 10);
    const secondHash = await bcrypt.hash(SECOND.password, 10);
    await prisma.user.create({
      data: { name: FIRST.name, email: FIRST.email, password: firstHash, role: 'FARMER' },
    });
    await prisma.user.create({
      data: { name: SECOND.name, email: SECOND.email, password: secondHash, role: 'FARMER' },
    });

    const login = (payload) =>
      api(base, '/api/auth/login', { method: 'POST', body: JSON.stringify(payload) });
    const firstLogin = await login({ email: FIRST.email, password: FIRST.password });
    check('Farmer fixture can log in', firstLogin.status === 200, `status ${firstLogin.status}`);
    const token = firstLogin.body && firstLogin.body.data && firstLogin.body.data.token;
    check('Login returns a token', typeof token === 'string' && token.length > 0);
    const secondLogin = await login({ email: SECOND.email, password: SECOND.password });
    const secondToken = secondLogin.body && secondLogin.body.data && secondLogin.body.data.token;

    const guestMe = await api(base, '/api/account/me');
    check('Unauthenticated profile read is rejected (401)', guestMe.status === 401);
    const guestProfile = await api(base, '/api/account/profile', {
      method: 'PATCH',
      body: JSON.stringify({ name: 'Nope' }),
    });
    check('Unauthenticated profile update is rejected (401)', guestProfile.status === 401);
    const guestEmail = await api(base, '/api/account/email', {
      method: 'PATCH',
      body: JSON.stringify({ email: 'x@example.com', currentPassword: FIRST.password }),
    });
    check('Unauthenticated email change is rejected (401)', guestEmail.status === 401);
    const guestPassword = await api(base, '/api/account/password', {
      method: 'PATCH',
      body: JSON.stringify({
        currentPassword: FIRST.password,
        newPassword: 'AnotherPass123',
        confirmPassword: 'AnotherPass123',
      }),
    });
    check('Unauthenticated password change is rejected (401)', guestPassword.status === 401);

    const me = await api(base, '/api/account/me', { headers: auth(token) });
    check(
      'Authenticated user can read own profile',
      me.status === 200 && me.body && me.body.data && me.body.data.user.email === FIRST.email,
      `status ${me.status}`,
    );
    check('Profile response leaks no password/hash', me.status !== 200 || !leak(me.body));

    const update = await api(base, '/api/account/profile', {
      method: 'PATCH',
      headers: auth(token),
      body: JSON.stringify({ name: 'Updated Farmer One', phone: '+263771234567' }),
    });
    check(
      'Valid name/phone update persists',
      update.status === 200 &&
        update.body.data.user.name === 'Updated Farmer One' &&
        update.body.data.user.phone === '+263771234567',
      `status ${update.status}`,
    );

    const clearPhone = await api(base, '/api/account/profile', {
      method: 'PATCH',
      headers: auth(token),
      body: JSON.stringify({ name: 'Updated Farmer One', phone: '' }),
    });
    check(
      'Empty phone clears to null',
      clearPhone.status === 200 && clearPhone.body.data.user.phone === null,
      `status ${clearPhone.status}`,
    );
    const unsupported = await api(base, '/api/account/profile', {
      method: 'PATCH',
      headers: auth(token),
      body: JSON.stringify({ name: 'Updated Farmer One', role: 'ADMIN' }),
    });
    check('Unsupported role field is rejected (400)', unsupported.status === 400);
    const foreignId = await api(base, '/api/account/profile', {
      method: 'PATCH',
      headers: auth(token),
      body: JSON.stringify({ name: 'Hacker', userId: 'someone-else' }),
    });
    check('Client-supplied user id field is rejected (400)', foreignId.status === 400);
    const otherAfter = await prisma.user.findUnique({ where: { email: SECOND.email } });
    check('Other user is untouched by profile update', otherAfter && otherAfter.name === SECOND.name);

    const badEmail = await api(base, '/api/account/email', {
      method: 'PATCH',
      headers: auth(token),
      body: JSON.stringify({ email: 'not-an-email', currentPassword: FIRST.password }),
    });
    check('Invalid email input is rejected (400)', badEmail.status === 400);
    const wrongEmailPassword = await api(base, '/api/account/email', {
      method: 'PATCH',
      headers: auth(token),
      body: JSON.stringify({ email: 'account.test.new@example.com', currentPassword: 'Wrong1' }),
    });
    check('Email change with wrong password is rejected (401)', wrongEmailPassword.status === 401);
    const duplicateEmail = await api(base, '/api/account/email', {
      method: 'PATCH',
      headers: auth(token),
      body: JSON.stringify({ email: SECOND.email.toUpperCase(), currentPassword: FIRST.password }),
    });
    check('Duplicate email is rejected (409)', duplicateEmail.status === 409);
    const unchanged = await prisma.user.findUnique({ where: { email: FIRST.email } });
    const otherUnchanged = await prisma.user.findUnique({ where: { email: SECOND.email } });
    check(
      'Duplicate email leaves both accounts unchanged',
      unchanged && unchanged.name === 'Updated Farmer One' && otherUnchanged && otherUnchanged.name === SECOND.name,
    );
    const emailChange = await api(base, '/api/account/email', {
      method: 'PATCH',
      headers: auth(token),
      body: JSON.stringify({
        email: '  Account.Test.New@Example.com ',
        currentPassword: FIRST.password,
      }),
    });
    check(
      'Valid email change normalizes and persists',
      emailChange.status === 200 && emailChange.body.data.user.email === 'account.test.new@example.com',
      `status ${emailChange.status}`,
    );
    check('Email response leaks no password/hash', !leak(emailChange.body));
    FIRST.email = 'account.test.new@example.com';
    const relogin = await login({ email: FIRST.email, password: FIRST.password });
    check('User can log in with the new email', relogin.status === 200);
    const freshToken = relogin.body && relogin.body.data && relogin.body.data.token;

    const shortPassword = await api(base, '/api/account/password', {
      method: 'PATCH',
      headers: auth(freshToken),
      body: JSON.stringify({
        currentPassword: FIRST.password,
        newPassword: 'short',
        confirmPassword: 'short',
      }),
    });
    check('Short password is rejected (400)', shortPassword.status === 400);
    const mismatch = await api(base, '/api/account/password', {
      method: 'PATCH',
      headers: auth(freshToken),
      body: JSON.stringify({
        currentPassword: FIRST.password,
        newPassword: 'AnotherPass123',
        confirmPassword: 'DifferentPass123',
      }),
    });
    check('Mismatched confirmation is rejected (400)', mismatch.status === 400);

    const samePassword = await api(base, '/api/account/password', {
      method: 'PATCH',
      headers: auth(freshToken),
      body: JSON.stringify({
        currentPassword: FIRST.password,
        newPassword: FIRST.password,
        confirmPassword: FIRST.password,
      }),
    });
    check('New password equal to current is rejected (400)', samePassword.status === 400);
    const wrongPassword = await api(base, '/api/account/password', {
      method: 'PATCH',
      headers: auth(freshToken),
      body: JSON.stringify({
        currentPassword: 'WrongPassword1',
        newPassword: 'BrandNewPass123',
        confirmPassword: 'BrandNewPass123',
      }),
    });
    check('Wrong current password prevents change (401)', wrongPassword.status === 401);
    const passwordChange = await api(base, '/api/account/password', {
      method: 'PATCH',
      headers: auth(freshToken),
      body: JSON.stringify({
        currentPassword: FIRST.password,
        newPassword: 'BrandNewPass123',
        confirmPassword: 'BrandNewPass123',
      }),
    });
    check(
      'Valid password change succeeds',
      passwordChange.status === 200 && passwordChange.body.success === true,
      `status ${passwordChange.status}`,
    );
    check('Password response leaks no password/hash', !leak(passwordChange.body));
    FIRST.password = 'BrandNewPass123';
    const loginNewPassword = await login({ email: FIRST.email, password: FIRST.password });
    check('Login works with the new password', loginNewPassword.status === 200);
    const secondMe = await api(base, '/api/account/me', { headers: auth(secondToken) });
    check(
      'Second fixture still reads only its own account',
      secondMe.status === 200 && secondMe.body.data.user.email === SECOND.email,
    );
    const deleteAttempt = await api(base, '/api/account', {
      method: 'DELETE',
      headers: auth(freshToken || token),
    });
    check('No destructive DELETE /api/account endpoint (404)', deleteAttempt.status === 404);
    const farmerBlockedVet = await api(base, '/api/vet/profile', { headers: auth(token) });
    check('Farmer is blocked from vet profile API (403)', farmerBlockedVet.status === 403);
  } catch (err) {
    failed += 1;
    results.push(`FAIL  Unexpected error -> ${err.message}`);
  } finally {
    server.close();
    await cleanup();
    await prisma.$disconnect();
  }

  console.log('\nAccount smoke test results');
  console.log('==========================');
  results.forEach((line) => console.log(line));
  console.log('==========================');
  console.log(`${passed} passed, ${failed} failed, ${skipped} skipped\n`);
  process.exit(failed === 0 ? 0 : 1);
};

run();
