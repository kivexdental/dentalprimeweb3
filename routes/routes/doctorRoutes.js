const express = require('express');
const router = express.Router();
const { getDoctors, createDoctor, updateDoctor, deleteDoctor } = require('../controllers/doctorController');
const { authenticateToken } = require('../middleware/auth');

// Public read access for online booking forms if needed, protected write
router.get('/', getDoctors);
router.post('/', authenticateToken, createDoctor);
router.put('/:id', authenticateToken, updateDoctor);
router.delete('/:id', authenticateToken, deleteDoctor);

module.exports = router;
