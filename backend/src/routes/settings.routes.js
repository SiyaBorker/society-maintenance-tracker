const express = require('express');
const { body } = require('express-validator');
const validate = require('../utils/validate');
const { requireAuth, requireRole } = require('../middleware/auth');
const { getSettingsHandler, updateSettings } = require('../controllers/settings.controller');

const router = express.Router();

router.get('/', requireAuth, getSettingsHandler);

router.patch(
  '/',
  requireAuth,
  requireRole('ADMIN'),
  [
    body('overdueThresholdDays')
      .isInt({ min: 1, max: 365 })
      .withMessage('overdueThresholdDays must be an integer between 1 and 365'),
  ],
  validate,
  updateSettings
);

module.exports = router;
