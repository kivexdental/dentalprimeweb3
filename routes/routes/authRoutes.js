const express = require('express');
const router = express.Router();
const { login, getMe, getUsers, createUser, deleteUser } = require('../controllers/authController');
const { authenticateToken } = require('../middleware/auth');
const { loginLimiter } = require('../middleware/rateLimiter');

// Public login route
router.post('/login', loginLimiter, login);

// Protected routes
router.get('/me', authenticateToken, getMe);
router.get('/users', authenticateToken, getUsers);
router.post('/users', authenticateToken, createUser);
router.delete('/users/:id', authenticateToken, deleteUser);

module.exports = router;
