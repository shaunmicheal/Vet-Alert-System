const express = require('express');
const { z } = require('zod');

const { validate, validateParams, idParamSchema } = require('../middleware/validate');
const authMiddleware = require('../middleware/authMiddleware');
const requireRole = require('../middleware/requireRole');
const {
  getProfile,
  createProfile,
  updateProfile,
  listCases,
  getCase,
  updateCaseStatus,
  updateCaseResponse,
} = require('../controllers/vetController');
const { PROVINCES, REFERRAL_STATUSES } = require('../utils/constants');

const router = express.Router();

router.use(authMiddleware, requireRole('VETERINARY_PROFESSIONAL'));

const profileFields = {
    name: z.string().trim().min(2, 'Name must be at least 2 characters').max(120),
    professionalType: z.string().trim().min(2, 'Professional type is required').max(120),
    phone: z.string().trim().min(5, 'Phone number is too short').max(30),
    email: z.string().trim().max(160).refine((value) => value === '' || z.string().trim().email().safeParse(value).success, { message: 'Enter a valid email address' }),
    province: z.enum(PROVINCES),
    district: z.string().trim().min(2, 'District is required').max(120),
    specialisation: z.string().trim().max(200),
    availability: z.string().trim().max(120),
};

const createProfileSchema = z.strictObject({
  name: profileFields.name,
  professionalType: profileFields.professionalType,
  phone: profileFields.phone,
  email: profileFields.email.optional(),
  province: profileFields.province,
  district: profileFields.district,
  specialisation: profileFields.specialisation.optional(),
  availability: profileFields.availability.optional(),
});

const updateProfileSchema = z
  .strictObject(profileFields)
  .partial()
  .refine((data) => Object.keys(data).length > 0, { message: 'Provide at least one field to update' });

const updateStatusSchema = z.strictObject({ status: z.enum(REFERRAL_STATUSES) });

const updateResponseSchema = z.strictObject({
  professionalResponse: z.string().trim().min(10, 'Response must be at least 10 characters').max(2000),
});

router.get('/profile', getProfile);
router.post('/profile', validate(createProfileSchema), createProfile);
router.patch('/profile', validate(updateProfileSchema), updateProfile);
router.put('/profile', validate(updateProfileSchema), updateProfile);

router.get('/cases', listCases);
router.get('/cases/:id', validateParams(idParamSchema), getCase);
router.patch('/cases/:id/status', validateParams(idParamSchema), validate(updateStatusSchema), updateCaseStatus);
router.patch('/cases/:id/response', validateParams(idParamSchema), validate(updateResponseSchema), updateCaseResponse);

module.exports = router;
