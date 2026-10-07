const express = require('express');
const router = express.Router();
const { getSettings, updateSettings, backupDatabase, restoreDatabase } = require('../controllers/settingController');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

router.get('/', getSettings); // Public read for clinic branding on landing/booking pages
router.put('/', authenticateToken, requireAdmin, updateSettings);
router.post('/backup', authenticateToken, requireAdmin, backupDatabase);
router.post('/restore', authenticateToken, requireAdmin, restoreDatabase);

module.exports = router;
