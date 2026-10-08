import pathlib

p = pathlib.Path('scripts/reminderSmokeTest.js')
s = p.read_text(encoding='utf-8')

# 4. The complete endpoint now returns the full updated record (service fixed via requireOwnedReminder).
#    Verify completed state is persisted on the returned reminder.
old4 = """    check('Farmer can mark their own reminder completed (200)', completed.status === 200);
    const completedState = (completed && completed.body && completed.body.data && completed.body.data.reminder && completed.body.data.reminder.completed) || null;
    check('Completion state is persisted', completedState === true);
"""
new4 = """    check('Farmer can mark their own reminder completed (200)', completed.status === 200);
    const completedState = (completed && completed.body && completed.body.data && completed.body.data.reminder && completed.body.data.reminder.completed) || null;
    check('Completion state is persisted', completedState === true);
"""
assert old4 in s, 'old4 not found'

# 5. Verify vet blocked on farmer routes (403). Use the existing vetToken.
old6 = """    const vetToken = (regVet && regVet.body && regVet.body.data && regVet.body.data.token) || null;
    check('Vet can register', regVet.status === 201);
    check('Auth response carries a token', tokenA && tokenB && vetToken);
"""
new6 = """    const vetToken = (regVet && regVet.body && regVet.body.data && regVet.body.data.token) || null;
    check('Vet can register', regVet.status === 201);
    check('Auth response carries a token', tokenA && tokenB && vetToken);
    check('Vet blocked from creating reminder (403)', (await api(base, '/api/reminders', post(vetToken, { title: 'X', description: 'D', type: 'VACCINATION', dueDate: '2026-12-01' }))).status === 403);
"""
assert old6 in s, 'old6 not found'
s = s.replace(old6, new6)

p.write_text(s, encoding='utf-8')
print('fix_smoke3 applied')
