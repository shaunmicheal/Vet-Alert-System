// Health report routes. Mounted at /api/reports.
// Locked to logged-in farmers - other roles get 403, guests get 401.
const express = require('express');
const { z } = require('zod');

const { validate, validateParams, validateQuery, idSchema, idParamSchema } = require('../middleware/validate');
const authMiddleware = require('../middleware/authMiddleware');
const requireRole = require('../middleware/requireRole');
const {
  listReports,
  createReport,
  getReport,
  triageReport,
} = require('../controllers/healthReportController');
const { ANIMAL_TYPES, RISK_LEVELS, REPORT_STATUSES } = require('../utils/constants');

const router = express.Router();

router.use(authMiddleware, requireRole('FARMER'));

// Structured triage information. The AI in Phase 3 will read exactly these fields.
const createReportSchema = z.object({
  title: z.string().trim().min(3, 'Title must be at least 3 characters').max(160),
  description: z.string().trim().min(10, 'Please describe the problem in at least 10 characters').max(4000),
  animalId: idSchema.optional(),
  symptomIds: z.array(idSchema).max(30, 'Too many symptoms selected').optional(),
  symptomsDuration: z.string().trim().max(120).optional(),
  appetite: z.string().trim().max(80).optional(),
  breathingDifficulty: z.boolean().optional(),
  affectedAnimals: z.number().int().min(0).max(100000).optional(),
  recentMovement: z.boolean().optional(),
  recentVaccination: z.boolean().optional(),
  recentTreatment: z.string().trim().max(500).optional(),
  additionalNotes: z.string().trim().max(2000).optional(),
});

// Optional list filters.
const listReportsQuerySchema = z.object({
  status: z.enum(REPORT_STATUSES).optional(),
  riskLevel: z.enum(RISK_LEVELS).optional(),
  animalType: z.enum(ANIMAL_TYPES).optional(),
});

router.get('/', validateQuery(listReportsQuerySchema), listReports);
router.post('/', validate(createReportSchema), createReport);
router.get('/:id', validateParams(idParamSchema), getReport);

// AI-assisted risk triage for one of the farmer's own reports (Phase 3).
router.post('/:id/triage', validateParams(idParamSchema), triageReport);

module.exports = router;
