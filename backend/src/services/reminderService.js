const prisma = require('../config/prisma');
const ApiError = require('../utils/ApiError');

const NOT_FOUND = 'Unable to find that record.';

const COMPLETION_TRANSITIONS = {
  false: ['true'],
  true: [],
};

const canComplete = (current) => (COMPLETION_TRANSITIONS[current] || []).includes('true');

const assertCompletion = (current) => {
  if (!canComplete(current)) {
    throw new ApiError(409, `A reminder cannot be moved from ${current} to completed.`);
  }
};

const reminderSelect = {
  id: true,
  title: true,
  description: true,
  type: true,
  dueDate: true,
  completed: true,
  createdAt: true,
  updatedAt: true,
};

const requireOwnedReminder = async (userId, reminderId) => {
  const reminder = await prisma.reminder.findFirst({
    where: { id: reminderId, farmerId: userId },
    select: reminderSelect,
  });

  if (!reminder) throw new ApiError(404, NOT_FOUND);
  return reminder;
};

const listOwnedReminders = async (userId) => {
  return prisma.reminder.findMany({
    where: { farmerId: userId },
    orderBy: [
      { completed: 'asc' },
      { dueDate: 'asc' },
    ],
    select: reminderSelect,
  });
};

const createReminder = async (userId, input) => {
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
};

const updateReminder = async (userId, reminderId, input) => {
  const fields = {};
  if (input.title !== undefined) fields.title = input.title;
  if (input.description !== undefined) fields.description = input.description ?? null;
  if (input.type !== undefined) fields.type = input.type;
  if (input.dueDate !== undefined) fields.dueDate = input.dueDate ? new Date(input.dueDate + 'T00:00:00Z') : null;

  const reminder = await prisma.reminder.updateMany({
    where: { id: reminderId, farmerId: userId },
    data: fields,
  });

  if (reminder.count === 0) throw new ApiError(404, NOT_FOUND);

  return requireOwnedReminder(userId, reminderId, reminderSelect);
};

const completeReminder = async (userId, reminderId) => {
  assertCompletion(
    (await requireOwnedReminder(userId, reminderId)).completed
  );

  const updated = await prisma.reminder.updateMany({
    where: { id: reminderId, farmerId: userId },
    data: { completed: true },
  });

  if (updated.count === 0) throw new ApiError(404, NOT_FOUND);

  return requireOwnedReminder(userId, reminderId, reminderSelect);
};

const deleteReminder = async (userId, reminderId) => {
  const deleted = await prisma.reminder.deleteMany({
    where: { id: reminderId, farmerId: userId },
  });

  if (deleted.count === 0) throw new ApiError(404, NOT_FOUND);

  return { success: true };
};

module.exports = {
  NOT_FOUND,
  COMPLETION_TRANSITIONS,
  canComplete,
  assertCompletion,
  requireOwnedReminder,
  listOwnedReminders,
  createReminder,
  updateReminder,
  completeReminder,
  deleteReminder,
};

