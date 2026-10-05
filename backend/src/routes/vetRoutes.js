// Veterinary professional WORKSPACE. Mounted at /api/vet.
// Locked to logged-in VETERINARY_PROFESSIONAL accounts only.
const express = require('express');
const { z } = require('zod');

const { validate, validateParams, idParamSchema } = require('../middleware/validate');
const authMiddleware = require('../middleware/authMiddleware');
const requireRole = require('../middleware/requireRole');
const {
  getProfile,
  updateProfile,
  listCases,
  getCase,
  updateCaseStatus,
  updateCaseResponse,
} = require('../controllers/vetController');
const { PROVINCES, REFERRAL_STATUSES } = require('../utils/constants');

const router = express.Router();

router.use(authMiddleware, requireRole('VETERINARY_PROFESSIONAL'));

// Editable professional fields. `isActive`, `userId` and the User `role` are NOT
// listed, so an attempt to send them is rejected with a 400 (thanks to .strict()).
const updateProfileSchema = z
  .strictObject({
    name: z.string().trim().min(2, 'Name must be at least 2 characters').max(120),
    professionalType: z.string().trim().min(2, 'Professional type is required').max(120),
    phone: z.string().trim().min(5, 'Phone number is too short').max(30),
    email: z.string().trim().email('Enter a valid email address').max(160),
    province: z.enum(PROVINCES),
    district: z.string().trim().min(2, 'District is required').max(120),
    specialisation: z.string().trim().max(200),
    availability: z.string().trim().max(120),
  })
  .partial()
  .refine((data) => Object.keys(data).length > 0, { message: 'Provide at least one field to update' });

// A status update accepts ONLY a known ReferralStatus value (extra keys -> 400).
const updateStatusSchema = z.strictObject({ status: z.enum(REFERRAL_STATUSES) });

// The professional response is trimmed, non-empty and length-bounded.
const updateResponseSchema = z.strictObject({
  professionalResponse: z.string().trim().min(10, 'Response must be at least 10 characters').max(2000),
});

// --- Profile ----------------------------------------------------------------
router.get('/profile', getProfile);
router.patch('/profile', validate(updateProfileSchema), updateProfile);
router.put('/profile', validate(updateProfileSchema), updateProfile);

// --- Case management --------------------------------------------------------
router.get('/cases', listCases);
router.get('/cases/:id', validateParams(idParamSchema), getCase);
router.patch('/cases/:id/status', validateParams(idParamSchema), validate(updateStatusSchema), updateCaseStatus);
router.patch('/cases/:id/response', validateParams(idParamSchema), validate(updateResponseSchema), updateCaseResponse);

module.exports = router;
