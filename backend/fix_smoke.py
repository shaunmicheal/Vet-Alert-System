import pathlib

p = pathlib.Path('scripts/reminderSmokeTest.js')
s = p.read_text(encoding='utf-8')

# 1. Capture farmer A's user id from registration response
old1 = """    const tokenA = (regA && regA.body && regA.body.data && regA.body.data.token) || null;
    const tokenB = (regB && regB.body && regB.body.data && regB.body.data.token) || null;
    const vetToken = (regVet && regVet.body && regVet.body.data && regVet.body.data.token) || null;
"""
new1 = """    const tokenA = (regA && regA.body && regA.body.data && regA.body.data.token) || null;
    const farmerAId = (regA && regA.body && regA.body.data && regA.body.data.user && regA.body.data.user.id) || null;
    const tokenB = (regB && regB.body && regB.body.data && regB.body.data.token) || null;
    const vetToken = (regVet && regVet.body && regVet.body.data && regVet.body.data.token) || null;
"""
assert old1 in s, 'old1 not found'
s = s.replace(old1, new1)

# 2. Fix ownership check: farmerId (cuid) vs JWT token -> compare with user id
old2 = """    check('Created reminder belongs to Farmer A', createdFarmer === tokenA);
    check('Created reminder dueDate is stored', (created && created.body && created.body.data && created.body.data.reminder && created.body.data.reminder.dueDate) === '2026-11-30');
"""
new2 = """    check('Created reminder belongs to Farmer A', createdFarmer === farmerAId);
    const createdDueDate = (created && created.body && created.body.data && created.body.data.reminder && created.body.data.reminder.dueDate) || null;
    check('Created reminder dueDate is stored', createdDueDate === new Date('2026-11-30T00:00:00Z').toISOString());
"""
assert old2 in s, 'old2 not found'
s = s.replace(old2, new2)

p.write_text(s, encoding='utf-8')
print('done fix_smoke')
