const express = require('express');
const router = express.Router();
const {
  getNotificationCenterData,
  dispatchNotification,
  dispatchBatchNotifications,
  saveNotificationConfig
} = require('../controllers/notificationController');
const { authenticateToken } = require('../middleware/auth');

router.use(authenticateToken);

// GET /api/notifications - Fetch templates, settings, recipient suggestions, Excel-like cohorts, logs
router.get('/', getNotificationCenterData);

// POST /api/notifications/dispatch - Send single standardized notification to WhatsApp or Make.com
router.post('/dispatch', dispatchNotification);

// POST /api/notifications/dispatch-batch - Send batch notification to multiple selected patients
router.post('/dispatch-batch', dispatchBatchNotifications);

// POST /api/notifications/config - Save webhook URLs & WhatsApp credentials
router.post('/config', saveNotificationConfig);

module.exports = router;
