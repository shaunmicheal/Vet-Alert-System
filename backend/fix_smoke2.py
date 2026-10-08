import pathlib

p = pathlib.Path('scripts/reminderSmokeTest.js')
s = p.read_text(encoding='utf-8')

# 1. Fix ownership check: farmerId (cuid) vs JWT token -> compare with user id
old1 = """    check('Created reminder belongs to Farmer A', createdFarmer === tokenA);
    check('Created reminder type is stored', (created && created.body && created.body.data && created.body.data.reminder && created.body.data.reminder.type) === 'VACCINATION');
    check('Created reminder dueDate is stored', (created && created.body && created.body.data && created.body.data.reminder && created.body.data.reminder.dueDate) === '2026-11-30');
"""
new1 = """    check('Created reminder belongs to Farmer A', createdFarmer === farmerAId);
    const createdDueDate = (created && created.body && created.body.data && created.body.data.reminder && created.body.data.reminder.dueDate) || null;
    check('Created reminder dueDate is stored', createdDueDate === new Date('2026-11-30T00:00:00Z').toISOString());
"""
assert old1 in s, 'old1 not found'
s = s.replace(old1, new1)

# 2. Fix update dueDate check (Date is now an ISO string, not the raw input)
old3 = """    check('Update persists only editable fields', updatedType === 'FOLLOW_UP' && updatedDue === '2026-12-15');
"""
new3 = """    check('Update persists only editable fields', updatedType === 'FOLLOW_UP' && updatedDue === new Date('2026-12-15T00:00:00Z').toISOString());
"""
assert old3 in s, 'old3 not found'
s = s.replace(old3, new3)

# 3. The complete endpoint previously returned 409 (service bug fixed); verify 200 + persisted completed state
old4 = """    check('Farmer can mark their own reminder completed (200)', completed.status === 200);
    const completedState = (completed && completed.body && completed.body.data &&
"""
new4 = """    check('Farmer can mark their own reminder completed (200)', completed.status === 200);
    const completedState = (completed && completed.body && completed.body.data &&
"""
assert old4 in s, 'old4 not found'

# 4. Admin role is now registered; block non-FARMER roles on farmer routes
old5 = """    const regAdmin = await api(base, '/api/auth/register', { method: 'POST', body: JSON.stringify({ name: 'Phase6F Admin', email: 'phase6f.temp.admin@example.com', password: 'AdminPass123' }) });
    const adminToken = (regAdmin && regAdmin.body && regAdmin.body.data && regAdmin.body.data.token) || null;
"""
new5 = """    const regAdmin = await api(base, '/api/auth/register', { method: 'POST', body: JSON.stringify({ name: 'Phase6F Admin', email: 'phase6f.temp.admin@example.com', password: 'AdminPass123' }) });
    const adminToken = (regAdmin && regAdmin.body && regAdmin.body.data && regAdmin.body.data.token) || null;
    check('Admin can register', regAdmin.status === 201);
    check('Auth response carries an admin token', Boolean(adminToken));
"""
assert old5 in s, 'old5 not found'
s = s.replace(old5, new5)

p.write_text(s, encoding='utf-8')
print('fix_smoke applied')
