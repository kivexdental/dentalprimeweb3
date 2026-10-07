const express = require('express');
const router = express.Router();
const {
  getPatients,
  getPatientById,
  createPatient,
  updatePatient,
  deletePatient,
  restorePatient
} = require('../controllers/patientController');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

router.use(authenticateToken);

router.get('/', getPatients);
router.get('/:id', getPatientById);
router.post('/', createPatient);
router.put('/:id', updatePatient);

// Only Administrator can soft-delete a patient and all associated patient records
router.delete('/:id', requireAdmin, deletePatient);

// Only Administrator can restore a soft-deleted patient and associated patient records
router.post('/:id/restore', requireAdmin, restorePatient);

module.exports = router;
