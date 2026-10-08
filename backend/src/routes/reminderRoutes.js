// Reminder routes. Mounted at /api/reminders.
// FARMER-only - other roles get 403, guests get 401. farmerId is derived from
// the authenticated user and is NEVER accepted from the client.
const express = require('express');
const { z } = require('zod');

const { validate, validateParams, idSchema, idParamSchema } = require('../middleware/validate');
const authMiddleware = require('../middleware/authMiddleware');
const requireRole = require('../middleware/requireRole');
const {
  listReminders,
  createReminderAction,
  getReminder,
  updateReminderAction,
  completeReminderAction,
  deleteReminderAction,
} = require('../controllers/reminderController');

const router = express.Router();

router.use(authMiddleware, requireRole('FARMER'));

const createReminderSchema = z.strictObject({
  title: z.string().trim().min(1).max(200),
  description: z.string().trim().max(2000).optional(),
  type: z.enum(['VACCINATION', 'DEWORMING', 'DIPPING', 'PREGNANCY_CHECK', 'FOLLOW_UP', 'OTHER'], { message: 'type must be one of: VACCINATION, DEWORMING, DIPPING, PREGNANCY_CHECK, FOLLOW_UP, OTHER.' }),
  dueDate: z.string().trim().refine((v) => {
    if (!v) return false;
    const d = new Date(v + 'T00:00:00Z');
    return !Number.isNaN(d.getTime());
  }, { message: 'dueDate must be a valid date in YYYY-MM-DD format.' }),
});

const updateReminderSchema = z.strictObject({
  title: z.string().trim().min(1).max(200).optional(),
  description: z.string().trim().max(2000).optional(),
  type: z.enum(['VACCINATION', 'DEWORMING', 'DIPPING', 'PREGNANCY_CHECK', 'FOLLOW_UP', 'OTHER'], { message: 'type must be one of: VACCINATION, DEWORMING, DIPPING, PREGNANCY_CHECK, FOLLOW_UP, OTHER.' }),
  dueDate: z.string().trim().refine((v) => {
    if (v === undefined) return true;
    if (!v) return false;
    const d = new Date(v + 'T00:00:00Z');
    return !Number.isNaN(d.getTime());
  }, { message: 'dueDate must be a valid date in YYYY-MM-DD format.' }).optional(),
});

// .strict() rejects unexpected keys, so a client cannot smuggle a farmerId
// or any other ownership/control field into the request.
router.get('/', listReminders);
router.post('/', validate(createReminderSchema), createReminderAction);
router.get('/:id', validateParams(idParamSchema), getReminder);
router.patch('/:id', validateParams(idParamSchema), validate(updateReminderSchema), updateReminderAction);
router.patch('/:id/complete', validateParams(idParamSchema), completeReminderAction);
router.delete('/:id', validateParams(idParamSchema), deleteReminderAction);

module.exports = router;
