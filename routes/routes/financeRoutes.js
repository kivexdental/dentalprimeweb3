const express = require('express');
const router = express.Router();
const {
  getFinanceOverview,
  getPayments,
  getExpenses,
  createExpense,
  deleteExpense,
  collectPatientBalance
} = require('../controllers/financeController');
const { authenticateToken } = require('../middleware/auth');

router.use(authenticateToken);

router.get('/overview', getFinanceOverview);
router.get('/payments', getPayments);
router.get('/expenses', getExpenses);
router.post('/expenses', createExpense);
router.delete('/expenses/:id', deleteExpense);
router.post('/collect-balance', collectPatientBalance);

module.exports = router;
