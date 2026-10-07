const express = require('express');
const router = express.Router();
const { getDashboardStats, getDetailedReports } = require('../controllers/reportController');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

router.use(authenticateToken);
router.get('/stats', getDashboardStats);
router.get('/detailed', requireAdmin, getDetailedReports);

module.exports = router;
