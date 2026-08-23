const express = require('express');
const { body } = require('express-validator');
const validate = require('../utils/validate');
const { requireAuth } = require('../middleware/auth');
const { loginRateLimiter } = require('../middleware/rateLimit');
const { register, login, me } = require('../controllers/auth.controller');

const router = express.Router();

router.post(
  '/register',
  [
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('email').isEmail().withMessage('A valid email is required').normalizeEmail(),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    body('flatNumber').optional({ nullable: true }).isString(),
    body('phone').optional({ nullable: true }).isString(),
  ],
  validate,
  register
);

router.post(
  '/login',
  loginRateLimiter,
  [
    body('email').isEmail().withMessage('A valid email is required').normalizeEmail(),
    body('password').notEmpty().withMessage('Password is required'),
  ],
  validate,
  login
);

router.get('/me', requireAuth, me);

module.exports = router;
