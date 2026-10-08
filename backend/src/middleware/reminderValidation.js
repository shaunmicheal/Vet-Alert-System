// Zod validation for reminder requests.
// `idSchema` comes from the shared validate middleware and enforces the format
// Prisma's cuid() produces (lowercase letters + digits, 8-64 chars). `strictObject`
// rejects any unexpected key, so a client can never smuggle a farmerId into a
// reminder request.
const { z } = require('zod');
const { idSchema } = require('../middleware/validate');
const { REMINDER_TYPES } = require('../utils/constants');

// dateString: YYYY-MM-DD (ISO 8601 date only - no time component). A non-empty
// string that Prisma's DateTime can parse is accepted; the date is validated
// in the controller and returned via the shared error format.
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
