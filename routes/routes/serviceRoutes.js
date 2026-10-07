const express = require('express');
const router = express.Router();
const { getServices, createService, updateService, deleteService } = require('../controllers/serviceController');
const { authenticateToken } = require('../middleware/auth');

// Public read access for booking drop-down list
router.get('/', getServices);
router.post('/', authenticateToken, createService);
router.put('/:id', authenticateToken, updateService);
router.delete('/:id', authenticateToken, deleteService);

module.exports = router;
