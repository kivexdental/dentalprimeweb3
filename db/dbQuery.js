const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');
require('dotenv').config();

// Configuration
const CLOUDFLARE_ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID || 'f37d66673bc0e8db8445d76818afa267';
const D1_DATABASE_ID = process.env.D1_DATABASE_ID || '820fa8d0-9904-4d5a-bacd-f801b8a44ded';
const CLOUDFLARE_API_TOKEN = process.env.CLOUDFLARE_API_TOKEN;

// Local persistent disk storage file path
const DATA_DIR = path.join(__dirname, '..', 'data');
const DATA_FILE = path.join(DATA_DIR, 'crm_store.json');

// Initial default seed state
const initialDefaultData = {
  admins: [
    {
      id: 1,
      username: 'admin',
      password_hash: '$2a$10$e8w.xL2S.nZq6R2G7dY8e.5eG/vH3sYn/5qM8N3W5g5d5c5b5a5a5',
      name: 'Dr. Sarah Jenkins',
      email: 'admin@smilecare.com',
      role: 'admin'
    }
  ],
  settings: {
    clinic_name: 'Dental Prime',
    clinic_subtitle: 'Studio & Clinic',
    clinic_logo: 'assets/crm-logo.png',
    clinic_address: '104 Healthcare Boulevard, Suite 300, Medical District',
    phone: '+1 (555) 234-5678',
    email: 'contact@smilecaredental.com',
    token_prefix: 'A',
    default_followup_months: '6',
    currency: '₹',
    auto_sync: 'true',
    theme: 'light'
  },
  services: [
    { id: 1, name: 'Dental Cleaning & Scaling', duration_mins: 45, price: 1000.00, category: 'Cleaning', description: 'Ultrasonic scaling, stain removal, and polishing', status: 'Active' },
    { id: 2, name: 'Dental Filling (Composite)', duration_mins: 30, price: 1500.00, category: 'Filling', description: 'Tooth-colored composite resin restoration', status: 'Active' },
    { id: 3, name: 'Root Canal Treatment (RCT)', duration_mins: 60, price: 4000.00, category: 'RCT', description: 'Painless single/multi-sitting rotary endodontics', status: 'Active' },
    { id: 4, name: 'Dental Crown (Zirconia/PFM)', duration_mins: 45, price: 3500.00, category: 'Crown', description: 'High-strength aesthetic ceramic crown', status: 'Active' },
    { id: 5, name: 'Tooth Extraction', duration_mins: 45, price: 2000.00, category: 'Extraction', description: 'Atraumatic simple/surgical tooth removal', status: 'Active' },
    { id: 6, name: 'Comprehensive Dental Consultation', duration_mins: 30, price: 500.00, category: 'Consultation', description: 'Clinical oral examination, intraoral photos & treatment plan', status: 'Active' },
    { id: 7, name: 'Digital X-Ray (IOPA)', duration_mins: 15, price: 500.00, category: 'X-Ray', description: 'Instant high-resolution digital radiographic diagnosis', status: 'Active' },
    { id: 8, name: 'Dental Implant', duration_mins: 90, price: 25000.00, category: 'Implant', description: 'Grade-5 titanium implant fixture with abutment', status: 'Active' },
    { id: 9, name: 'In-Office Teeth Whitening', duration_mins: 45, price: 4500.00, category: 'Cosmetic', description: 'Laser accelerated dental whitening treatment', status: 'Active' }
  ],
  expenses: [],
  patients: [],
  doctors: [],
  bookings: [],
  history: [],
  notifications: [],
  logs: []
};

// Disk Persistence Helper Functions
function loadPersistentData() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (fs.existsSync(DATA_FILE)) {
      const content = fs.readFileSync(DATA_FILE, 'utf8');
      const parsed = JSON.parse(content);
      console.log('✔ Successfully loaded persistent database records from disk (data/crm_store.json)');
      return parsed;
    }
  } catch (err) {
    console.warn('⚠️ Could not load data/crm_store.json, creating new file:', err.message);
  }
  // If file doesn't exist, create and save initial default data
  savePersistentData(initialDefaultData);
  return initialDefaultData;
}

function savePersistentData(data) {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf8');
  } catch (err) {
    console.error('❌ Error saving data to crm_store.json:', err.message);
  }
}

// Active in-memory/disk-backed state
const memoryDb = loadPersistentData();

// Optional PostgreSQL Pool connection setup (only if explicit external DATABASE_URL provided)
let pool = null;
if (process.env.DATABASE_URL && !process.env.DATABASE_URL.includes('localhost:5432')) {
  pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
    max: 15,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000
  });
  console.log('🔌 PostgreSQL Pool configured for Neon Cloud Database');
}

function convertPgToSqlite(sql, params = []) {
  const newParams = [];
  const convertedSql = sql
    .replace(/\$(\d+)/g, (match, index) => {
      const paramIdx = parseInt(index, 10) - 1;
      newParams.push(params[paramIdx] !== undefined ? params[paramIdx] : null);
      return '?';
    })
    .replace(/\bILIKE\b/gi, 'LIKE')
    .replace(/\bCURRENT_DATE\b/gi, "DATE('now')");

  return {
    sql: convertedSql,
    params: newParams.length > 0 ? newParams : params.map(p => (p === undefined ? null : p))
  };
}

// Cloudflare D1 REST API Client
async function executeCloudflareD1Query(sql, params = []) {
  const token = process.env.CLOUDFLARE_API_TOKEN;
  if (!token) {
    throw new Error('CLOUDFLARE_API_TOKEN is not configured in .env');
  }

  const { sql: sqliteSql, params: cleanParams } = convertPgToSqlite(sql, params);

  const url = `https://api.cloudflare.com/client/v4/accounts/${CLOUDFLARE_ACCOUNT_ID}/d1/database/${D1_DATABASE_ID}/query`;
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      sql: sqliteSql,
      params: cleanParams
    })
  });

  const data = await response.json();
  if (!data.success) {
    const errorMsg = (data.errors && data.errors[0] && data.errors[0].message) || JSON.stringify(data.errors);
    throw new Error(`D1 API Error: ${errorMsg}`);
  }

  const queryResult = data.result && data.result[0] ? data.result[0] : { results: [], meta: {} };
  return {
    rows: queryResult.results || [],
    rowCount: queryResult.meta ? queryResult.meta.changes : (queryResult.results ? queryResult.results.length : 0),
    insertId: queryResult.meta ? queryResult.meta.last_row_id : null
  };
}

// Unified Query Execution Entrypoint
async function executeQuery(text, params = []) {
  // 1. If Cloudflare API Token is set, query Cloudflare D1
  if (process.env.CLOUDFLARE_API_TOKEN && process.env.CLOUDFLARE_API_TOKEN.trim() !== '') {
    try {
      const res = await executeCloudflareD1Query(text, params);
      return res;
    } catch (d1Err) {
      console.warn(`⚠️ Cloudflare D1 Query failed (${d1Err.message}), falling back to persistent local storage.`);
    }
  }

  // 2. If PostgreSQL is explicitly configured with a remote database
  if (pool) {
    try {
      const res = await pool.query(text, params);
      return res;
    } catch (pgErr) {
      console.warn(`⚠️ PostgreSQL query error (${pgErr.message}), query: "${text.slice(0, 80)}..."`);
      // Fall through to persistent store
    }
  }

  // 3. Persistent Local Storage Fallback (Reads & writes to data/crm_store.json)
  return handleMemoryFallback(text, params);
}

function handleMemoryFallback(sql, params) {
  const lowerSql = sql.toLowerCase().trim();
  let hasMutation = false;

  // 1. SELECT Queries
  if (lowerSql.startsWith('select')) {
    if (lowerSql.includes('max(token_sequence)')) {
      const bDate = params && params[0];
      const list = memoryDb.bookings || [];
      const seqs = list
        .filter(b => !bDate || b.booking_date === bDate)
        .map(b => parseInt(b.token_sequence, 10) || 0);
      const maxSeq = seqs.length > 0 ? Math.max(...seqs) : 0;
      return { rows: [{ max_seq: maxSeq }] };
    }
    if (lowerSql.includes('max(id)')) {
      let targetList = memoryDb.bookings || [];
      if (lowerSql.includes('from patients')) {
        targetList = memoryDb.patients || [];
      } else if (lowerSql.includes('from doctors')) {
        targetList = memoryDb.doctors || [];
      } else if (lowerSql.includes('from services')) {
        targetList = memoryDb.services || [];
      } else if (lowerSql.includes('from expenses')) {
        targetList = memoryDb.expenses || [];
      }
      const validIds = targetList.map(item => parseInt(item.id)).filter(id => !isNaN(id));
      const maxId = validIds.length > 0 ? Math.max(...validIds) : 0;
      return { rows: [{ max_id: maxId }] };
    }
    if (lowerSql.includes('count(*)') && lowerSql.includes('from bookings')) {
      if (params.length > 0) {
        const bDate = params[0];
        let filterType = null;
        if (lowerSql.includes("booking_type = 'walk-in'") || lowerSql.includes("booking_type='walk-in'")) {
          filterType = 'Walk-In';
        } else if (lowerSql.includes("booking_type = 'online'") || lowerSql.includes("booking_type='online'")) {
          filterType = 'Online';
        }
        
        const count = memoryDb.bookings.filter(b => 
          b.booking_date === bDate && (!filterType || b.booking_type === filterType)
        ).length;
        return { rows: [{ count }] };
      }
      return { rows: [{ count: memoryDb.bookings.length }] };
    }
    if (lowerSql.includes('from admins')) {
      if (params.length > 0) {
        const u = params[0].toLowerCase();
        const found = memoryDb.admins.filter(a => a.username.toLowerCase() === u);
        return { rows: found };
      }
      return { rows: memoryDb.admins };
    }
    if (lowerSql.includes('from settings')) {
      if (params.length > 0 && params[0] === 'token_prefix') {
        return { rows: [{ value: memoryDb.settings.token_prefix }] };
      }
      return { rows: Object.keys(memoryDb.settings).map(k => ({ key: k, value: memoryDb.settings[k] })) };
    }
    if (lowerSql.includes('from services')) {
      return { rows: memoryDb.services || [] };
    }
    if (lowerSql.includes('from expenses')) {
      return { rows: memoryDb.expenses || [] };
    }
    if (lowerSql.includes('from doctors')) {
      return { rows: memoryDb.doctors || [] };
    }
    if (lowerSql.includes('from patients')) {
      let pool = memoryDb.patients || [];
      if (lowerSql.includes('is_deleted = 1')) {
        pool = pool.filter(p => p.is_deleted === 1 || p.is_deleted === true || p.is_deleted === '1');
      } else if (!lowerSql.includes('is_deleted') || lowerSql.includes('is_deleted = 0') || lowerSql.includes('is_deleted is null')) {
        pool = pool.filter(p => !p.is_deleted || p.is_deleted === 0);
      }

      if (lowerSql.includes('where phone = $1') && params.length > 0) {
        return { rows: pool.filter(p => p.phone === params[0]) };
      }
      if (lowerSql.includes('where id = $1') && params.length > 0) {
        return { rows: pool.filter(p => p.id === parseInt(params[0])) };
      }
      if (lowerSql.includes('patient_code = $1') && params.length > 0) {
        return { rows: pool.filter(p => p.patient_code === params[0]) };
      }
      if (params.length > 0 && typeof params[0] === 'string' && params[0].startsWith('%')) {
        const q = params[0].replace(/%/g, '').toLowerCase();
        return {
          rows: pool.filter(p =>
            (p.name && p.name.toLowerCase().includes(q)) ||
            (p.phone && p.phone.includes(q)) ||
            (p.patient_code && p.patient_code.toLowerCase().includes(q)) ||
            (p.email && p.email.toLowerCase().includes(q))
          )
        };
      }
      return { rows: pool };
    }
    if (lowerSql.includes('from bookings')) {
      let pool = memoryDb.bookings || [];
      if (lowerSql.includes('is_deleted = 1')) {
        pool = pool.filter(b => b.is_deleted === 1 || b.is_deleted === true);
      } else if (!lowerSql.includes('is_deleted') || lowerSql.includes('is_deleted = 0') || lowerSql.includes('is_deleted is null')) {
        pool = pool.filter(b => !b.is_deleted || b.is_deleted === 0);
      }

      if (lowerSql.includes('where id = $1') && params.length > 0) {
        return { rows: pool.filter(b => b.id === parseInt(params[0])) };
      }
      if (lowerSql.includes('booking_code = $1') && params.length > 0) {
        return { rows: pool.filter(b => b.booking_code === params[0]) };
      }
      if (lowerSql.includes('visual_token = $2') && params.length >= 2) {
        return { rows: pool.filter(b => b.booking_date === params[0] && b.visual_token === params[1]) };
      }
      return { rows: pool };
    }
    if (lowerSql.includes('from history')) {
      let pool = memoryDb.history || [];
      if (lowerSql.includes('is_deleted = 1')) {
        pool = pool.filter(h => h.is_deleted === 1 || h.is_deleted === true);
      } else if (!lowerSql.includes('is_deleted') || lowerSql.includes('is_deleted = 0') || lowerSql.includes('is_deleted is null')) {
        pool = pool.filter(h => !h.is_deleted || h.is_deleted === 0);
      }

      if (lowerSql.includes('where id = $1') && params.length > 0) {
        return { rows: pool.filter(h => h.id === parseInt(params[0])) };
      }
      if (lowerSql.includes('phone = $1 or patient_name = $2') && params.length >= 2) {
        const phone = params[0];
        const name = params[1];
        return { rows: pool.filter(h => h.phone === phone || h.patient_name === name) };
      }
      return { rows: pool };
    }
    if (lowerSql.includes('from notifications')) {
      return { rows: memoryDb.notifications };
    }
    if (lowerSql.includes('from logs')) {
      return { rows: memoryDb.logs };
    }
  }

  // 2. INSERT Queries
  if (lowerSql.startsWith('insert into bookings')) {
    const validIds = memoryDb.bookings.map(b => parseInt(b.id)).filter(id => !isNaN(id));
    const maxId = validIds.length > 0 ? Math.max(...validIds) : 0;
    const isOnline = lowerSql.includes('online');
    const bookingType = isOnline ? 'Online' : 'Walk-In';

    const newBooking = {
      id: maxId + 1,
      booking_code: params[0],
      visual_token: params[1],
      token_sequence: params[2],
      patient_name: params[3],
      phone: params[4],
      email: params[5] || '',
      service_name: params[6],
      booking_for: params[7] || 'Self',
      relation: params[8] || 'Self',
      person_name: params[9] || '',
      booking_type: bookingType,
      booking_date: params[10] || new Date().toISOString().split('T')[0],
      booking_time: params[11] || '10:00:00',
      status: 'Pending',
      created_at: new Date().toISOString()
    };

    memoryDb.bookings.unshift(newBooking);
    savePersistentData(memoryDb);
    return { rows: [newBooking], rowCount: 1 };
  }

  if (lowerSql.startsWith('insert into history')) {
    const newHist = {
      id: memoryDb.history.length + 1,
      booking_id: params[0],
      booking_code: params[1],
      visual_token: params[2],
      booking_type: params[3],
      patient_name: params[4],
      phone: params[5],
      email: params[6] || '',
      service_name: params[7],
      doctor_name: params[8],
      appointment_date: params[9],
      appointment_time: params[10],
      completion_date: new Date().toISOString(),
      status: 'Completed',
      treatment_description: params[11] || '',
      treatment_performed: params[12] || '',
      prescription: params[13] || '',
      notes: params[14] || '',
      amount: parseFloat(params[15] || 0),
      discount: parseFloat(params[16] || 0),
      final_amount: parseFloat(params[17] || 0),
      payment_status: params[18] || 'Paid',
      payment_mode: params[19] || 'Cash',
      next_appointment_date: params[20] || null,
      next_appointment_time: params[21] || null,
      paid_amount: params[22] !== undefined ? parseFloat(params[22] || 0) : (params[18] === 'Pending' ? 0 : parseFloat(params[17] || 0)),
      due_amount: params[23] !== undefined ? parseFloat(params[23] || 0) : (params[18] === 'Pending' ? parseFloat(params[17] || 0) : 0),
      created_at: new Date().toISOString()
    };
    memoryDb.history.unshift(newHist);
    savePersistentData(memoryDb);
    return { rows: [newHist], rowCount: 1 };
  }

  if (lowerSql.startsWith('insert into logs')) {
    const log = {
      id: memoryDb.logs.length + 1,
      user_id: params[0] || 1,
      action: params[1] || 'LOG_ACTION',
      details: params[2] || '',
      created_at: new Date().toISOString()
    };
    memoryDb.logs.unshift(log);
    savePersistentData(memoryDb);
    return { rows: [log], rowCount: 1 };
  }

  if (lowerSql.startsWith('insert into patients')) {
    const validIds = memoryDb.patients.map(p => parseInt(p.id)).filter(id => !isNaN(id));
    const maxId = validIds.length > 0 ? Math.max(...validIds) : 0;
    const balance = params.length >= 14 ? parseFloat(params[13] || 0) : parseFloat(params[12] || 0);
    const newPatient = {
      id: maxId + 1,
      patient_code: params[0],
      name: params[1],
      phone: params[2],
      email: params[3] || '',
      dob: params[4] || '',
      gender: params[5] || 'Other',
      blood_group: params[6] || 'O+',
      address: params[7] || '',
      medical_history: params[8] || 'None',
      allergy: params[9] || 'None',
      current_medication: params[10] || 'None',
      emergency_contact: params[11] || '',
      photo_url: params.length >= 14 ? (params[12] || '') : '',
      outstanding_balance: isNaN(balance) ? 0.00 : balance,
      created_at: new Date().toISOString()
    };
    memoryDb.patients.unshift(newPatient);
    savePersistentData(memoryDb);
    return { rows: [newPatient], rowCount: 1 };
  }

  if (lowerSql.startsWith('insert into notifications')) {
    const notif = {
      id: memoryDb.notifications.length + 1,
      title: params[0],
      message: params[1],
      type: params[2] || 'info',
      is_read: false,
      created_at: new Date().toISOString()
    };
    memoryDb.notifications.unshift(notif);
    savePersistentData(memoryDb);
    return { rows: [notif], rowCount: 1 };
  }

  if (lowerSql.startsWith('insert into services')) {
    const maxId = (memoryDb.services || []).length > 0 ? Math.max(...memoryDb.services.map(s => s.id)) : 0;
    const newService = {
      id: maxId + 1,
      name: params[0],
      duration_mins: parseInt(params[1] || 30),
      price: parseFloat(params[2] || 0),
      description: params[3] || '',
      category: params[4] || 'General',
      status: params[5] || 'Active',
      created_at: new Date().toISOString()
    };
    if (!memoryDb.services) memoryDb.services = [];
    memoryDb.services.push(newService);
    savePersistentData(memoryDb);
    return { rows: [newService], rowCount: 1 };
  }

  if (lowerSql.startsWith('insert into expenses')) {
    const maxId = (memoryDb.expenses || []).length > 0 ? Math.max(...memoryDb.expenses.map(e => e.id)) : 0;
    const newExp = {
      id: maxId + 1,
      title: params[0],
      category: params[1] || 'General',
      amount: parseFloat(params[2] || 0),
      date: params[3] || new Date().toISOString().split('T')[0],
      notes: params[4] || '',
      created_at: new Date().toISOString()
    };
    if (!memoryDb.expenses) memoryDb.expenses = [];
    memoryDb.expenses.unshift(newExp);
    savePersistentData(memoryDb);
    return { rows: [newExp], rowCount: 1 };
  }

  if (lowerSql.startsWith('insert into admins')) {
    const maxId = (memoryDb.admins || []).length > 0 ? Math.max(...memoryDb.admins.map(a => a.id)) : 0;
    const newAdmin = {
      id: maxId + 1,
      username: params[0],
      password_hash: params[1],
      name: params[2],
      email: params[3] || '',
      role: params[4] || 'staff',
      created_at: new Date().toISOString()
    };
    if (!memoryDb.admins) memoryDb.admins = [];
    memoryDb.admins.push(newAdmin);
    savePersistentData(memoryDb);
    return { rows: [newAdmin], rowCount: 1 };
  }

  if (lowerSql.startsWith('insert into doctors')) {
    const maxId = (memoryDb.doctors || []).length > 0 ? Math.max(...memoryDb.doctors.map(d => d.id)) : 0;
    let newDoc;
    if (params.length >= 9) {
      newDoc = {
        id: maxId + 1,
        name: params[0],
        qualification: params[1] || 'BDS',
        specialization: params[2],
        experience: params[3] || '5+ Years',
        contact: params[4] || '',
        email: params[5] || '',
        available_days: params[6] || 'Mon - Fri',
        available_time: params[7] || '09:00 AM - 05:00 PM',
        photo_url: params[8] || 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=200&auto=format&fit=crop&q=80',
        created_at: new Date().toISOString()
      };
    } else {
      newDoc = {
        id: maxId + 1,
        name: params[0],
        qualification: 'BDS / MDS',
        specialization: params[1] || 'General Dentistry',
        experience: '5+ Years',
        contact: params[3] || '',
        email: params[2] || '',
        available_days: params[4] || 'Mon - Sat',
        available_time: params[5] || '09:00 - 18:00',
        photo_url: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=200&auto=format&fit=crop&q=80',
        created_at: new Date().toISOString()
      };
    }
    if (!memoryDb.doctors) memoryDb.doctors = [];
    memoryDb.doctors.push(newDoc);
    savePersistentData(memoryDb);
    return { rows: [newDoc], rowCount: 1 };
  }

  if (lowerSql.startsWith('insert into settings')) {
    const k = params[0];
    const v = params[1];
    memoryDb.settings[k] = v;
    savePersistentData(memoryDb);
    return { rows: [{ key: k, value: v }], rowCount: 1 };
  }

  // 3. UPDATE Queries
  if (lowerSql.startsWith('update services')) {
    const id = parseInt(params[params.length - 1]);
    const s = (memoryDb.services || []).find(item => item.id === id);
    if (s) {
      s.name = params[0];
      s.duration_mins = parseInt(params[1] || 30);
      s.price = parseFloat(params[2] || 0);
      s.description = params[3] || '';
      s.status = params[4] || s.status;
      savePersistentData(memoryDb);
      return { rows: [s], rowCount: 1 };
    }
  }

  if (lowerSql.startsWith('update bookings')) {
    if (lowerSql.includes('is_deleted = 1')) {
      const deletedAt = params[0] || new Date().toISOString();
      const phone = params[1];
      const patientName = params[2];
      let count = 0;
      (memoryDb.bookings || []).forEach(b => {
        if (b.phone === phone || (patientName && b.patient_name === patientName && b.phone === phone)) {
          b.is_deleted = 1;
          b.deleted_at = deletedAt;
          count++;
        }
      });
      savePersistentData(memoryDb);
      return { rowCount: count };
    }
    if (lowerSql.includes('is_deleted = 0')) {
      const phone = params[0];
      const patientName = params[1];
      let count = 0;
      (memoryDb.bookings || []).forEach(b => {
        if (b.phone === phone || (patientName && b.patient_name === patientName && b.phone === phone)) {
          b.is_deleted = 0;
          b.deleted_at = null;
          count++;
        }
      });
      savePersistentData(memoryDb);
      return { rowCount: count };
    }

    const id = parseInt(params[params.length - 1]);
    const b = memoryDb.bookings.find(item => item.id === id);
    if (b) {
      if (lowerSql.includes("status = 'pending'") || lowerSql.includes("status='pending'")) {
        b.status = 'Pending';
        if (lowerSql.includes("booking_type = 'walk-in'") || lowerSql.includes("booking_type='walk-in'")) {
          b.visual_token = params[0];
          b.token_sequence = params[1];
        }
      } else if (lowerSql.includes("status = 'approved'") || lowerSql.includes("status='approved'")) {
        b.status = 'Approved';
        if (lowerSql.includes("booking_type = 'walk-in'") || lowerSql.includes("booking_type='walk-in'")) {
          b.booking_type = 'Walk-In';
          b.visual_token = params[0];
          b.token_sequence = params[1];
        }
      } else if (lowerSql.includes("status = 'completed'") || lowerSql.includes("status='completed'")) {
        b.status = 'Completed';
      } else if (lowerSql.includes("awaiting payment")) {
        b.status = 'Awaiting Payment';
        b.doctor_name = params[0];
        b.treatment_performed = params[1] || '';
        b.notes = params[2] || '';
        b.teeth_treatments = params[3] || '';
        b.prescription_medicines = params[4] || '';
        b.handwritten_rx = params[5] || null;
        b.next_appointment_date = params[6] || null;
        b.next_appointment_time = params[7] || null;
        b.amount = parseFloat(params[8] || 0);
        if (params.length > 9) {
          b.discount = parseFloat(params[9] || 0);
        }
        if (params.length > 10) {
          b.final_amount = parseFloat(params[10] || 0);
        }
      } else if (params.length >= 8) {
        b.patient_name = params[0];
        b.phone = params[1];
        b.email = params[2];
        b.service_name = params[3];
        b.doctor_name = params[4];
        b.booking_date = params[5];
        b.booking_time = params[6];
        b.status = params[7];
      } else if (params.length === 3) {
        b.status = params[0];
        b.doctor_name = params[1];
      } else if (params.length === 2) {
        b.status = params[0];
      }
      savePersistentData(memoryDb);
      return { rows: [b], rowCount: 1 };
    }
  }

  if (lowerSql.startsWith('update history')) {
    if (lowerSql.includes('is_deleted = 1')) {
      const deletedAt = params[0] || new Date().toISOString();
      const phone = params[1];
      const patientName = params[2];
      let count = 0;
      (memoryDb.history || []).forEach(h => {
        if (h.phone === phone || (patientName && h.patient_name === patientName && h.phone === phone)) {
          h.is_deleted = 1;
          h.deleted_at = deletedAt;
          count++;
        }
      });
      savePersistentData(memoryDb);
      return { rowCount: count };
    }
    if (lowerSql.includes('is_deleted = 0')) {
      const phone = params[0];
      const patientName = params[1];
      let count = 0;
      (memoryDb.history || []).forEach(h => {
        if (h.phone === phone || (patientName && h.patient_name === patientName && h.phone === phone)) {
          h.is_deleted = 0;
          h.deleted_at = null;
          count++;
        }
      });
      savePersistentData(memoryDb);
      return { rowCount: count };
    }
  }

  if (lowerSql.startsWith('update patients')) {
    if (lowerSql.includes('is_deleted = 1')) {
      const deletedAt = params[0] || new Date().toISOString();
      const deletedBy = params[1] || 'admin';
      const id = parseInt(params[2]);
      const p = (memoryDb.patients || []).find(item => item.id === id);
      if (p) {
        p.is_deleted = 1;
        p.deleted_at = deletedAt;
        p.deleted_by = deletedBy;
        savePersistentData(memoryDb);
        return { rows: [p], rowCount: 1 };
      }
    } else if (lowerSql.includes('is_deleted = 0')) {
      const id = parseInt(params[0]);
      const p = (memoryDb.patients || []).find(item => item.id === id);
      if (p) {
        p.is_deleted = 0;
        p.deleted_at = null;
        p.deleted_by = null;
        savePersistentData(memoryDb);
        return { rows: [p], rowCount: 1 };
      }
    } else if (lowerSql.includes('outstanding_balance = outstanding_balance + $1')) {
      const addBal = parseFloat(params[0] || 0);
      const phone = params[1];
      const p = memoryDb.patients.find(item => item.phone === phone);
      if (p) {
        p.outstanding_balance = (parseFloat(p.outstanding_balance) || 0) + addBal;
        savePersistentData(memoryDb);
        return { rows: [p], rowCount: 1 };
      }
    } else {
      const id = parseInt(params[params.length - 1]);
      const p = memoryDb.patients.find(item => item.id === id);
      if (p) {
        p.name = params[0] !== undefined ? params[0] : p.name;
        p.phone = params[1] !== undefined ? params[1] : p.phone;
        p.email = params[2] !== undefined ? params[2] : p.email;
        p.dob = params[3] !== undefined ? params[3] : p.dob;
        p.gender = params[4] !== undefined ? params[4] : p.gender;
        p.blood_group = params[5] !== undefined ? params[5] : p.blood_group;
        p.address = params[6] !== undefined ? params[6] : p.address;
        p.medical_history = params[7] !== undefined ? params[7] : p.medical_history;
        p.allergy = params[8] !== undefined ? params[8] : p.allergy;
        p.current_medication = params[9] !== undefined ? params[9] : p.current_medication;
        p.emergency_contact = params[10] !== undefined ? params[10] : p.emergency_contact;
        p.outstanding_balance = parseFloat(params[11] !== undefined ? params[11] : p.outstanding_balance) || 0;
        savePersistentData(memoryDb);
        return { rows: [p], rowCount: 1 };
      }
    }
    return { rows: [] };
  }

  if (lowerSql.startsWith('update notifications')) {
    const id = parseInt(params[0]);
    const n = memoryDb.notifications.find(item => item.id === id);
    if (n) {
      n.is_read = true;
      savePersistentData(memoryDb);
      return { rows: [n], rowCount: 1 };
    }
  }

  // 4. DELETE Queries
  if (lowerSql.startsWith('delete from patients')) {
    const id = parseInt(params[0]);
    memoryDb.patients = memoryDb.patients.filter(p => p.id !== id);
    savePersistentData(memoryDb);
    return { rowCount: 1 };
  }
  if (lowerSql.startsWith('delete from bookings')) {
    const id = parseInt(params[0]);
    memoryDb.bookings = memoryDb.bookings.filter(b => b.id !== id);
    savePersistentData(memoryDb);
    return { rowCount: 1 };
  }
  if (lowerSql.startsWith('delete from services')) {
    const id = parseInt(params[0]);
    if (memoryDb.services) {
      memoryDb.services = memoryDb.services.filter(s => s.id !== id);
    }
    savePersistentData(memoryDb);
    return { rowCount: 1 };
  }
  if (lowerSql.startsWith('delete from expenses')) {
    const id = parseInt(params[0]);
    if (memoryDb.expenses) {
      memoryDb.expenses = memoryDb.expenses.filter(e => e.id !== id);
    }
    savePersistentData(memoryDb);
    return { rowCount: 1 };
  }
  if (lowerSql.startsWith('delete from doctors')) {
    const id = parseInt(params[0]);
    if (memoryDb.doctors) {
      memoryDb.doctors = memoryDb.doctors.filter(d => d.id !== id);
    }
    savePersistentData(memoryDb);
    return { rowCount: 1 };
  }
  if (lowerSql.startsWith('delete from admins')) {
    const id = parseInt(params[0]);
    if (memoryDb.admins) {
      memoryDb.admins = memoryDb.admins.filter(a => a.id !== id);
    }
    savePersistentData(memoryDb);
    return { rowCount: 1 };
  }
  if (lowerSql.startsWith('delete from history')) {
    const bookingId = parseInt(params[0]);
    memoryDb.history = memoryDb.history.filter(h => h.booking_id !== bookingId);
    savePersistentData(memoryDb);
    return { rowCount: 1 };
  }

  return { rows: [] };
}

module.exports = {
  query: executeQuery,
  memoryDb,
  savePersistentData,
  loadPersistentData
};
