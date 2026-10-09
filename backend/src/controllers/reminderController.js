const prisma = require('../config/prisma');
const { sendSuccess } = require('../utils/response');
const ApiError = require('../utils/ApiError');
const {
  listOwnedReminders,
  requireOwnedReminder,
  createReminder,
  updateReminder,
  completeReminder,
  deleteReminder,
} = require('../services/reminderService');
const {
  reminderCreateSchema,
  reminderUpdateSchema,
} = require('../middleware/reminderValidation');

const listReminders = async (req, res) => {
  const reminders = await listOwnedReminders(req.user.id);
  return sendSuccess(res, { reminders });
};

const createReminderAction = async (req, res) => {
  const { title, description, type, dueDate } = req.body;

  const reminder = await createReminder(req.user.id, { title, description, type, dueDate });

  return sendSuccess(res, { reminder }, 201);
};

const getReminder = async (req, res) => {
  const reminder = await requireOwnedReminder(req.user.id, req.params.id);
  return sendSuccess(res, { reminder });
};

const updateReminderAction = async (req, res) => {
  const { title, description, type, dueDate } = req.body;
  const reminder = await updateReminder(req.user.id, req.params.id, { title, description, type, dueDate });
  return sendSuccess(res, { reminder });
};

const completeReminderAction = async (req, res) => {
  const reminder = await completeReminder(req.user.id, req.params.id);
  return sendSuccess(res, { reminder });
};

const deleteReminderAction = async (req, res) => {
  await deleteReminder(req.user.id, req.params.id);
  return sendSuccess(res, { success: true });
};

module.exports = {
  listReminders,
  createReminderAction,
  getReminder,
  updateReminderAction,
  completeReminderAction,
  deleteReminderAction,
};
