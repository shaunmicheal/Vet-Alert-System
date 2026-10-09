const { z } = require('zod');
const { idSchema } = require('../middleware/validate');
const { REMINDER_TYPES } = require('../utils/constants');

const dateString = z.string().trim().refine((v) => {
  if (!v) return false;
  const d = new Date(v + 'T00:00:00Z');
  return !Number.isNaN(d.getTime());
}, { message: 'dueDate must be a valid date in YYYY-MM-DD format.' });

const reminderCreateSchema = z.strictObject({
  title: z.string().trim().min(1).max(200),
  description: z.string().trim().max(2000).optional(),
  type: z.enum(REMINDER_TYPES, { message: 'type must be one of: ' + REMINDER_TYPES.join(', ') + '.' }),
  dueDate: dateString,
});

const reminderUpdateSchema = z.strictObject({
  title: z.string().trim().min(1).max(200).optional(),
  description: z.string().trim().max(2000).optional(),
  type: z.enum(REMINDER_TYPES, { message: 'type must be one of: ' + REMINDER_TYPES.join(', ') + '.' }),
  dueDate: dateString.optional(),
});

module.exports = { reminderCreateSchema, reminderUpdateSchema };
