const express = require('express');
const { body, query, param } = require('express-validator');
const validate = require('../utils/validate');
const { requireAuth, requireRole } = require('../middleware/auth');
const { commentRateLimiter } = require('../middleware/rateLimit');
const upload = require('../middleware/upload');
const {
  createComplaint,
  listComplaints,
  exportComplaintsCsv,
  getComplaint,
  addComment,
  updateStatus,
  updatePriority,
} = require('../controllers/complaints.controller');

const router = express.Router();

const CATEGORIES = [
  'PLUMBING',
  'ELECTRICAL',
  'CLEANING',
  'SECURITY',
  'LIFT',
  'PARKING',
  'CIVIL_STRUCTURAL',
  'PEST_CONTROL',
  'OTHER',
];
const STATUSES = ['OPEN', 'IN_PROGRESS', 'RESOLVED'];
const PRIORITIES = ['LOW', 'MEDIUM', 'HIGH'];

router.use(requireAuth);

router.post(
  '/',
  requireRole('RESIDENT'),
  upload.single('photo'),
  upload.uploadPhotoToCloudinary,
  [
    body('category').isIn(CATEGORIES).withMessage(`category must be one of: ${CATEGORIES.join(', ')}`),
    body('description').trim().isLength({ min: 5 }).withMessage('description must be at least 5 characters'),
  ],
  validate,
  createComplaint
);

router.get(
  '/',
  [
    query('category').optional().isIn(CATEGORIES),
    query('status').optional().isIn(STATUSES),
    query('dateFrom').optional().isISO8601(),
    query('dateTo').optional().isISO8601(),
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 200 }),
  ],
  validate,
  listComplaints
);

router.get(
  '/export',
  requireRole('ADMIN'),
  [
    query('category').optional().isIn(CATEGORIES),
    query('status').optional().isIn(STATUSES),
    query('dateFrom').optional().isISO8601(),
    query('dateTo').optional().isISO8601(),
  ],
  validate,
  exportComplaintsCsv
);

router.get('/:id', [param('id').isUUID()], validate, getComplaint);

router.post(
  '/:id/comments',
  commentRateLimiter,
  [
    param('id').isUUID(),
    body('message').trim().isLength({ min: 1, max: 2000 }).withMessage('message must be between 1 and 2000 characters'),
  ],
  validate,
  addComment
);

router.patch(
  '/:id/status',
  requireRole('ADMIN'),
  [
    param('id').isUUID(),
    body('status').isIn(STATUSES).withMessage(`status must be one of: ${STATUSES.join(', ')}`),
    body('note').optional({ nullable: true }).isString(),
  ],
  validate,
  updateStatus
);

router.patch(
  '/:id/priority',
  requireRole('ADMIN'),
  [
    param('id').isUUID(),
    body('priority').isIn(PRIORITIES).withMessage(`priority must be one of: ${PRIORITIES.join(', ')}`),
  ],
  validate,
  updatePriority
);

module.exports = router;
