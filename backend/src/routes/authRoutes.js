const express = require('express');
const { z } = require('zod');

const { validate } = require('../middleware/validate');
const authMiddleware = require('../middleware/authMiddleware');
const { registerFarmer, login, getMe } = require('../controllers/authController');

const router = express.Router();

// Request schemas. Keeping them next to the routes makes them easy to read.
const registerSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters'),
  email: z.string().trim().email('Enter a valid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  phone: z.string().trim().max(30, 'Phone number is too long').optional(),
});

const loginSchema = z.object({
  email: z.string().trim().email('Enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

router.post('/register', validate(registerSchema), registerFarmer);
router.post('/login', validate(loginSchema), login);
router.get('/me', authMiddleware, getMe);

module.exports = router;
