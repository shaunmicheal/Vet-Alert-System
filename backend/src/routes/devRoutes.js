// ============================================================================
// TEMPORARY FILE - PHASE 1 ONLY
// ----------------------------------------------------------------------------
// These routes exist purely to prove that role authorization works end-to-end.
// They are mounted ONLY when NODE_ENV !== 'production' (see src/app.js).
//
// >>> DELETE THIS FILE (and its mount in app.js) BEFORE PRODUCTION/DEPLOYMENT. <<<
// They are NOT part of the real VetAlert Zimbabwe API.
// ============================================================================
const express = require('express');

const authMiddleware = require('../middleware/authMiddleware');
const requireRole = require('../middleware/requireRole');
const { sendSuccess } = require('../utils/response');

const router = express.Router();

router.get('/farmer-only', authMiddleware, requireRole('FARMER'), (req, res) =>
  sendSuccess(res, {
    message: 'You reached a FARMER-only endpoint.',
    user: { id: req.user.id, role: req.user.role },
  }),
);

router.get('/vet-only', authMiddleware, requireRole('VETERINARY_PROFESSIONAL'), (req, res) =>
  sendSuccess(res, {
    message: 'You reached a VETERINARY_PROFESSIONAL-only endpoint.',
    user: { id: req.user.id, role: req.user.role },
  }),
);

router.get('/admin-only', authMiddleware, requireRole('ADMIN'), (req, res) =>
  sendSuccess(res, {
    message: 'You reached an ADMIN-only endpoint.',
    user: { id: req.user.id, role: req.user.role },
  }),
);

module.exports = router;
