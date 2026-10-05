// Admin routes. Mounted at /api/admin.
//
// EVERY route below requires authentication first and then the ADMIN role:
//   guest                   -> 401
//   FARMER                  -> 403
//   VETERINARY_PROFESSIONAL -> 403
//
// Farmer and veterinary routers never gain admin privileges - authorization
// stays per-router, exactly as in Phases 1-4.
const express = require('express');
const { z } = require('zod');

const { validate, validateParams, validateQuery, idParamSchema } = require('../middleware/validate');
const authMiddleware = require('../middleware/authMiddleware');
const requireRole = require('../middleware/requireRole');
const {
  listAlerts,
  getAlert,
  createAlert,
  acknowledgeAlert,
  runClusterScan,
  getStatistics,
} = require('../controllers/adminController');
const { ALERT_TYPES, ANIMAL_TYPES, PROVINCES } = require('../utils/constants');

const router = express.Router();

router.use(authMiddleware, requireRole('ADMIN'));

// Validated alert filters. Only these whitelisted keys are ever used to build a
// Prisma where-clause - unknown query keys are ignored, invalid values -> 400.
const alertQuerySchema = z.object({
  type: z.enum(ALERT_TYPES).optional(),
  province: z.enum(PROVINCES).optional(),
  district: z.string().trim().min(2).max(120).optional(),
  animalType: z.enum(ANIMAL_TYPES).optional(),
  isActive: z.enum(['true', 'false']).optional(),
});

// strict(): unexpected keys (type, isActive, reportId, ...) are rejected with a
// clean 400, so nobody can impersonate a server-generated alert.
const createAlertSchema = z.strictObject({
  title: z.string().trim().min(3, 'Title must be at least 3 characters').max(160),
  message: z.string().trim().min(10, 'Message must be at least 10 characters').max(1000),
  province: z.enum(PROVINCES).optional(),
  district: z.string().trim().min(2).max(120).optional(),
  animalType: z.enum(ANIMAL_TYPES).optional(),
});

// Optional body: POST with no body (or {}) scans every district.
const clusterScanSchema = z
  .strictObject({
    district: z.string().trim().min(2).max(120).optional(),
  })
  .optional();

router.get('/alerts', validateQuery(alertQuerySchema), listAlerts);
router.post('/alerts', validate(createAlertSchema), createAlert);
router.post('/alerts/cluster-scan', validate(clusterScanSchema), runClusterScan);
router.get('/alerts/:id', validateParams(idParamSchema), getAlert);
// Server sets isActive=false itself; the request body is never read.
router.patch('/alerts/:id/acknowledge', validateParams(idParamSchema), acknowledgeAlert);
router.get('/stats', getStatistics);

module.exports = router;