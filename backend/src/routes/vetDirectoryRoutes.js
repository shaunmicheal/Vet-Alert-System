const express = require('express');
const { z } = require('zod');

const { validateQuery } = require('../middleware/validate');
const authMiddleware = require('../middleware/authMiddleware');
const requireRole = require('../middleware/requireRole');
const { listProfessionals } = require('../controllers/vetDirectoryController');
const { PROVINCES } = require('../utils/constants');

const router = express.Router();

router.use(authMiddleware, requireRole('FARMER', 'VETERINARY_PROFESSIONAL'));

const directoryQuerySchema = z.object({
  province: z.enum(PROVINCES).optional(),
  district: z.string().trim().min(2, 'District filter is too short').max(120).optional(),
  professionalType: z.string().trim().min(2, 'Professional type filter is too short').max(120).optional(),
  specialisation: z.string().trim().min(2, 'Specialisation filter is too short').max(120).optional(),
  search: z.string().trim().min(2, 'Search is too short').max(120).optional(),
});

router.get('/', validateQuery(directoryQuerySchema), listProfessionals);

module.exports = router;
