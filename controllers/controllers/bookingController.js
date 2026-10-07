const db = require('../db/dbQuery');

// Helper to format date YYYY-MM-DD
function getTodayDate() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Helper to format time HH:MM:SS
function getCurrentTime() {
  const now = new Date();
  const hours = String(now.getHours()).padStart(2, '0');
  const mins = String(now.getMinutes()).padStart(2, '0');
  const secs = String(now.getSeconds()).padStart(2, '0');
  return `${hours}:${mins}:${secs}`;
}

// Auto-register patient if phone doesn't exist yet
async function autoRegisterPatient(name, phone, email) {
  const cleanPhone = String(phone || '').replace(/\D/g, '').slice(-10);
  try {
    const existing = await db.query('SELECT * FROM patients WHERE phone = $1', [cleanPhone]);
    if (existing.rows.length === 0) {
      const code = `P${Math.floor(10000 + Math.random() * 90000)}`;
      await db.query(
        'INSERT INTO patients (patient_code, name, phone, email) VALUES ($1, $2, $3, $4)',
        [code, name, cleanPhone, email || '']
      );
    }
  } catch (e) {
    const found = db.memoryDb.patients.find(p => p.phone === cleanPhone);
    if (!found) {
      const code = `P${Math.floor(10000 + Math.random() * 90000)}`;
      db.memoryDb.patients.unshift({
        id: db.memoryDb.patients.length + 1,
        patient_code: code,
        name,
        phone: cleanPhone,
        email: email || '',
        dob: '',
        gender: 'Other',
        blood_group: 'O+',
        address: '',
        medical_history: 'None',
        allergy: 'None',
        current_medication: 'None',
        emergency_contact: '',
        outstanding_balance: 0.00,
        created_at: new Date().toISOString()
      });
    }
  }
}

// Helper to generate visual token & booking code
async function generateBookingCodes(bookingDate) {
  let nextId = 1;
  let nextSeq = 1;
  let prefix = 'A';

  try {
    const settingRes = await db.query("SELECT value FROM settings WHERE key = $1", ['token_prefix']);
    if (settingRes.rows && settingRes.rows.length > 0 && settingRes.rows[0].value) {
      prefix = settingRes.rows[0].value;
    }
  } catch (e) {
    if (db.memoryDb.settings && db.memoryDb.settings.token_prefix) {
      prefix = db.memoryDb.settings.token_prefix;
    }
  }

  try {
    const maxIdRes = await db.query("SELECT MAX(id) as max_id FROM bookings");
    if (maxIdRes.rows && maxIdRes.rows[0] && maxIdRes.rows[0].max_id !== undefined && maxIdRes.rows[0].max_id !== null) {
      const parsed = parseInt(maxIdRes.rows[0].max_id);
      if (!isNaN(parsed) && parsed > 0) {
        nextId = parsed + 1;
      }
    }
  } catch (e) {
    if (db.memoryDb.bookings && db.memoryDb.bookings.length > 0) {
      const validIds = db.memoryDb.bookings.map(b => parseInt(b.id)).filter(id => !isNaN(id));
      if (validIds.length > 0) {
        nextId = Math.max(...validIds) + 1;
      }
    }
  }

  try {
    const todaySeqRes = await db.query(
      "SELECT COUNT(*) as count FROM bookings WHERE booking_date = $1 AND booking_type = 'Walk-In'",
      [bookingDate]
    );
    if (todaySeqRes.rows && todaySeqRes.rows[0] && todaySeqRes.rows[0].count !== undefined && todaySeqRes.rows[0].count !== null) {
      const parsedSeq = parseInt(todaySeqRes.rows[0].count);
      if (!isNaN(parsedSeq)) {
        nextSeq = parsedSeq + 1;
      }
    }
  } catch (e) {
    if (db.memoryDb.bookings) {
      const todayBookings = db.memoryDb.bookings.filter(b => b.booking_date === bookingDate && b.booking_type === 'Walk-In');
      nextSeq = todayBookings.length + 1;
    }
  }

  // Fail-safe against NaN
  if (isNaN(nextId) || nextId <= 0) {
    nextId = (db.memoryDb && db.memoryDb.bookings) ? db.memoryDb.bookings.length + 1 : 1;
  }
  if (isNaN(nextSeq) || nextSeq <= 0) {
    nextSeq = (db.memoryDb && db.memoryDb.bookings) ? db.memoryDb.bookings.filter(b => b.booking_date === bookingDate && b.booking_type === 'Walk-In').length + 1 : 1;
  }

  let bookingCode = `DB${String(nextId).padStart(6, '0')}`;
  try {
    let exists = await db.query('SELECT id FROM bookings WHERE booking_code = $1', [bookingCode]);
    while (exists.rows && exists.rows.length > 0) {
      nextId++;
      bookingCode = `DB${String(nextId).padStart(6, '0')}`;
      exists = await db.query('SELECT id FROM bookings WHERE booking_code = $1', [bookingCode]);
    }
  } catch (e) {}

  const visualToken = `${prefix}${String(nextSeq).padStart(3, '0')}`;

  return { bookingCode, visualToken, tokenSequence: nextSeq };
}

// Helper to generate online visual token & booking code
async function generateOnlineBookingCodes(bookingDate) {
  let nextId = 1;
  let nextSeq = 1;

  try {
    const maxIdRes = await db.query("SELECT MAX(id) as max_id FROM bookings");
    if (maxIdRes.rows && maxIdRes.rows[0] && maxIdRes.rows[0].max_id !== undefined && maxIdRes.rows[0].max_id !== null) {
      const parsed = parseInt(maxIdRes.rows[0].max_id);
      if (!isNaN(parsed) && parsed > 0) {
        nextId = parsed + 1;
      }
    }
  } catch (e) {
    if (db.memoryDb.bookings && db.memoryDb.bookings.length > 0) {
      const validIds = db.memoryDb.bookings.map(b => parseInt(b.id)).filter(id => !isNaN(id));
      if (validIds.length > 0) {
        nextId = Math.max(...validIds) + 1;
      }
    }
  }

  try {
    const todaySeqRes = await db.query(
      "SELECT COUNT(*) as count FROM bookings WHERE booking_date = $1 AND booking_type = 'Online'",
      [bookingDate]
    );
    if (todaySeqRes.rows && todaySeqRes.rows[0] && todaySeqRes.rows[0].count !== undefined && todaySeqRes.rows[0].count !== null) {
      const parsedSeq = parseInt(todaySeqRes.rows[0].count);
      if (!isNaN(parsedSeq)) {
        nextSeq = parsedSeq + 1;
      }
    }
  } catch (e) {
    if (db.memoryDb.bookings) {
      const todayBookings = db.memoryDb.bookings.filter(b => b.booking_date === bookingDate && b.booking_type === 'Online');
      nextSeq = todayBookings.length + 1;
    }
  }

  // Fail-safe against NaN
  if (isNaN(nextId) || nextId <= 0) {
    nextId = (db.memoryDb && db.memoryDb.bookings) ? db.memoryDb.bookings.length + 1 : 1;
  }
  if (isNaN(nextSeq) || nextSeq <= 0) {
    nextSeq = (db.memoryDb && db.memoryDb.bookings) ? db.memoryDb.bookings.filter(b => b.booking_date === bookingDate && b.booking_type === 'Online').length + 1 : 1;
  }

  let bookingCode = `DB${String(nextId).padStart(6, '0')}`;
  try {
    let exists = await db.query('SELECT id FROM bookings WHERE booking_code = $1', [bookingCode]);
    while (exists.rows && exists.rows.length > 0) {
      nextId++;
      bookingCode = `DB${String(nextId).padStart(6, '0')}`;
      exists = await db.query('SELECT id FROM bookings WHERE booking_code = $1', [bookingCode]);
    }
  } catch (e) {}

  const visualToken = `-`;

  return { bookingCode, visualToken, tokenSequence: 0 };
}

// 1. Walk-In Booking (Public)
const createWalkInBooking = async (req, res, next) => {
  try {
    const {
      patient_name,
      phone,
      email,
      dental_service,
      other_service,
      booking_for,
      relation,
      person_name,
      service_name
    } = req.body;

    const cleanPhone = String(phone || '').replace(/\D/g, '').slice(-10);
    if (!patient_name || !cleanPhone || !booking_for) {
      return res.status(400).json({
        success: false,
        message: 'Patient Name, 10-digit Phone Number, and Booking For relationship are required.'
      });
    }

    const todayDate = getTodayDate();
    const currentTime = getCurrentTime();

    const { bookingCode, visualToken, tokenSequence } = await generateBookingCodes(todayDate);

    const relValue = booking_for === 'Other' ? (person_name || relation || 'Other') : booking_for;
    const rawService = dental_service || service_name || 'General Checkup';
    const finalServiceName = rawService === 'Other' ? (other_service || 'Walk-in Custom Service') : rawService;

    await autoRegisterPatient(patient_name, cleanPhone, email || '');

    let newBooking;
    try {
      const insertSql = `
        INSERT INTO bookings (
          booking_code, visual_token, token_sequence, patient_name, phone, email,
          service_name, booking_for, relation, person_name, booking_type,
          booking_date, booking_time, status
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'Walk-In', $11, $12, 'Pending')
        RETURNING *
      `;
      const result = await db.query(insertSql, [
        bookingCode, visualToken, tokenSequence, patient_name, cleanPhone, email || '',
        finalServiceName, booking_for, relValue, person_name || null,
        todayDate, currentTime
      ]);
      newBooking = result.rows[0];
    } catch (e) {
      const maxId = db.memoryDb.bookings.length > 0 ? Math.max(...db.memoryDb.bookings.map(b => b.id)) : 0;
      newBooking = {
        id: maxId + 1,
        booking_code: bookingCode,
        visual_token: visualToken,
        token_sequence: tokenSequence,
        patient_name,
        phone: cleanPhone,
        email: email || '',
        service_name: finalServiceName,
        booking_for,
        relation: relValue,
        person_name: person_name || '',
        booking_type: 'Walk-In',
        booking_date: todayDate,
        booking_time: currentTime,
        status: 'Pending',
        created_at: new Date().toISOString()
      };
      db.memoryDb.bookings.unshift(newBooking);
    }

    try {
      await db.query(
        "INSERT INTO notifications (title, message, type) VALUES ($1, $2, 'info')",
        ['New Walk-In Booking', `New Walk-In queue booking (${visualToken}) for ${patient_name} (${phone}).`]
      );
    } catch (e) {
      db.memoryDb.notifications.unshift({
        id: db.memoryDb.notifications.length + 1,
        title: 'New Walk-In Booking',
        message: `New Walk-In queue booking (${visualToken}) for ${patient_name} (${phone}).`,
        type: 'info',
        is_read: false,
        created_at: new Date().toISOString()
      });
    }

    return res.status(201).json({
      success: true,
      message: `Walk-In booking submitted successfully! Token: ${visualToken}`,
      booking: newBooking
    });
  } catch (error) {
    next(error);
  }
};

// 2. Online Booking (Public)
const createOnlineBooking = async (req, res, next) => {
  try {
    const {
      patient_name,
      phone,
      email,
      dental_service,
      other_service,
      booking_for,
      relation,
      person_name,
      service_name
    } = req.body;

    const cleanPhone = String(phone || '').replace(/\D/g, '').slice(-10);
    if (!patient_name || !cleanPhone || !booking_for) {
      return res.status(400).json({
        success: false,
        message: 'Patient Name, 10-digit Phone Number, and Booking For fields are required.'
      });
    }

    const rawService = dental_service || service_name || 'General Checkup';
    const finalService = rawService === 'Other' ? (other_service || 'Other Dental Service') : rawService;
    const relValue = booking_for === 'Other' ? (person_name || relation || 'Other') : booking_for;

    const todayDate = getTodayDate();
    const currentTime = getCurrentTime();

    const { bookingCode, visualToken, tokenSequence } = await generateOnlineBookingCodes(todayDate);

    await autoRegisterPatient(patient_name, cleanPhone, email || '');

    let newBooking;
    try {
      const insertSql = `
        INSERT INTO bookings (
          booking_code, visual_token, token_sequence, patient_name, phone, email,
          service_name, booking_for, relation, person_name, booking_type,
          booking_date, booking_time, status
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'Online', $11, $12, 'Pending')
        RETURNING *
      `;
      const result = await db.query(insertSql, [
        bookingCode, visualToken, tokenSequence, patient_name, cleanPhone, email || '',
        finalService, booking_for, relValue, person_name || null,
        todayDate, currentTime
      ]);
      newBooking = result.rows[0];
    } catch (e) {
      const maxId = db.memoryDb.bookings.length > 0 ? Math.max(...db.memoryDb.bookings.map(b => b.id)) : 0;
      newBooking = {
        id: maxId + 1,
        booking_code: bookingCode,
        visual_token: visualToken,
        token_sequence: tokenSequence,
        patient_name,
        phone: cleanPhone,
        email: email || '',
        service_name: finalService,
        booking_for,
        relation: relValue,
        person_name: person_name || '',
        booking_type: 'Online',
        booking_date: todayDate,
        booking_time: currentTime,
        status: 'Pending',
        created_at: new Date().toISOString()
      };
      db.memoryDb.bookings.unshift(newBooking);
    }

    try {
      await db.query(
        "INSERT INTO notifications (title, message, type) VALUES ($1, $2, 'success')",
        ['New Online Booking', `Online booking confirmed for ${patient_name} (${finalService}).`]
      );
    } catch (e) {
      db.memoryDb.notifications.unshift({
        id: db.memoryDb.notifications.length + 1,
        title: 'New Online Booking',
        message: `Online booking confirmed for ${patient_name} (${finalService}).`,
        type: 'success',
        is_read: false,
        created_at: new Date().toISOString()
      });
    }

    return res.status(201).json({
      success: true,
      message: `Online appointment booked successfully! Please wait for admin approval to receive your walk-in token.`,
      booking: newBooking
    });
  } catch (error) {
    next(error);
  }
};

// 3. Get All Bookings
const getBookings = async (req, res, next) => {
  try {
    const { status, type, date, search } = req.query;

    let bookingsList = [];
    try {
      let queryText = 'SELECT * FROM bookings WHERE (is_deleted = 0 OR is_deleted IS NULL)';
      const params = [];

      if (status) {
        params.push(status);
        queryText += ` AND status = $${params.length}`;
      }
      if (type) {
        params.push(type);
        queryText += ` AND booking_type ILIKE $${params.length}`;
      }
      if (date) {
        params.push(date);
        queryText += ` AND booking_date = $${params.length}`;
      }
      if (search) {
        params.push(`%${search}%`);
        queryText += ` AND (patient_name ILIKE $${params.length} OR phone ILIKE $${params.length} OR booking_code ILIKE $${params.length} OR visual_token ILIKE $${params.length} OR service_name ILIKE $${params.length})`;
      }

      queryText += ' ORDER BY id DESC';

      const result = await db.query(queryText, params);
      bookingsList = result.rows;
    } catch (e) {
      bookingsList = [...(db.memoryDb.bookings || [])].filter(b => !b.is_deleted || b.is_deleted === 0);
    }

    // Secondary strict filter safeguard
    if (status) {
      bookingsList = bookingsList.filter(b => b.status && b.status.toLowerCase() === status.toLowerCase());
    }
    if (type) {
      const typeNorm = type.toLowerCase().replace('-', '').replace('_', '');
      bookingsList = bookingsList.filter(b => {
        if (!b.booking_type) return false;
        const bTypeNorm = b.booking_type.toLowerCase().replace('-', '').replace('_', '');
        return bTypeNorm === typeNorm;
      });
    }
    if (date) {
      bookingsList = bookingsList.filter(b => b.booking_date === date);
    }
    if (search) {
      const q = search.toLowerCase();
      bookingsList = bookingsList.filter(b =>
        (b.patient_name && b.patient_name.toLowerCase().includes(q)) ||
        (b.phone && b.phone.includes(q)) ||
        (b.booking_code && b.booking_code.toLowerCase().includes(q)) ||
        (b.visual_token && b.visual_token.toLowerCase().includes(q)) ||
        (b.service_name && b.service_name.toLowerCase().includes(q))
      );
    }

    bookingsList.sort((a, b) => b.id - a.id);

    return res.status(200).json({
      success: true,
      count: bookingsList.length,
      bookings: bookingsList
    });
  } catch (error) {
    next(error);
  }
};

// 4. Update Booking Details
const updateBookingDetails = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { patient_name, phone, email, service_name, doctor_name, booking_date, booking_time, status } = req.body;

    let booking;
    try {
      const sql = `
        UPDATE bookings SET patient_name=$1, phone=$2, email=$3, service_name=$4, doctor_name=$5, booking_date=$6, booking_time=$7, status=$8
        WHERE id=$9 RETURNING *
      `;
      const result = await db.query(sql, [patient_name, phone, email, service_name, doctor_name, booking_date, booking_time, status, id]);
      if (result.rows.length > 0) booking = result.rows[0];
    } catch (e) {
      booking = db.memoryDb.bookings.find(b => b.id === parseInt(id));
      if (booking) {
        Object.assign(booking, { patient_name, phone, email, service_name, doctor_name, booking_date, booking_time, status });
      }
    }

    return res.status(200).json({
      success: true,
      message: 'Booking details updated successfully.',
      booking
    });
  } catch (error) {
    next(error);
  }
};

// 5. Approve Booking Endpoint (Converts Online to Walk-In Token)
const approveBooking = async (req, res, next) => {
  try {
    const { id } = req.params;

    let booking;
    try {
      const selResult = await db.query("SELECT * FROM bookings WHERE id = $1", [id]);
      if (selResult.rows.length > 0) booking = selResult.rows[0];
    } catch (e) {
      booking = db.memoryDb.bookings.find(b => b.id === parseInt(id));
    }

    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found.' });
    }

    let updatedBooking = null;
    let newTokenAssigned = false;

    if (booking.booking_type === 'Online') {
      let bDate = booking.booking_date;
      if (bDate instanceof Date) {
         bDate = bDate.toISOString().split('T')[0];
      } else if (!bDate) {
         bDate = getTodayDate();
      }
      
      const { visualToken, tokenSequence } = await generateBookingCodes(bDate);
      try {
        const sql = "UPDATE bookings SET status = 'Pending', booking_type = 'Walk-In', visual_token = $1, token_sequence = $2 WHERE id = $3 RETURNING *";
        const result = await db.query(sql, [visualToken, tokenSequence, id]);
        if (result.rows.length > 0) updatedBooking = result.rows[0];
      } catch (e) {
        const memBooking = db.memoryDb.bookings.find(b => b.id === parseInt(id));
        if (memBooking) {
          memBooking.status = 'Pending';
          memBooking.booking_type = 'Walk-In';
          memBooking.visual_token = visualToken;
          memBooking.token_sequence = tokenSequence;
          updatedBooking = memBooking;
        }
      }
      newTokenAssigned = true;
    } else {
      try {
        const sql = "UPDATE bookings SET status = 'Approved' WHERE id = $1 RETURNING *";
        const result = await db.query(sql, [id]);
        if (result.rows.length > 0) updatedBooking = result.rows[0];
      } catch (e) {
        const memBooking = db.memoryDb.bookings.find(b => b.id === parseInt(id));
        if (memBooking) {
          memBooking.status = 'Approved';
          updatedBooking = memBooking;
        }
      }
    }

    if (updatedBooking) {
      booking = updatedBooking;
    }

    const message = newTokenAssigned 
      ? `Online Booking ${booking.booking_code} added to Walk-In section! Token assigned: ${booking.visual_token}`
      : `Walk-In Booking ${booking.booking_code} Approved and moved to Booking Queue.`;

    return res.status(200).json({
      success: true,
      message,
      booking
    });
  } catch (error) {
    next(error);
  }
};

// 5b. Doctor Consultation: Save teeth chart, treatments, prescription, follow-up and forward to Billing Desk
const saveDoctorConsultation = async (req, res, next) => {
  try {
    const { id } = req.params;
    const {
      doctor_name,
      treatment_performed,
      notes,
      clinical_notes,
      teeth_treatments,
      prescription,
      prescription_medicines,
      handwritten_rx,
      next_appointment_date,
      next_appointment_time,
      amount,
      discount,
      final_amount,
      discount_reason,
      next_appointment_dates
    } = req.body;

    let booking;
    try {
      const findRes = await db.query('SELECT * FROM bookings WHERE id = $1', [id]);
      if (findRes.rows.length === 0) {
        return res.status(404).json({ success: false, message: 'Booking not found.' });
      }
      booking = findRes.rows[0];
    } catch (e) {
      booking = db.memoryDb.bookings.find(b => b.id === parseInt(id));
      if (!booking) {
        return res.status(404).json({ success: false, message: 'Booking not found.' });
      }
    }

    const docName = doctor_name || booking.doctor_name || 'Dr. Alexander Wright';
    const treatmentsJson = typeof teeth_treatments === 'object' ? JSON.stringify(teeth_treatments) : (teeth_treatments || '');
    const medicinesJson = typeof prescription_medicines === 'object' ? JSON.stringify(prescription_medicines) : (prescription_medicines || '');
    const nextDatesJson = typeof next_appointment_dates === 'object' ? JSON.stringify(next_appointment_dates) : (next_appointment_dates || '');
    const notesContent = clinical_notes || notes || '';

    let calculatedAmount = 0;
    if (Array.isArray(teeth_treatments)) {
      calculatedAmount = teeth_treatments.reduce((sum, item) => sum + (parseFloat(item.price) || 0), 0);
    } else if (typeof teeth_treatments === 'string' && teeth_treatments.startsWith('[')) {
      try {
        const parsed = JSON.parse(teeth_treatments);
        calculatedAmount = parsed.reduce((sum, item) => sum + (parseFloat(item.price) || 0), 0);
      } catch (err) {}
    }

    const grossAmount = (amount !== undefined && !isNaN(parseFloat(amount))) ? parseFloat(amount) : calculatedAmount;
    const docDiscount = parseFloat(discount || 0);
    const netFinalAmount = (final_amount !== undefined && !isNaN(parseFloat(final_amount))) 
      ? parseFloat(final_amount) 
      : Math.max(0, grossAmount - docDiscount);
    const discReason = discount_reason || '';

    try {
      await db.query(`
        UPDATE bookings SET 
          status = 'Awaiting Payment',
          doctor_name = $1,
          treatment_performed = $2,
          notes = $3,
          teeth_treatments = $4,
          prescription_medicines = $5,
          handwritten_rx = $6,
          next_appointment_date = $7,
          next_appointment_time = $8,
          amount = $9,
          discount = $10,
          final_amount = $11
        WHERE id = $12
      `, [
        docName, treatment_performed || '', notesContent, treatmentsJson,
        medicinesJson, handwritten_rx || null, next_appointment_date || null,
        next_appointment_time || null, grossAmount, docDiscount, netFinalAmount, id
      ]);

      await db.query("INSERT INTO notifications (title, message, type) VALUES ($1, $2, 'info')", [
        'Consultation Complete - Sent to Billing',
        `Doctor completed notes for ${booking.patient_name} (Token ${booking.visual_token}). Net Amount: ₹${netFinalAmount.toFixed(2)}. Forwarded to Billing Desk.`
      ]);
    } catch (e) {
      booking.status = 'Awaiting Payment';
      booking.doctor_name = docName;
      booking.treatment_performed = treatment_performed || '';
      booking.notes = notesContent;
      booking.teeth_treatments = treatmentsJson;
      booking.prescription_medicines = medicinesJson;
      booking.handwritten_rx = handwritten_rx || null;
      booking.next_appointment_date = next_appointment_date || null;
      booking.next_appointment_time = next_appointment_time || null;
      booking.next_appointment_dates = nextDatesJson;
      booking.amount = grossAmount;
      booking.discount = docDiscount;
      booking.final_amount = netFinalAmount;
      booking.discount_reason = discReason;

      if (!db.memoryDb.notifications) db.memoryDb.notifications = [];
      db.memoryDb.notifications.unshift({
        id: db.memoryDb.notifications.length + 1,
        title: 'Consultation Complete - Sent to Billing',
        message: `Doctor completed notes for ${booking.patient_name} (Token ${booking.visual_token}). Net Amount: ₹${netFinalAmount.toFixed(2)}. Forwarded to Billing Desk.`,
        type: 'info',
        is_read: false,
        created_at: new Date().toISOString()
      });
    }

    return res.status(200).json({
      success: true,
      message: `Consultation saved! Patient ${booking.patient_name} (Token ${booking.visual_token}) has been forwarded to the Payment & Billing Desk.`,
      booking
    });
  } catch (error) {
    next(error);
  }
};

// 6. Complete Appointment Workflow: Save Treatment Details & Archive to History
const completeAppointment = async (req, res, next) => {
  try {
    const { id } = req.params;
    const {
      treatment_description,
      treatment_performed,
      doctor_name,
      amount,
      discount,
      final_amount,
      payment_status,
      payment_mode,
      transaction_ref,
      reference_no,
      prescription,
      prescription_medicines,
      handwritten_rx,
      teeth_treatments,
      additional_items,
      notes,
      next_appointment_date,
      next_appointment_time
    } = req.body;

    let booking;
    try {
      const findRes = await db.query('SELECT * FROM bookings WHERE id = $1', [id]);
      if (findRes.rows.length === 0) {
        return res.status(404).json({ success: false, message: 'Booking not found.' });
      }
      booking = findRes.rows[0];
    } catch (e) {
      booking = db.memoryDb.bookings.find(b => b.id === parseInt(id));
      if (!booking) {
        return res.status(404).json({ success: false, message: 'Booking not found.' });
      }
    }

    if (booking.status === 'Completed') {
      return res.status(400).json({ success: false, message: 'This appointment has already been completed.' });
    }

    const amt = parseFloat(amount || 0);
    const disc = parseFloat(discount || 0);
    const finalAmt = parseFloat(final_amount || (amt - disc));
    const payStatus = payment_status || 'Paid';
    const payMode = payment_mode || 'Cash';
    const docName = doctor_name || booking.doctor_name || 'Dr. Alexander Wright';

    // Calculate paid amount and remaining due
    let paidAmt = finalAmt;
    let dueAmt = 0;
    if (payStatus === 'Partial') {
      const parsedPaid = parseFloat(req.body.paid_amount);
      paidAmt = (!isNaN(parsedPaid) && parsedPaid >= 0) ? parsedPaid : finalAmt;
      dueAmt = Math.max(0, finalAmt - paidAmt);
    } else if (payStatus === 'Pending') {
      paidAmt = 0;
      dueAmt = finalAmt;
    } else {
      paidAmt = finalAmt;
      dueAmt = 0;
    }

    try {
      await db.query('UPDATE bookings SET status = $1, doctor_name = $2 WHERE id = $3', ['Completed', docName, id]);
    } catch (e) {
      booking.status = 'Completed';
      booking.doctor_name = docName;
    }

    const actualPatientName = (booking.booking_for && booking.booking_for !== 'Self' && booking.person_name) ? booking.person_name : booking.patient_name;
    const treatmentsJson = typeof teeth_treatments === 'object' ? JSON.stringify(teeth_treatments) : (teeth_treatments || '');
    const additionalItemsJson = typeof additional_items === 'object' ? JSON.stringify(additional_items) : (additional_items || '');
    const medicinesJson = typeof prescription_medicines === 'object' ? JSON.stringify(prescription_medicines) : (prescription_medicines || '');

    // Formulate notification message
    let notifTitle = 'Payment & Consultation Completed';
    let notifMsg = `₹${finalAmt} received via ${payMode} for ${actualPatientName} (Token ${booking.visual_token}). Next visit: ${next_appointment_date || '6 months'}`;
    if (payStatus === 'Partial') {
      notifTitle = 'Partial Payment Recorded';
      notifMsg = `Partial payment of ₹${paidAmt.toFixed(2)} received via ${payMode} for ${actualPatientName} (Remaining Due: ₹${dueAmt.toFixed(2)} added to Patient Ledger). Token ${booking.visual_token}.`;
    } else if (payStatus === 'Pending') {
      notifTitle = 'Appointment Completed (Payment Pending)';
      notifMsg = `Appointment completed for ${actualPatientName} with full payment pending (₹${finalAmt.toFixed(2)} added to Patient Ledger). Token ${booking.visual_token}.`;
    }

    try {
      // Auto-register patient to the Patients Directory if they don't exist yet
      await autoRegisterPatient(actualPatientName, booking.phone, booking.email);

      // If partial or pending payment, update patient outstanding balance
      if (dueAmt > 0) {
        await db.query('UPDATE patients SET outstanding_balance = outstanding_balance + $1 WHERE phone = $2', [dueAmt, booking.phone]);
      }

      await db.query(`
        INSERT INTO history (
          booking_id, booking_code, visual_token, booking_type, patient_name, phone, email,
          service_name, doctor_name, appointment_date, appointment_time,
          status, treatment_description, treatment_performed, prescription, notes,
          amount, discount, final_amount, payment_status, payment_mode, next_appointment_date, next_appointment_time,
          paid_amount, due_amount
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 'Completed', $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24)
      `, [
        booking.id, booking.booking_code, booking.visual_token, booking.booking_type,
        actualPatientName, booking.phone, booking.email || '', booking.service_name,
        docName, booking.booking_date, booking.booking_time,
        treatment_description || '', treatment_performed || '', prescription || '', notes || '',
        amt, disc, finalAmt, payStatus, payMode, next_appointment_date || null, next_appointment_time || null,
        paidAmt, dueAmt
      ]);

      await db.query("INSERT INTO notifications (title, message, type) VALUES ($1, $2, 'success')", [
        notifTitle,
        notifMsg
      ]);
    } catch (e) {
      if (!db.memoryDb.history) db.memoryDb.history = [];
      const newHistoryItem = {
        id: db.memoryDb.history.length + 1,
        booking_id: booking.id,
        booking_code: booking.booking_code,
        visual_token: booking.visual_token,
        booking_type: booking.booking_type,
        patient_name: actualPatientName,
        phone: booking.phone,
        email: booking.email || '',
        service_name: booking.service_name,
        doctor_name: docName,
        appointment_date: booking.booking_date,
        appointment_time: booking.booking_time,
        completion_date: new Date().toISOString(),
        status: 'Completed',
        treatment_description: treatment_description || '',
        treatment_performed: treatment_performed || '',
        prescription: prescription || '',
        prescription_medicines: medicinesJson,
        handwritten_rx: handwritten_rx || null,
        teeth_treatments: treatmentsJson,
        additional_items: additionalItemsJson,
        notes: notes || '',
        amount: amt,
        discount: disc,
        final_amount: finalAmt,
        paid_amount: paidAmt,
        due_amount: dueAmt,
        payment_status: payStatus,
        payment_mode: payMode,
        transaction_ref: transaction_ref || reference_no || '',
        reference_no: transaction_ref || reference_no || '',
        next_appointment_date: next_appointment_date || null,
        next_appointment_time: next_appointment_time || null,
        created_at: new Date().toISOString()
      };
      booking.transaction_ref = transaction_ref || reference_no || '';
      booking.reference_no = transaction_ref || reference_no || '';
      db.memoryDb.history.unshift(newHistoryItem);

      // Update patient outstanding balance if Partial or Pending
      if (dueAmt > 0) {
        const p = db.memoryDb.patients.find(pt => pt.phone === booking.phone);
        if (p) {
          p.outstanding_balance = (parseFloat(p.outstanding_balance || 0) + dueAmt).toFixed(2);
        }
      }

      if (!db.memoryDb.notifications) db.memoryDb.notifications = [];
      db.memoryDb.notifications.unshift({
        id: db.memoryDb.notifications.length + 1,
        title: notifTitle,
        message: notifMsg,
        type: payStatus === 'Pending' ? 'warning' : 'success',
        is_read: false,
        created_at: new Date().toISOString()
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Treatment completed successfully and saved to Appointment History & Finance records.',
      booking
    });
  } catch (error) {
    next(error);
  }
};

// 7. Delete Booking (Unified Deletion with Audit Logging)
const deleteBooking = async (req, res, next) => {
  try {
    const { id } = req.params;

    let bookingInfo = '';
    try {
      const findRes = await db.query('SELECT * FROM bookings WHERE id = $1', [id]);
      if (findRes.rows.length > 0) {
        const b = findRes.rows[0];
        bookingInfo = `Code: ${b.booking_code}, Token: ${b.visual_token}, Patient: ${b.patient_name}`;
      }
    } catch (e) {
      const b = db.memoryDb.bookings.find(item => item.id === parseInt(id));
      if (b) bookingInfo = `Code: ${b.booking_code}, Token: ${b.visual_token}, Patient: ${b.patient_name}`;
    }

    try {
      await db.query('DELETE FROM history WHERE booking_id = $1', [id]);
      await db.query('DELETE FROM bookings WHERE id = $1', [id]);
      await db.query("INSERT INTO logs (action, details) VALUES ($1, $2)", ['DELETE_BOOKING', `Deleted booking ID ${id} (${bookingInfo})`]);
    } catch (e) {
      db.memoryDb.history = db.memoryDb.history.filter(h => h.booking_id !== parseInt(id));
      db.memoryDb.bookings = db.memoryDb.bookings.filter(b => b.id !== parseInt(id));
      db.memoryDb.logs.unshift({
        id: db.memoryDb.logs.length + 1,
        user_id: 1,
        action: 'DELETE_BOOKING',
        details: `Deleted booking ID ${id} (${bookingInfo})`,
        created_at: new Date().toISOString()
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Booking record deleted successfully.'
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createWalkInBooking,
  createOnlineBooking,
  getBookings,
  updateBookingDetails,
  approveBooking,
  saveDoctorConsultation,
  completeAppointment,
  deleteBooking
};
