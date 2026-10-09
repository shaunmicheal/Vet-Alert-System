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

const alertQuerySchema = z.object({
  type: z.enum(ALERT_TYPES).optional(),
  province: z.enum(PROVINCES).optional(),
  district: z.string().trim().min(2).max(120).optional(),
  animalType: z.enum(ANIMAL_TYPES).optional(),
  isActive: z.enum(['true', 'false']).optional(),
});

const createAlertSchema = z.strictObject({
  title: z.string().trim().min(3, 'Title must be at least 3 characters').max(160),
  message: z.string().trim().min(10, 'Message must be at least 10 characters').max(1000),
  province: z.enum(PROVINCES).optional(),
  district: z.string().trim().min(2).max(120).optional(),
  animalType: z.enum(ANIMAL_TYPES).optional(),
});

const clusterScanSchema = z
  .strictObject({
    district: z.string().trim().min(2).max(120).optional(),
  })
  .optional();

router.get('/alerts', validateQuery(alertQuerySchema), listAlerts);
router.post('/alerts', validate(createAlertSchema), createAlert);
router.post('/alerts/cluster-scan', validate(clusterScanSchema), runClusterScan);
router.get('/alerts/:id', validateParams(idParamSchema), getAlert);
router.patch('/alerts/:id/acknowledge', validateParams(idParamSchema), acknowledgeAlert);
router.get('/stats', getStatistics);

module.exports = router;
