import pathlib

p = pathlib.Path('scripts/reminderSmokeTest.js')
s = p.read_text(encoding='utf-8')

# 4. Verify complete endpoint now returns the full updated record.
old4 = """    check('Farmer can mark their own reminder completed (200)', completed.status === 200);
    const completedState = (completed && completed.body && completed.body.data && completed.body.data.reminder && completed.body.data.reminder.completed) || null;
    check('Completion state is persisted', completedState === true);
"""
new4 = """    check('Farmer can mark their own reminder completed (200)', completed.status === 200);
    const completedState = (completed && completed.body && completed.body.data && completed.body.data.reminder && completed.body.data.reminder.completed) || null;
    check('Completion state is persisted', completedState === true);
"""
print('old4 found:', old4 in s)

# 5. Vet role block on farmer routes.
print('has vetToken block:', 'const vetToken' in s)

p.write_text(s, encoding='utf-8')
print('check done')
