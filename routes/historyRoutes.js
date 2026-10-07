const express = require('express');
const router = express.Router();
const { getHistory, getHistoryById } = require('../controllers/historyController');
const { authenticateToken } = require('../middleware/auth');

router.use(authenticateToken);
router.get('/', getHistory);
router.get('/:id', getHistoryById);

module.exports = router;
