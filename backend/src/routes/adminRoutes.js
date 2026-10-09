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
  listUsers,
  getUser,
  listReports,
  getReport,
  listReferrals,
  getReferral,
  listProfessionals,
  getProfessional,
} = require('../controllers/adminController');
const { ROLES, ALERT_TYPES, ANIMAL_TYPES, PROVINCES, RISK_LEVELS, REPORT_STATUSES, REFERRAL_STATUSES } = require('../utils/constants');

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

const paginationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).max(1000).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
  search: z.string().trim().min(1).max(120).optional(),
});

const usersQuerySchema = paginationQuerySchema.extend({
  role: z.enum(ROLES).optional(),
});

const reportsQuerySchema = paginationQuerySchema.extend({
  status: z.enum(REPORT_STATUSES).optional(),
  riskLevel: z.enum(RISK_LEVELS).optional(),
  province: z.enum(PROVINCES).optional(),
  animalType: z.enum(ANIMAL_TYPES).optional(),
});

const referralsQuerySchema = paginationQuerySchema.extend({
  status: z.enum(REFERRAL_STATUSES).optional(),
  province: z.enum(PROVINCES).optional(),
});

const professionalsQuerySchema = paginationQuerySchema.extend({
  province: z.enum(PROVINCES).optional(),
  isActive: z.enum(['true', 'false']).optional(),
});

router.get('/users', validateQuery(usersQuerySchema), listUsers);
router.get('/users/:id', validateParams(idParamSchema), getUser);
router.get('/reports', validateQuery(reportsQuerySchema), listReports);
router.get('/reports/:id', validateParams(idParamSchema), getReport);
router.get('/referrals', validateQuery(referralsQuerySchema), listReferrals);
router.get('/referrals/:id', validateParams(idParamSchema), getReferral);
router.get('/veterinary', validateQuery(professionalsQuerySchema), listProfessionals);
router.get('/veterinary/:id', validateParams(idParamSchema), getProfessional);

module.exports = router;
