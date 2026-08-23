const express = require('express');
const { body, param } = require('express-validator');
const validate = require('../utils/validate');
const { requireAuth, requireRole } = require('../middleware/auth');
const { listNotices, createNotice, getNotice } = require('../controllers/notices.controller');

const router = express.Router();

router.use(requireAuth);

router.get('/', listNotices);
router.get('/:id', [param('id').isUUID()], validate, getNotice);

router.post(
  '/',
  requireRole('ADMIN'),
  [
    body('title').trim().notEmpty().withMessage('title is required'),
    body('body').trim().notEmpty().withMessage('body is required'),
    body('isImportant').optional().isBoolean(),
  ],
  validate,
  createNotice
);

module.exports = router;
