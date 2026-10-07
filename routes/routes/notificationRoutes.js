const express = require('express');
const router = express.Router();
const { getNotifications, markAsRead, triggerWebhook } = require('../controllers/notificationController');
const { authenticateToken } = require('../middleware/auth');

router.use(authenticateToken);
router.get('/', getNotifications);
router.put('/:id/read', markAsRead);
router.post('/trigger-webhook', triggerWebhook);

module.exports = router;

