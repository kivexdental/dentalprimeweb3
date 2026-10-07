const db = require('../db/dbQuery');

/**
 * Get Patients list with soft-delete awareness and search filtering.
 * Query params:
 *   - search: string to search in name, phone, email, patient_code
 *   - status: 'active' (default) | 'deleted' | 'all'
 */
const getPatients = async (req, res, next) => {
  try {
    const { search, status = 'active' } = req.query;
    let list = [];
    let totalActive = 0;
    let totalDeleted = 0;

    try {
      let sql = 'SELECT * FROM patients WHERE 1=1';
      const params = [];

      if (status === 'deleted') {
        sql += ' AND (is_deleted = 1)';
      } else if (status === 'all') {
        // no is_deleted constraint
      } else {
        // Default: active only
        sql += ' AND (is_deleted = 0 OR is_deleted IS NULL)';
      }

      if (search) {
        params.push(`%${search}%`);
        sql += ` AND (name ILIKE $${params.length} OR phone ILIKE $${params.length} OR email ILIKE $${params.length} OR patient_code ILIKE $${params.length})`;
      }
      sql += ' ORDER BY id DESC';

      const result = await db.query(sql, params);
      list = result.rows || [];

      // Fetch count statistics for Admin view
      const allRes = await db.query('SELECT is_deleted FROM patients');
      const allPatients = allRes.rows || [];
      totalActive = allPatients.filter(p => !p.is_deleted || p.is_deleted === 0).length;
      totalDeleted = allPatients.filter(p => p.is_deleted === 1 || p.is_deleted === true).length;
    } catch (e) {
      const allMemoryPatients = db.memoryDb.patients || [];
      totalActive = allMemoryPatients.filter(p => !p.is_deleted || p.is_deleted === 0).length;
      totalDeleted = allMemoryPatients.filter(p => p.is_deleted === 1 || p.is_deleted === true).length;

      if (status === 'deleted') {
        list = allMemoryPatients.filter(p => p.is_deleted === 1 || p.is_deleted === true);
      } else if (status === 'all') {
        list = [...allMemoryPatients];
      } else {
        list = allMemoryPatients.filter(p => !p.is_deleted || p.is_deleted === 0);
      }

      if (search) {
        const q = search.toLowerCase();
        list = list.filter(p =>
          (p.name && p.name.toLowerCase().includes(q)) ||
          (p.phone && p.phone.includes(q)) ||
          (p.patient_code && p.patient_code.toLowerCase().includes(q)) ||
          (p.email && p.email.toLowerCase().includes(q))
        );
      }
    }

    return res.status(200).json({
      success: true,
      count: list.length,
      totalActive,
      totalDeleted,
      patients: list
    });
  } catch (error) {
    next(error);
  }
};

const getPatientById = async (req, res, next) => {
  try {
    const { id } = req.params;
    let patient = null;
    let visitHistory = [];

    try {
      const pRes = await db.query('SELECT * FROM patients WHERE id = $1', [id]);
      if (pRes.rows.length === 0) {
        return res.status(404).json({ success: false, message: 'Patient not found' });
      }
      patient = pRes.rows[0];

      const hRes = await db.query(
        'SELECT * FROM history WHERE (phone = $1 OR patient_name = $2) AND (is_deleted = 0 OR is_deleted IS NULL) ORDER BY appointment_date DESC',
        [patient.phone, patient.name]
      );
      visitHistory = hRes.rows || [];
    } catch (e) {
      patient = (db.memoryDb.patients || []).find(p => p.id === parseInt(id));
      if (!patient) return res.status(404).json({ success: false, message: 'Patient not found' });
      visitHistory = (db.memoryDb.history || []).filter(h =>
        (!h.is_deleted || h.is_deleted === 0) &&
        (h.phone === patient.phone || h.patient_name === patient.name)
      );
    }

    return res.status(200).json({
      success: true,
      patient,
      visitHistory
    });
  } catch (error) {
    next(error);
  }
};

const createPatient = async (req, res, next) => {
  try {
    const {
      name, phone, email, dob, gender, blood_group, address,
      medical_history, allergy, current_medication, emergency_contact,
      photo_url, outstanding_balance
    } = req.body;

    if (!name || !phone) {
      return res.status(400).json({ success: false, message: 'Name and Phone number are required.' });
    }

    const patientCode = `P${Math.floor(10000 + Math.random() * 90000)}`;

    let newPatient = null;
    try {
      const sql = `
        INSERT INTO patients (patient_code, name, phone, email, dob, gender, blood_group, address, medical_history, allergy, current_medication, emergency_contact, photo_url, outstanding_balance, is_deleted)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, 0)
        RETURNING *
      `;
      const queryRes = await db.query(sql, [
        patientCode, name, phone, email || '', dob || null, gender || 'Other', blood_group || 'O+',
        address || '', medical_history || 'None', allergy || 'None', current_medication || 'None',
        emergency_contact || '', photo_url || '', parseFloat(outstanding_balance || 0)
      ]);
      newPatient = queryRes && queryRes.rows && queryRes.rows.length > 0 ? queryRes.rows[0] : null;
    } catch (e) {
      newPatient = null;
    }

    if (!newPatient) {
      const maxId = (db.memoryDb.patients || []).length > 0 ? Math.max(...db.memoryDb.patients.map(p => parseInt(p.id) || 0)) : 0;
      newPatient = {
        id: maxId + 1,
        patient_code: patientCode,
        name,
        phone,
        email: email || '',
        dob: dob || '',
        gender: gender || 'Other',
        blood_group: blood_group || 'O+',
        address: address || '',
        medical_history: medical_history || 'None',
        allergy: allergy || 'None',
        current_medication: current_medication || 'None',
        emergency_contact: emergency_contact || '',
        photo_url: photo_url || '',
        outstanding_balance: parseFloat(outstanding_balance || 0),
        is_deleted: 0,
        deleted_at: null,
        deleted_by: null,
        created_at: new Date().toISOString()
      };
      if (!db.memoryDb.patients) db.memoryDb.patients = [];
      db.memoryDb.patients.unshift(newPatient);
      db.savePersistentData(db.memoryDb);
    }

    return res.status(201).json({ success: true, message: 'Patient registered successfully.', patient: newPatient });
  } catch (error) {
    next(error);
  }
};

const updatePatient = async (req, res, next) => {
  try {
    const { id } = req.params;
    const {
      name, phone, email, dob, gender, blood_group, address,
      medical_history, allergy, current_medication, emergency_contact,
      outstanding_balance
    } = req.body;

    let patient = null;
    try {
      const sql = `
        UPDATE patients SET name=$1, phone=$2, email=$3, dob=$4, gender=$5, blood_group=$6, address=$7,
        medical_history=$8, allergy=$9, current_medication=$10, emergency_contact=$11, outstanding_balance=$12
        WHERE id=$13 RETURNING *
      `;
      const queryRes = await db.query(sql, [
        name, phone, email, dob, gender, blood_group, address,
        medical_history, allergy, current_medication, emergency_contact,
        parseFloat(outstanding_balance || 0), id
      ]);
      patient = queryRes && queryRes.rows && queryRes.rows.length > 0 ? queryRes.rows[0] : null;
    } catch (e) {
      patient = null;
    }

    if (!patient) {
      patient = (db.memoryDb.patients || []).find(p => p.id === parseInt(id));
      if (patient) {
        Object.assign(patient, {
          name, phone, email, dob, gender, blood_group, address,
          medical_history, allergy, current_medication, emergency_contact,
          outstanding_balance: parseFloat(outstanding_balance || 0)
        });
        db.savePersistentData(db.memoryDb);
      }
    }

    if (!patient) {
      return res.status(404).json({ success: false, message: 'Patient not found' });
    }

    return res.status(200).json({ success: true, message: 'Patient updated successfully', patient });
  } catch (error) {
    next(error);
  }
};

/**
 * SOFT DELETE PATIENT AND ALL ASSOCIATED PATIENT DATA (ADMIN ONLY)
 * Sets is_deleted = 1, deleted_at = timestamp, deleted_by = admin username
 * Cascades to bookings and history records.
 */
const deletePatient = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Strict Admin Authorization Guard
    if (!req.user || req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Only Administrator users have the right to soft-delete patients and all patient data.'
      });
    }

    // 1. Locate Patient
    let patient = null;
    try {
      const findRes = await db.query('SELECT * FROM patients WHERE id = $1', [id]);
      if (findRes.rows && findRes.rows.length > 0) {
        patient = findRes.rows[0];
      }
    } catch (e) {
      // fallback
    }

    if (!patient) {
      patient = (db.memoryDb.patients || []).find(p => p.id === parseInt(id));
    }

    if (!patient) {
      return res.status(404).json({ success: false, message: 'Patient not found' });
    }

    if (patient.is_deleted === 1 || patient.is_deleted === true) {
      return res.status(400).json({ success: false, message: 'This patient record has already been soft-deleted.' });
    }

    const deletedAt = new Date().toISOString();
    const deletedBy = req.user.username || 'admin';
    const patientPhone = patient.phone;
    const patientName = patient.name;
    const patientCode = patient.patient_code;

    let affectedBookings = 0;
    let affectedHistory = 0;

    // 2. Perform Soft Delete in Remote Database / SQL
    try {
      // Soft-delete patient record
      await db.query(
        'UPDATE patients SET is_deleted = 1, deleted_at = $1, deleted_by = $2 WHERE id = $3',
        [deletedAt, deletedBy, id]
      );

      // Soft-delete all associated bookings
      const bRes = await db.query(
        'UPDATE bookings SET is_deleted = 1, deleted_at = $1 WHERE phone = $2 OR (patient_name = $3 AND phone = $2)',
        [deletedAt, patientPhone, patientName]
      );
      affectedBookings = (bRes && (bRes.rowCount || (bRes.rows && bRes.rows.length))) || 0;

      // Soft-delete all associated clinical history
      const hRes = await db.query(
        'UPDATE history SET is_deleted = 1, deleted_at = $1 WHERE phone = $2 OR (patient_name = $3 AND phone = $2)',
        [deletedAt, patientPhone, patientName]
      );
      affectedHistory = (hRes && (hRes.rowCount || (hRes.rows && hRes.rows.length))) || 0;

      // Record system audit log
      await db.query(
        'INSERT INTO logs (user_id, action, details) VALUES ($1, $2, $3)',
        [
          req.user.id || 1,
          'PATIENT_SOFT_DELETED',
          `Admin '${deletedBy}' soft-deleted patient ${patientCode} (${patientName}, ${patientPhone}) along with all associated bookings and clinical history.`
        ]
      );
    } catch (e) {
      console.warn('⚠️ Soft delete SQL execution caught fallback:', e.message);
    }

    // 3. Always apply to persistent local memory state (Ensures consistency)
    const memPatient = (db.memoryDb.patients || []).find(p => p.id === parseInt(id));
    if (memPatient) {
      memPatient.is_deleted = 1;
      memPatient.deleted_at = deletedAt;
      memPatient.deleted_by = deletedBy;
    }

    if (db.memoryDb.bookings) {
      db.memoryDb.bookings.forEach(b => {
        if (b.phone === patientPhone || (b.patient_name === patientName && b.phone === patientPhone)) {
          b.is_deleted = 1;
          b.deleted_at = deletedAt;
          affectedBookings++;
        }
      });
    }

    if (db.memoryDb.history) {
      db.memoryDb.history.forEach(h => {
        if (h.phone === patientPhone || (h.patient_name === patientName && h.phone === patientPhone)) {
          h.is_deleted = 1;
          h.deleted_at = deletedAt;
          affectedHistory++;
        }
      });
    }

    if (!db.memoryDb.logs) db.memoryDb.logs = [];
    db.memoryDb.logs.unshift({
      id: db.memoryDb.logs.length + 1,
      user_id: req.user.id || 1,
      action: 'PATIENT_SOFT_DELETED',
      details: `Admin '${deletedBy}' soft-deleted patient ${patientCode} (${patientName}, ${patientPhone}) along with all associated bookings and clinical history.`,
      created_at: deletedAt
    });

    db.savePersistentData(db.memoryDb);

    return res.status(200).json({
      success: true,
      message: `Patient ${patientCode} (${patientName}) and all associated records have been soft-deleted successfully.`,
      data: {
        patient_id: patient.id,
        patient_code: patientCode,
        patient_name: patientName,
        phone: patientPhone,
        deleted_at: deletedAt,
        deleted_by: deletedBy,
        affected_bookings: affectedBookings,
        affected_history: affectedHistory
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * RESTORE SOFT-DELETED PATIENT AND ASSOCIATED DATA (ADMIN ONLY)
 */
const restorePatient = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Strict Admin Authorization Guard
    if (!req.user || req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Only Administrator users have the right to restore soft-deleted patients.'
      });
    }

    // 1. Locate Patient
    let patient = null;
    try {
      const findRes = await db.query('SELECT * FROM patients WHERE id = $1', [id]);
      if (findRes.rows && findRes.rows.length > 0) {
        patient = findRes.rows[0];
      }
    } catch (e) {}

    if (!patient) {
      patient = (db.memoryDb.patients || []).find(p => p.id === parseInt(id));
    }

    if (!patient) {
      return res.status(404).json({ success: false, message: 'Patient not found' });
    }

    if (!patient.is_deleted || patient.is_deleted === 0) {
      return res.status(400).json({ success: false, message: 'This patient is already active and not deleted.' });
    }

    const restoredBy = req.user.username || 'admin';
    const patientPhone = patient.phone;
    const patientName = patient.name;
    const patientCode = patient.patient_code;

    // 2. Perform Restore in Remote Database / SQL
    try {
      await db.query(
        'UPDATE patients SET is_deleted = 0, deleted_at = NULL, deleted_by = NULL WHERE id = $1',
        [id]
      );
      await db.query(
        'UPDATE bookings SET is_deleted = 0, deleted_at = NULL WHERE phone = $1 OR (patient_name = $2 AND phone = $1)',
        [patientPhone, patientName]
      );
      await db.query(
        'UPDATE history SET is_deleted = 0, deleted_at = NULL WHERE phone = $1 OR (patient_name = $2 AND phone = $1)',
        [patientPhone, patientName]
      );
      await db.query(
        'INSERT INTO logs (user_id, action, details) VALUES ($1, $2, $3)',
        [
          req.user.id || 1,
          'PATIENT_RESTORED',
          `Admin '${restoredBy}' restored soft-deleted patient ${patientCode} (${patientName}) and all associated records.`
        ]
      );
    } catch (e) {
      console.warn('⚠️ Restore SQL execution caught fallback:', e.message);
    }

    // 3. Update persistent memory state
    const memPatient = (db.memoryDb.patients || []).find(p => p.id === parseInt(id));
    if (memPatient) {
      memPatient.is_deleted = 0;
      memPatient.deleted_at = null;
      memPatient.deleted_by = null;
    }

    if (db.memoryDb.bookings) {
      db.memoryDb.bookings.forEach(b => {
        if (b.phone === patientPhone || (b.patient_name === patientName && b.phone === patientPhone)) {
          b.is_deleted = 0;
          b.deleted_at = null;
        }
      });
    }

    if (db.memoryDb.history) {
      db.memoryDb.history.forEach(h => {
        if (h.phone === patientPhone || (h.patient_name === patientName && h.phone === patientPhone)) {
          h.is_deleted = 0;
          h.deleted_at = null;
        }
      });
    }

    if (!db.memoryDb.logs) db.memoryDb.logs = [];
    db.memoryDb.logs.unshift({
      id: db.memoryDb.logs.length + 1,
      user_id: req.user.id || 1,
      action: 'PATIENT_RESTORED',
      details: `Admin '${restoredBy}' restored soft-deleted patient ${patientCode} (${patientName}) and all associated records.`,
      created_at: new Date().toISOString()
    });

    db.savePersistentData(db.memoryDb);

    return res.status(200).json({
      success: true,
      message: `Patient ${patientCode} (${patientName}) and associated records have been restored successfully.`,
      data: {
        patient_id: patient.id,
        patient_code: patientCode,
        patient_name: patientName
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getPatients,
  getPatientById,
  createPatient,
  updatePatient,
  deletePatient,
  restorePatient
};
