import React, { useState, useEffect } from 'react';
import { X, Check, ArrowRight, ArrowLeft, Calendar as CalendarIcon, Clock, User, ShieldCheck, Sparkles, CheckCircle2, Phone, Mail, FileText, ChevronDown } from 'lucide-react';
import confetti from 'canvas-confetti';
import { SERVICES_DATA, DOCTORS_DATA } from '../data/clinicData';
import { getApiUrl } from '../config/api';

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialServiceId?: string;
  initialDoctorId?: string;
}

const CRM_SERVICES_LIST = [
  'General Dentistry',
  'General Checkup',
  'Teeth Cleaning',
  'Root Canal',
  'Dental Implant',
  'Braces & Orthodontics',
  'Teeth Whitening',
  'Scaling',
  'Extraction',
  'Crown & Bridge',
  'Denture',
  'Smile Design',
  'Emergency Consultation',
  'Other'
];

const BOOKING_FOR_OPTIONS = [
  'Self',
  'Son',
  'Wife',
  'Sister',
  'Brother',
  'Mother',
  'Father',
  'Other'
];

export const BookingModal: React.FC<BookingModalProps> = ({
  isOpen,
  onClose,
  initialServiceId = 'general',
  initialDoctorId = 'dr-aditi'
}) => {
  // Booking Mode: 'express' (1-page fast portal matching online.html) vs 'guided' (step-by-step specialist concierge)
  const [bookingMode, setBookingMode] = useState<'express' | 'guided'>('express');
  const [step, setStep] = useState(1);

  // Form Fields
  const [patientName, setPatientName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [selectedService, setSelectedService] = useState('General Checkup');
  const [otherService, setOtherService] = useState('');
  const [bookingFor, setBookingFor] = useState('Self');
  const [personName, setPersonName] = useState('');
  const [selectedDoctor, setSelectedDoctor] = useState(initialDoctorId);
  const [selectedDate, setSelectedDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });
  const [selectedTime, setSelectedTime] = useState('11:00 AM');
  const [notes, setNotes] = useState('');

  // UI States
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [confirmedBooking, setConfirmedBooking] = useState<{
    bookingCode: string;
    visualToken: string;
    serviceName: string;
    doctorName?: string;
    patientName: string;
    date: string;
    time: string;
  } | null>(null);
  const [calendarSaved, setCalendarSaved] = useState(false);

  // Sync initial service when opened
  useEffect(() => {
    if (initialServiceId) {
      const match = SERVICES_DATA.find(s => s.id === initialServiceId);
      if (match) {
        setSelectedService(match.title.replace('\n', ' '));
      }
    }
  }, [initialServiceId]);

  // Keyboard navigation & body scroll locking
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const timeSlots = [
    '09:30 AM', '10:30 AM', '11:00 AM',
    '02:00 PM', '03:30 PM', '04:45 PM',
    '06:00 PM', '07:15 PM'
  ];

  const handlePhoneChange = (val: string) => {
    let cleaned = val.replace(/\D/g, '');
    if (cleaned.length === 12 && cleaned.startsWith('91')) cleaned = cleaned.slice(2);
    else if (cleaned.length === 11 && cleaned.startsWith('0')) cleaned = cleaned.slice(1);
    setPhone(cleaned.slice(0, 10));
    if (formErrors.phone) {
      setFormErrors(prev => ({ ...prev, phone: '' }));
    }
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};
    if (!patientName.trim()) {
      errors.patientName = 'Please enter patient full name';
    }
    if (!phone.trim() || phone.length !== 10 || !/^[6-9]\d{9}$/.test(phone)) {
      errors.phone = 'Please enter a valid 10-digit Indian mobile number (e.g. 9876543210)';
    }
    if (email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.email = 'Please enter a valid email address';
    }
    if (selectedService === 'Other' && !otherService.trim()) {
      errors.otherService = 'Please specify requested dental service';
    }
    if (bookingFor === 'Other' && !personName.trim()) {
      errors.personName = 'Please specify person name';
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const submitOnlineBooking = async () => {
    if (!validateForm()) return;
    setIsSubmitting(true);
    setErrorMessage('');

    const currentDoc = DOCTORS_DATA.find(d => d.id === selectedDoctor);

    const payload = {
      patient_name: patientName.trim(),
      phone: phone.trim(),
      email: email.trim(),
      dental_service: selectedService,
      other_service: selectedService === 'Other' ? otherService.trim() : '',
      booking_for: bookingFor,
      person_name: bookingFor === 'Other' ? personName.trim() : '',
      preferred_date: selectedDate,
      preferred_time: selectedTime,
      doctor_name: currentDoc ? currentDoc.name : '',
      notes: notes.trim()
    };

    try {
      const response = await fetch(getApiUrl('/api/bookings/online'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await response.json();
      if (data.success && data.booking) {
        const b = data.booking;
        setConfirmedBooking({
          bookingCode: b.booking_code || `OB-${Math.floor(1000 + Math.random() * 9000)}`,
          visualToken: b.visual_token || 'T-01',
          serviceName: b.service_name || selectedService,
          doctorName: currentDoc ? currentDoc.name : undefined,
          patientName: b.patient_name || patientName,
          date: b.booking_date || selectedDate,
          time: b.booking_time || selectedTime
        });

        try {
          confetti({
            particleCount: 100,
            spread: 70,
            origin: { y: 0.6 },
            colors: ['#C2644F', '#779580', '#171717', '#E9E4DC', '#83A9D0']
          });
        } catch (e) {}
      } else {
        setErrorMessage(data.message || 'Could not complete online booking. Please try again.');
      }
    } catch (err) {
      console.error(err);
      setErrorMessage('Failed to connect to the clinic booking system. Please check your connection.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const currentDoctorObj = DOCTORS_DATA.find((d) => d.id === selectedDoctor) || DOCTORS_DATA[0];

  const handleDownloadCalendar = () => {
    if (!confirmedBooking) return;
    const title = `Dental Appointment: ${confirmedBooking.serviceName}`;
    const desc = `Appointment code: ${confirmedBooking.bookingCode}. Token: ${confirmedBooking.visualToken}. Location: Veloura Dental & Homoeopathy Studio, Science City, Ahmedabad.`;
    const icsContent = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Veloura Dental//Online Booking Portal//EN
BEGIN:VEVENT
SUMMARY:${title}
DESCRIPTION:${desc}
LOCATION:Science City, Ahmedabad
STATUS:CONFIRMED
END:VEVENT
END:VCALENDAR`;

    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const link = document.createElement('a');
    link.href = window.URL.createObjectURL(blob);
    link.setAttribute('download', `dental-appointment-${confirmedBooking.bookingCode}.ics`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setCalendarSaved(true);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="booking-portal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-md transition-opacity animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-2xl bg-[#F4F1EB] rounded-3xl border border-[#D7D2C9] shadow-modal overflow-hidden flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-[#D7D2C9] flex items-center justify-between bg-white shrink-0">
          <div className="flex items-center gap-2">
            <span className="font-serif italic text-2xl text-[#171717]">D/</span>
            <div>
              <div className="flex items-center gap-2">
                <h2 id="booking-portal-title" className="font-sans text-xs uppercase tracking-widest text-[#171717] font-bold">
                  Online Booking Portal
                </h2>
                <span className="inline-flex items-center gap-1 text-[10px] bg-[#C2644F]/10 text-[#C2644F] px-2 py-0.5 rounded-full font-semibold">
                  <ShieldCheck className="w-3 h-3" /> Live CRM Connected
                </span>
              </div>
              <p className="text-[11px] text-[#6F6B65] font-sans">
                Real-time queue reservation & instant token generation
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            aria-label="Close booking modal"
            className="w-8 h-8 rounded-full border border-[#D7D2C9] hover:bg-[#F4F1EB] flex items-center justify-center text-[#171717] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* View Mode Switcher (Visible before confirmation) */}
        {!confirmedBooking && (
          <div className="px-5 py-2.5 bg-[#E9E4DC]/50 border-b border-[#D7D2C9] flex items-center justify-between gap-3 text-xs shrink-0">
            <span className="text-[#6F6B65] font-medium hidden sm:inline">Booking Preference:</span>
            <div className="inline-flex p-1 bg-white rounded-full border border-[#D7D2C9] shadow-sm">
              <button
                type="button"
                onClick={() => setBookingMode('express')}
                className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${
                  bookingMode === 'express'
                    ? 'bg-[#171717] text-white shadow-sm'
                    : 'text-[#6F6B65] hover:text-[#171717]'
                }`}
              >
                Express Booking
              </button>
              <button
                type="button"
                onClick={() => setBookingMode('guided')}
                className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${
                  bookingMode === 'guided'
                    ? 'bg-[#171717] text-white shadow-sm'
                    : 'text-[#6F6B65] hover:text-[#171717]'
                }`}
              >
                Choose Specialist Doctor
              </button>
            </div>
          </div>
        )}

        {/* Modal Scrollable Body */}
        <div className="p-5 sm:p-7 overflow-y-auto flex-1">
          {errorMessage && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs flex items-center gap-2">
              <X className="w-4 h-4 shrink-0 text-red-500" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* 1. CONFIRMED SCREEN */}
          {confirmedBooking ? (
            <div className="text-center py-4 animate-in fade-in zoom-in-95 duration-300">
              <div className="w-16 h-16 rounded-full bg-[#C2644F] text-white flex items-center justify-center mx-auto mb-4 shadow-lg">
                <CheckCircle2 className="w-8 h-8" />
              </div>

              <span className="inline-block bg-[#e8f5e9] text-[#779580] px-3.5 py-1 rounded-full font-sans text-xs font-bold tracking-wider uppercase mb-2">
                Booking Registered in CRM
              </span>

              <h3 className="font-serif text-2xl sm:text-3xl text-[#171717] mb-1 font-normal">
                Appointment Successfully Reserved!
              </h3>

              <p className="font-sans text-xs sm:text-sm text-[#6F6B65] max-w-md mx-auto mb-5">
                Thank you, <strong className="text-[#171717]">{confirmedBooking.patientName}</strong>. Your appointment has been queued in our clinic management system.
              </p>

              {/* Reference & Queue Token Card */}
              <div className="bg-white rounded-2xl p-5 border border-[#D7D2C9] max-w-md mx-auto text-left space-y-3 mb-6 shadow-sm">
                <div className="flex justify-between items-center pb-2.5 border-b border-[#E9E4DC]">
                  <div>
                    <span className="text-[10px] uppercase font-bold tracking-wider text-[#6F6B65] block">Booking Code</span>
                    <span className="font-mono text-base font-bold text-[#171717]">{confirmedBooking.bookingCode}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] uppercase font-bold tracking-wider text-[#6F6B65] block">Queue Token</span>
                    <span className="font-mono text-lg font-black text-[#C2644F]">{confirmedBooking.visualToken}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs font-sans">
                  <div>
                    <span className="text-[#6F6B65] block text-[11px]">Service:</span>
                    <span className="font-semibold text-[#171717]">{confirmedBooking.serviceName}</span>
                  </div>
                  <div>
                    <span className="text-[#6F6B65] block text-[11px]">Preferred Slot:</span>
                    <span className="font-semibold text-[#171717]">{confirmedBooking.date} at {confirmedBooking.time}</span>
                  </div>
                  {confirmedBooking.doctorName && (
                    <div className="col-span-2">
                      <span className="text-[#6F6B65] block text-[11px]">Attending Specialist:</span>
                      <span className="font-semibold text-[#171717]">{confirmedBooking.doctorName}</span>
                    </div>
                  )}
                  <div className="col-span-2 pt-1 border-t border-[#E9E4DC]">
                    <span className="text-[#6F6B65] block text-[11px]">Status:</span>
                    <span className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md mt-0.5">
                      <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" /> Pending Staff Queue Approval
                    </span>
                  </div>
                </div>
              </div>

              {calendarSaved && (
                <p className="text-xs text-emerald-700 font-sans font-medium mb-4">
                  ✓ Calendar invitation saved to your device.
                </p>
              )}

              <div className="flex flex-wrap items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={handleDownloadCalendar}
                  className="bg-[#171717] text-white px-5 py-2.5 rounded-full font-sans text-xs font-semibold uppercase tracking-wider hover:bg-[#252525] transition-colors inline-flex items-center gap-2"
                >
                  <CalendarIcon className="w-3.5 h-3.5" />
                  <span>Add to Calendar</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setConfirmedBooking(null);
                    setPatientName('');
                    setPhone('');
                    setEmail('');
                    setNotes('');
                  }}
                  className="border border-[#D7D2C9] bg-white px-5 py-2.5 rounded-full font-sans text-xs font-semibold uppercase tracking-wider text-[#171717] hover:bg-[#F4F1EB] transition-colors"
                >
                  Book Another
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="bg-[#C2644F] text-white px-6 py-2.5 rounded-full font-sans text-xs font-semibold uppercase tracking-wider hover:bg-[#a85441] transition-colors"
                >
                  Done
                </button>
              </div>
            </div>
          ) : bookingMode === 'express' ? (
            /* 2. EXPRESS ONLINE BOOKING PORTAL */
            <form onSubmit={(e) => { e.preventDefault(); submitOnlineBooking(); }}>
              <div className="space-y-4">
                {/* Patient Name & Phone */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-sans text-xs font-bold text-[#171717] uppercase tracking-wider mb-1">
                      Patient Full Name <span className="text-[#C2644F]">*</span>
                    </label>
                    <div className="relative">
                      <User className="w-4 h-4 text-[#C2644F] absolute left-3.5 top-3.5" />
                      <input
                        type="text"
                        required
                        placeholder="Enter full name"
                        value={patientName}
                        onChange={(e) => {
                          setPatientName(e.target.value);
                          if (formErrors.patientName) setFormErrors({ ...formErrors, patientName: '' });
                        }}
                        className={`w-full pl-10 pr-4 py-2.5 rounded-xl border bg-white text-[#171717] text-sm focus:outline-none transition-colors ${
                          formErrors.patientName ? 'border-red-500 focus:border-red-500' : 'border-[#D7D2C9] focus:border-[#C2644F]'
                        }`}
                      />
                    </div>
                    {formErrors.patientName && <p className="text-red-600 text-xs mt-1">{formErrors.patientName}</p>}
                  </div>

                  <div>
                    <label className="block font-sans text-xs font-bold text-[#171717] uppercase tracking-wider mb-1">
                      Phone Number (10 digits) <span className="text-[#C2644F]">*</span>
                    </label>
                    <div className="relative">
                      <Phone className="w-4 h-4 text-[#C2644F] absolute left-3.5 top-3.5" />
                      <input
                        type="tel"
                        required
                        placeholder="e.g. 9876543210"
                        maxLength={10}
                        value={phone}
                        onChange={(e) => handlePhoneChange(e.target.value)}
                        className={`w-full pl-10 pr-4 py-2.5 rounded-xl border bg-white text-[#171717] text-sm focus:outline-none transition-colors ${
                          formErrors.phone ? 'border-red-500 focus:border-red-500' : 'border-[#D7D2C9] focus:border-[#C2644F]'
                        }`}
                      />
                    </div>
                    {formErrors.phone && <p className="text-red-600 text-xs mt-1">{formErrors.phone}</p>}
                  </div>
                </div>

                {/* Email Address */}
                <div>
                  <label className="block font-sans text-xs font-bold text-[#171717] uppercase tracking-wider mb-1">
                    Email Address (Optional)
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-[#C2644F] absolute left-3.5 top-3.5" />
                    <input
                      type="email"
                      placeholder="patient@example.com"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        if (formErrors.email) setFormErrors({ ...formErrors, email: '' });
                      }}
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#D7D2C9] bg-white text-[#171717] text-sm focus:outline-none focus:border-[#C2644F]"
                    />
                  </div>
                  {formErrors.email && <p className="text-red-600 text-xs mt-1">{formErrors.email}</p>}
                </div>

                {/* Dental Service & Booking For */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="booking-service-select" className="block font-sans text-xs font-bold text-[#171717] uppercase tracking-wider mb-1">
                      Dental Service <span className="text-[#C2644F]">*</span>
                    </label>
                    <select
                      id="booking-service-select"
                      value={selectedService}
                      onChange={(e) => setSelectedService(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-[#D7D2C9] bg-white text-[#171717] text-sm focus:outline-none focus:border-[#C2644F]"
                    >
                      {!CRM_SERVICES_LIST.includes(selectedService) && (
                        <option value={selectedService}>{selectedService}</option>
                      )}
                      {CRM_SERVICES_LIST.map((srv) => (
                        <option key={srv} value={srv}>{srv}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label htmlFor="booking-for-select" className="block font-sans text-xs font-bold text-[#171717] uppercase tracking-wider mb-1">
                      Booking For <span className="text-[#C2644F]">*</span>
                    </label>
                    <select
                      id="booking-for-select"
                      value={bookingFor}
                      onChange={(e) => setBookingFor(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-[#D7D2C9] bg-white text-[#171717] text-sm focus:outline-none focus:border-[#C2644F]"
                    >
                      {BOOKING_FOR_OPTIONS.map((opt) => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Conditional Other Service */}
                {selectedService === 'Other' && (
                  <div>
                    <label className="block font-sans text-xs font-bold text-[#171717] uppercase tracking-wider mb-1">
                      Describe Requested Service <span className="text-[#C2644F]">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Veneers consultation, Gum treatment..."
                      value={otherService}
                      onChange={(e) => setOtherService(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-[#D7D2C9] bg-white text-[#171717] text-sm focus:outline-none focus:border-[#C2644F]"
                    />
                  </div>
                )}

                {/* Conditional Other Person Name */}
                {bookingFor === 'Other' && (
                  <div>
                    <label className="block font-sans text-xs font-bold text-[#171717] uppercase tracking-wider mb-1">
                      Person Name <span className="text-[#C2644F]">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Full name of person attending"
                      value={personName}
                      onChange={(e) => setPersonName(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-[#D7D2C9] bg-white text-[#171717] text-sm focus:outline-none focus:border-[#C2644F]"
                    />
                  </div>
                )}

                {/* Preferred Date & Time Slot */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-sans text-xs font-bold text-[#171717] uppercase tracking-wider mb-1">
                      Preferred Date
                    </label>
                    <div className="relative">
                      <CalendarIcon className="w-4 h-4 text-[#C2644F] absolute left-3.5 top-3.5 pointer-events-none" />
                      <input
                        type="date"
                        min={new Date().toISOString().split('T')[0]}
                        value={selectedDate}
                        onChange={(e) => setSelectedDate(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#D7D2C9] bg-white text-[#171717] text-sm focus:outline-none focus:border-[#C2644F]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-sans text-xs font-bold text-[#171717] uppercase tracking-wider mb-1">
                      Preferred Time Slot
                    </label>
                    <select
                      value={selectedTime}
                      onChange={(e) => setSelectedTime(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-[#D7D2C9] bg-white text-[#171717] text-sm focus:outline-none focus:border-[#C2644F]"
                    >
                      {timeSlots.map((time) => (
                        <option key={time} value={time}>{time}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Additional Notes */}
                <div>
                  <label className="block font-sans text-xs font-bold text-[#171717] uppercase tracking-wider mb-1">
                    Notes or Symptoms (Optional)
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Describe any toothache, sensitivity, or dental history..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full px-4 py-2 rounded-xl border border-[#D7D2C9] bg-white text-[#171717] text-sm focus:outline-none focus:border-[#C2644F]"
                  />
                </div>

                {/* Express Submit Button */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3.5 px-6 rounded-full bg-[#C2644F] hover:bg-[#a85441] disabled:opacity-50 text-white font-sans text-sm font-semibold tracking-wide transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2 mt-4"
                >
                  {isSubmitting ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Registering in CRM Queue...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      <span>Confirm & Book Appointment</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          ) : (
            /* 3. GUIDED STEP-BY-STEP SPECIALIST CONCIERGE FLOW */
            <div>
              {/* Step Indicators */}
              <div className="flex items-center justify-between mb-5 border-b border-[#D7D2C9] pb-3 text-xs">
                <span className="font-sans font-bold text-[#171717]">
                  Step {step} of 4: {
                    step === 1 ? 'Select Treatment' :
                    step === 2 ? 'Choose Doctor' :
                    step === 3 ? 'Choose Date & Time' : 'Patient Information'
                  }
                </span>
                <span className="text-[#6F6B65] font-mono">{step}/4</span>
              </div>

              {step === 1 && (
                <div className="space-y-4">
                  <h3 className="font-serif text-xl font-normal text-[#171717]">
                    Which dental care treatment are you seeking?
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[300px] overflow-y-auto pr-1">
                    {SERVICES_DATA.map((srv) => {
                      const isSel = selectedService.toLowerCase().includes(srv.id.toLowerCase()) || selectedService === srv.title.replace('\n', ' ');
                      return (
                        <button
                          key={srv.id}
                          type="button"
                          onClick={() => setSelectedService(srv.title.replace('\n', ' '))}
                          className={`p-3.5 rounded-2xl border text-left transition-all ${
                            isSel
                              ? 'border-[#C2644F] bg-white shadow-md ring-1 ring-[#C2644F]'
                              : 'border-[#D7D2C9] bg-white/60 hover:bg-white'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-serif text-base text-[#171717] font-medium">{srv.title}</span>
                            {isSel && <Check className="w-4 h-4 text-[#C2644F]" />}
                          </div>
                          <p className="font-sans text-xs text-[#6F6B65] line-clamp-1">{srv.description}</p>
                        </button>
                      );
                    })}
                  </div>
                  <div className="flex justify-end pt-2">
                    <button
                      type="button"
                      onClick={() => setStep(2)}
                      className="px-5 py-2.5 rounded-full bg-[#171717] text-white text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5"
                    >
                      <span>Next: Specialist</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}

              {step === 2 && (
                <div className="space-y-4">
                  <h3 className="font-serif text-xl font-normal text-[#171717]">
                    Select your preferred dental specialist:
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {DOCTORS_DATA.map((doc) => (
                      <button
                        key={doc.id}
                        type="button"
                        onClick={() => setSelectedDoctor(doc.id)}
                        className={`p-3.5 rounded-2xl border text-left transition-all flex items-center gap-3 ${
                          selectedDoctor === doc.id
                            ? 'border-[#C2644F] bg-white shadow-md ring-1 ring-[#C2644F]'
                            : 'border-[#D7D2C9] bg-white/60 hover:bg-white'
                        }`}
                      >
                        <img src={doc.image} alt={doc.name} className="w-11 h-11 rounded-xl object-cover border border-[#D7D2C9]" />
                        <div className="flex-1 min-w-0">
                          <p className="font-serif text-base text-[#171717] font-medium truncate">{doc.name}</p>
                          <p className="font-sans text-xs text-[#6F6B65] truncate">{doc.specialty}</p>
                        </div>
                        {selectedDoctor === doc.id && <Check className="w-4 h-4 text-[#C2644F] shrink-0" />}
                      </button>
                    ))}
                  </div>
                  <div className="flex justify-between pt-2">
                    <button
                      type="button"
                      onClick={() => setStep(1)}
                      className="px-4 py-2 rounded-lg text-xs font-semibold text-[#6F6B65] hover:text-[#171717]"
                    >
                      Back
                    </button>
                    <button
                      type="button"
                      onClick={() => setStep(3)}
                      className="px-5 py-2.5 rounded-full bg-[#171717] text-white text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5"
                    >
                      <span>Next: Date & Time</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}

              {step === 3 && (
                <div className="space-y-4">
                  <h3 className="font-serif text-xl font-normal text-[#171717]">
                    Select preferred consultation slot:
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-[#171717] mb-1">Date</label>
                      <input
                        type="date"
                        min={new Date().toISOString().split('T')[0]}
                        value={selectedDate}
                        onChange={(e) => setSelectedDate(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-[#D7D2C9] bg-white text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-[#171717] mb-1">Time</label>
                      <select
                        value={selectedTime}
                        onChange={(e) => setSelectedTime(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-[#D7D2C9] bg-white text-sm"
                      >
                        {timeSlots.map((time) => (
                          <option key={time} value={time}>{time}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="flex justify-between pt-2">
                    <button
                      type="button"
                      onClick={() => setStep(2)}
                      className="px-4 py-2 rounded-lg text-xs font-semibold text-[#6F6B65] hover:text-[#171717]"
                    >
                      Back
                    </button>
                    <button
                      type="button"
                      onClick={() => setStep(4)}
                      className="px-5 py-2.5 rounded-full bg-[#171717] text-white text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5"
                    >
                      <span>Next: Patient Info</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}

              {step === 4 && (
                <form onSubmit={(e) => { e.preventDefault(); submitOnlineBooking(); }} className="space-y-4">
                  <h3 className="font-serif text-xl font-normal text-[#171717]">
                    Enter your contact details to reserve:
                  </h3>
                  <div>
                    <label className="block text-xs font-bold text-[#171717] mb-1">Full Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="Enter full name"
                      value={patientName}
                      onChange={(e) => setPatientName(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-[#D7D2C9] bg-white text-sm"
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-[#171717] mb-1">Phone Number (10 digits) *</label>
                      <input
                        type="tel"
                        required
                        placeholder="9876543210"
                        maxLength={10}
                        value={phone}
                        onChange={(e) => handlePhoneChange(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-[#D7D2C9] bg-white text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-[#171717] mb-1">Email (Optional)</label>
                      <input
                        type="email"
                        placeholder="patient@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-[#D7D2C9] bg-white text-sm"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[#171717] mb-1">Notes / Symptoms</label>
                    <textarea
                      rows={2}
                      placeholder="Optional symptoms or past dental notes..."
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      className="w-full px-3.5 py-2 rounded-xl border border-[#D7D2C9] bg-white text-sm"
                    />
                  </div>
                  <div className="flex justify-between pt-2">
                    <button
                      type="button"
                      onClick={() => setStep(3)}
                      className="px-4 py-2 rounded-lg text-xs font-semibold text-[#6F6B65] hover:text-[#171717]"
                    >
                      Back
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="px-6 py-2.5 rounded-full bg-[#C2644F] hover:bg-[#a85441] disabled:opacity-50 text-white text-xs font-bold uppercase tracking-wider flex items-center gap-2 shadow"
                    >
                      {isSubmitting ? (
                        <>
                          <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          <span>Queueing...</span>
                        </>
                      ) : (
                        <>
                          <Check className="w-4 h-4" />
                          <span>Confirm & Queue Token</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
