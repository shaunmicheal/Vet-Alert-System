// Farm profile routes. Mounted at /api/farmer, so the resource is /api/farmer/farm.
// Locked to logged-in farmers - other roles get 403, guests get 401.
const express = require('express');
const { z } = require('zod');

const { validate } = require('../middleware/validate');
const authMiddleware = require('../middleware/authMiddleware');
const requireRole = require('../middleware/requireRole');
const { getFarm, createFarm, updateFarm, deleteFarm } = require('../controllers/farmerController');
const { PROVINCES } = require('../utils/constants');

const router = express.Router();

router.use(authMiddleware, requireRole('FARMER'));

const farmFields = {
  name: z.string().trim().min(2, 'Farm name must be at least 2 characters').max(120),
  province: z.enum(PROVINCES),
  district: z.string().trim().min(2, 'District is required').max(120),
  ward: z.string().trim().max(120).optional(),
  village: z.string().trim().max(120).optional(),
  address: z.string().trim().max(240).optional(),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
};

// Create needs the full profile; update accepts any single field.
const createFarmSchema = z.object(farmFields);
const updateFarmSchema = z
  .object(farmFields)
  .partial()
  .refine((data) => Object.keys(data).length > 0, { message: 'Provide at least one field to update' });

router.get('/farm', getFarm);
router.post('/farm', validate(createFarmSchema), createFarm);
router.put('/farm', validate(updateFarmSchema), updateFarm);
router.patch('/farm', validate(updateFarmSchema), updateFarm);
router.delete('/farm', deleteFarm);

module.exports = router;
