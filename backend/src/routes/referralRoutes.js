// Farmer referral routes. Mounted at /api/referrals.
// Locked to logged-in farmers - other roles get 403, guests get 401.
const express = require('express');
const { z } = require('zod');

const { validate, validateParams, idSchema, idParamSchema } = require('../middleware/validate');
const authMiddleware = require('../middleware/authMiddleware');
const requireRole = require('../middleware/requireRole');
const { listReferrals, createReferral, getReferral } = require('../controllers/referralController');

const router = express.Router();

router.use(authMiddleware, requireRole('FARMER'));

// .strict() rejects unexpected keys, so a client cannot smuggle a farmerId,
// status or any other ownership field into the request.
const createReferralSchema = z
  .strictObject({
    reportId: idSchema,
    professionalId: idSchema,
    farmerMessage: z.string().trim().min(1).max(1000).optional(),
  });

router.get('/', listReferrals);
router.post('/', validate(createReferralSchema), createReferral);
router.get('/:id', validateParams(idParamSchema), getReferral);

module.exports = router;
