import pathlib

p = pathlib.Path('src/services/reminderService.js')
s = p.read_text(encoding='utf-8')

old1 = """const createReminder = async (userId, input) => {
  const reminder = await prisma.reminder.create({
    data: {
      title: input.title,
      description: input.description || null,
      type: input.type,
      dueDate: input.dueDate,
      farmerId: userId,
    },
    select: reminderSelect,
  });

  return reminder;
};"""

new1 = """const createReminder = async (userId, input) => {
  const dueDate = input.dueDate ? new Date(input.dueDate + 'T00:00:00Z') : null;
  const reminder = await prisma.reminder.create({
    data: {
      title: input.title,
      description: input.description || null,
      type: input.type,
      dueDate,
      farmerId: userId,
    },
    select: reminderSelect,
  });

  return reminder;
};"""

old2 = """  if (input.dueDate !== undefined) fields.dueDate = input.dueDate;
"""

new2 = """  if (input.dueDate !== undefined) fields.dueDate = input.dueDate ? new Date(input.dueDate + 'T00:00:00Z') : null;
"""

if old1 not in s:
    print('CREATE path not found')
else:
    s = s.replace(old1, new1)
if old2 not in s:
    print('UPDATE path not found')
else:
    s = s.replace(old2, new2)

p.write_text(s, encoding='utf-8')
print('updated reminderService.js')
