const express = require('express');
const router = express.Router();
const {
  createWalkInBooking,
  createOnlineBooking,
  getBookings,
  updateBookingDetails,
  approveBooking,
  saveDoctorConsultation,
  completeAppointment,
  deleteBooking
} = require('../controllers/bookingController');
const { authenticateToken } = require('../middleware/auth');
const { bookingLimiter } = require('../middleware/rateLimiter');

// Public routes for Walk-In & Online Booking
router.post('/walk-in', bookingLimiter, createWalkInBooking);
router.post('/online', bookingLimiter, createOnlineBooking);

// Protected routes for Admin CRM Dashboard
router.get('/', authenticateToken, getBookings);
router.put('/:id', authenticateToken, updateBookingDetails);
router.put('/:id/approve', authenticateToken, approveBooking);
router.post('/:id/approve', authenticateToken, approveBooking);
router.put('/:id/consultation', authenticateToken, saveDoctorConsultation);
router.post('/:id/consultation', authenticateToken, saveDoctorConsultation);
router.post('/:id/complete', authenticateToken, completeAppointment);
router.put('/:id/complete', authenticateToken, completeAppointment);
router.delete('/:id', authenticateToken, deleteBooking);

module.exports = router;
