const express = require('express');
const { z } = require('zod');

const { validate } = require('../middleware/validate');
const authMiddleware = require('../middleware/authMiddleware');
const {
  getOwnAccount,
  updateOwnProfile,
  updateOwnEmail,
  updateOwnPassword,
} = require('../controllers/accountController');

const router = express.Router();

router.use(authMiddleware);

const profileSchema = z
  .strictObject({
    name: z.string().trim().min(2, 'Name must be at least 2 characters').max(120).optional(),
    phone: z
      .string()
      .trim()
      .max(30, 'Phone number is too long')
      .refine((value) => value === '' || value.length >= 5, {
        message: 'Phone number is too short',
      })
      .optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'Provide at least one field to update',
  });

const emailSchema = z.strictObject({
  email: z.string().trim().toLowerCase().email('Enter a valid email address').max(160),
  currentPassword: z.string().min(1, 'Current password is required'),
});

const passwordSchema = z
  .strictObject({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: z.string().min(8, 'New password must be at least 8 characters').max(128),
    confirmPassword: z.string().min(1, 'Please confirm your new password'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'New passwords do not match',
    path: ['confirmPassword'],
  });

router.get('/me', getOwnAccount);
router.patch('/profile', validate(profileSchema), updateOwnProfile);
router.patch('/email', validate(emailSchema), updateOwnEmail);
router.patch('/password', validate(passwordSchema), updateOwnPassword);

module.exports = router;
