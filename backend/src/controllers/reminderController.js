// Reminder controller. Every read and write is scoped to the authenticated
// farmer via `req.user.id` (never the client). Errors pass through `next(err)`
// to the central error middleware so Prisma details are never leaked.
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

// GET /api/reminders -> the authenticated farmer's own reminders, ordered
// uncompleted-first then oldest due date first.
const listReminders = async (req, res) => {
  const reminders = await listOwnedReminders(req.user.id);
  return sendSuccess(res, { reminders });
};

// POST /api/reminders
// Body: { title, description?, type, dueDate }. `farmerId` is NEVER accepted -
// it is derived from the authenticated user. A client-supplied farmerId would
// be stripped by the strict validation before it reaches the service.
const createReminderAction = async (req, res) => {
  const { title, description, type, dueDate } = req.body;

  const reminder = await createReminder(req.user.id, { title, description, type, dueDate });

  return sendSuccess(res, { reminder }, 201);
};

// GET /api/reminders/:id -> the farmer's own reminder only (404 otherwise,
// so a farmer cannot discover another farmer's ids).
const getReminder = async (req, res) => {
  const reminder = await requireOwnedReminder(req.user.id, req.params.id);
  return sendSuccess(res, { reminder });
};

// PATCH /api/reminders/:id -> edit the farmer's own reminder's editable fields.
const updateReminderAction = async (req, res) => {
  const { title, description, type, dueDate } = req.body;
  const reminder = await updateReminder(req.user.id, req.params.id, { title, description, type, dueDate });
  return sendSuccess(res, { reminder });
};

// PATCH /api/reminders/:id/complete -> mark the farmer's own reminder completed.
const completeReminderAction = async (req, res) => {
  const reminder = await completeReminder(req.user.id, req.params.id);
  return sendSuccess(res, { reminder });
};

// DELETE /api/reminders/:id -> delete the farmer's own reminder only.
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
