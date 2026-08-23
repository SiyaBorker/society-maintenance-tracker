const express = require('express');
const { requireAuth, requireRole } = require('../middleware/auth');
const { getDashboard } = require('../controllers/dashboard.controller');

const router = express.Router();

router.get('/', requireAuth, requireRole('ADMIN'), getDashboard);

module.exports = router;
