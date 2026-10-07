const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');
require('dotenv').config();

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error('❌ Error: DATABASE_URL is not set in environment or .env');
  process.exit(1);
}

const pool = new Pool({
  connectionString,
  ssl: { rejectUnauthorized: false },
  connectionTimeoutMillis: 15000
});

async function migrate() {
  console.log('🚀 Starting Neon DB Migration...');
  const client = await pool.connect();

  try {
    // 1. Create Tables and Indexes
    console.log('1. Applying schema definitions...');
    const schemaSql = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
    await client.query(schemaSql);
    console.log('   ✅ Schema applied successfully.');

    // 2. Load Local Data from crm_store.json
    const dataFilePath = path.join(__dirname, '..', 'data', 'crm_store.json');
    if (!fs.existsSync(dataFilePath)) {
      console.log('   ⚠️ No crm_store.json found, skipping data import.');
      return;
    }

    const localData = JSON.parse(fs.readFileSync(dataFilePath, 'utf8'));

    // 3. Migrate Admins
    if (localData.admins && localData.admins.length > 0) {
      console.log(`2. Migrating admins (${localData.admins.length})...`);
      for (const a of localData.admins) {
        await client.query(
          `INSERT INTO admins (id, username, password_hash, name, email, role)
           VALUES ($1, $2, $3, $4, $5, $6)
           ON CONFLICT (username) DO UPDATE 
           SET password_hash = EXCLUDED.password_hash, name = EXCLUDED.name, email = EXCLUDED.email, role = EXCLUDED.role`,
          [a.id, a.username, a.password_hash, a.name, a.email, a.role || 'admin']
        );
      }
      await client.query(`SELECT setval(pg_get_serial_sequence('admins', 'id'), (SELECT COALESCE(MAX(id), 1) FROM admins))`);
    }

    // 4. Migrate Settings
    if (localData.settings && Object.keys(localData.settings).length > 0) {
      console.log(`3. Migrating clinic settings (${Object.keys(localData.settings).length})...`);
      for (const [key, value] of Object.entries(localData.settings)) {
        await client.query(
          `INSERT INTO settings (key, value)
           VALUES ($1, $2)
           ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value`,
          [key, typeof value === 'object' ? JSON.stringify(value) : String(value)]
        );
      }
    }

    // 5. Migrate Services
    if (localData.services && localData.services.length > 0) {
      console.log(`4. Migrating services (${localData.services.length})...`);
      for (const s of localData.services) {
        await client.query(
          `INSERT INTO services (id, name, duration_mins, price, category, description, status, is_deleted)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
           ON CONFLICT (id) DO UPDATE
           SET name = EXCLUDED.name, duration_mins = EXCLUDED.duration_mins, price = EXCLUDED.price,
               category = EXCLUDED.category, description = EXCLUDED.description, status = EXCLUDED.status, is_deleted = EXCLUDED.is_deleted`,
          [s.id, s.name, s.duration_mins || 30, s.price, s.category || '', s.description || '', s.status || 'Active', s.is_deleted || 0]
        );
      }
      await client.query(`SELECT setval(pg_get_serial_sequence('services', 'id'), (SELECT COALESCE(MAX(id), 1) FROM services))`);
    }

    // 6. Migrate Doctors
    if (localData.doctors && localData.doctors.length > 0) {
      console.log(`5. Migrating doctors (${localData.doctors.length})...`);
      for (const d of localData.doctors) {
        await client.query(
          `INSERT INTO doctors (id, name, qualification, specialization, experience, contact, email, available_days, available_time, photo_url, is_deleted)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
           ON CONFLICT (id) DO UPDATE
           SET name = EXCLUDED.name, qualification = EXCLUDED.qualification, specialization = EXCLUDED.specialization,
               experience = EXCLUDED.experience, contact = EXCLUDED.contact, email = EXCLUDED.email,
               available_days = EXCLUDED.available_days, available_time = EXCLUDED.available_time, photo_url = EXCLUDED.photo_url, is_deleted = EXCLUDED.is_deleted`,
          [d.id, d.name, d.qualification, d.specialization, d.experience, d.contact, d.email, d.available_days, d.available_time, d.photo_url, d.is_deleted || 0]
        );
      }
      await client.query(`SELECT setval(pg_get_serial_sequence('doctors', 'id'), (SELECT COALESCE(MAX(id), 1) FROM doctors))`);
    }

    // 7. Migrate Patients
    if (localData.patients && localData.patients.length > 0) {
      console.log(`6. Migrating patients (${localData.patients.length})...`);
      for (const p of localData.patients) {
        await client.query(
          `INSERT INTO patients (
            id, patient_code, name, phone, email, dob, gender, blood_group,
            address, medical_history, allergy, current_medication, emergency_contact,
            photo_url, outstanding_balance, is_deleted, deleted_at, deleted_by
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
          ON CONFLICT (patient_code) DO UPDATE
          SET name = EXCLUDED.name, phone = EXCLUDED.phone, email = EXCLUDED.email,
              dob = EXCLUDED.dob, gender = EXCLUDED.gender, blood_group = EXCLUDED.blood_group,
              address = EXCLUDED.address, medical_history = EXCLUDED.medical_history,
              allergy = EXCLUDED.allergy, current_medication = EXCLUDED.current_medication,
              emergency_contact = EXCLUDED.emergency_contact, photo_url = EXCLUDED.photo_url,
              outstanding_balance = EXCLUDED.outstanding_balance, is_deleted = EXCLUDED.is_deleted,
              deleted_at = EXCLUDED.deleted_at, deleted_by = EXCLUDED.deleted_by`,
          [
            p.id, p.patient_code, p.name, p.phone, p.email || '', p.dob || '', p.gender || 'Other',
            p.blood_group || 'O+', p.address || '', p.medical_history || 'None', p.allergy || 'None',
            p.current_medication || 'None', p.emergency_contact || 'Self', p.photo_url || '',
            p.outstanding_balance || 0.00, p.is_deleted || 0, p.deleted_at || null, p.deleted_by || null
          ]
        );
      }
      await client.query(`SELECT setval(pg_get_serial_sequence('patients', 'id'), (SELECT COALESCE(MAX(id), 1) FROM patients))`);
    }

    // 8. Migrate Bookings
    if (localData.bookings && localData.bookings.length > 0) {
      console.log(`7. Migrating bookings (${localData.bookings.length})...`);
      for (const b of localData.bookings) {
        await client.query(
          `INSERT INTO bookings (
            id, booking_code, visual_token, token_sequence, patient_name, phone, email,
            service_name, booking_for, relation, person_name, booking_type, booking_date,
            booking_time, status, doctor_id, doctor_name, final_amount, is_deleted, deleted_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20)
          ON CONFLICT (booking_code) DO UPDATE
          SET visual_token = EXCLUDED.visual_token, token_sequence = EXCLUDED.token_sequence,
              patient_name = EXCLUDED.patient_name, phone = EXCLUDED.phone, email = EXCLUDED.email,
              service_name = EXCLUDED.service_name, booking_for = EXCLUDED.booking_for,
              relation = EXCLUDED.relation, person_name = EXCLUDED.person_name,
              booking_type = EXCLUDED.booking_type, booking_date = EXCLUDED.booking_date,
              booking_time = EXCLUDED.booking_time, status = EXCLUDED.status,
              doctor_id = EXCLUDED.doctor_id, doctor_name = EXCLUDED.doctor_name,
              final_amount = EXCLUDED.final_amount, is_deleted = EXCLUDED.is_deleted,
              deleted_at = EXCLUDED.deleted_at`,
          [
            b.id, b.booking_code, b.visual_token, b.token_sequence || 1, b.patient_name, b.phone,
            b.email || '', b.service_name, b.booking_for || 'Self', b.relation || b.booking_for || 'Self',
            b.person_name || null, b.booking_type || 'Walk-In', b.booking_date, b.booking_time,
            b.status || 'Pending', b.doctor_id || null, b.doctor_name || null,
            b.final_amount || 0.00, b.is_deleted || 0, b.deleted_at || null
          ]
        );
      }
      await client.query(`SELECT setval(pg_get_serial_sequence('bookings', 'id'), (SELECT COALESCE(MAX(id), 1) FROM bookings))`);
    }

    // 9. Migrate History
    if (localData.history && localData.history.length > 0) {
      console.log(`8. Migrating appointment history (${localData.history.length})...`);
      for (const h of localData.history) {
        await client.query(
          `INSERT INTO history (
            id, booking_id, booking_code, visual_token, booking_type, patient_name, phone,
            email, service_name, doctor_name, appointment_date, appointment_time,
            status, treatment_description, treatment_performed, prescription, notes,
            amount, discount, final_amount, paid_amount, due_amount, payment_status,
            payment_mode, next_appointment_date, next_appointment_time, is_deleted
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27)
          ON CONFLICT (id) DO UPDATE
          SET booking_id = EXCLUDED.booking_id, booking_code = EXCLUDED.booking_code,
              visual_token = EXCLUDED.visual_token, booking_type = EXCLUDED.booking_type,
              patient_name = EXCLUDED.patient_name, phone = EXCLUDED.phone, email = EXCLUDED.email,
              service_name = EXCLUDED.service_name, doctor_name = EXCLUDED.doctor_name,
              appointment_date = EXCLUDED.appointment_date, appointment_time = EXCLUDED.appointment_time,
              status = EXCLUDED.status, treatment_description = EXCLUDED.treatment_description,
              treatment_performed = EXCLUDED.treatment_performed, prescription = EXCLUDED.prescription,
              notes = EXCLUDED.notes, amount = EXCLUDED.amount, discount = EXCLUDED.discount,
              final_amount = EXCLUDED.final_amount, paid_amount = EXCLUDED.paid_amount,
              due_amount = EXCLUDED.due_amount, payment_status = EXCLUDED.payment_status,
              payment_mode = EXCLUDED.payment_mode, next_appointment_date = EXCLUDED.next_appointment_date,
              next_appointment_time = EXCLUDED.next_appointment_time, is_deleted = EXCLUDED.is_deleted`,
          [
            h.id, h.booking_id || null, h.booking_code || null, h.visual_token || null,
            h.booking_type || 'Walk-In', h.patient_name, h.phone, h.email || '',
            h.service_name, h.doctor_name || '', h.appointment_date, h.appointment_time,
            h.status || 'Completed', h.treatment_description || '', h.treatment_performed || '',
            h.prescription || '', h.notes || '', h.amount || 0.00, h.discount || 0.00,
            h.final_amount || 0.00, h.paid_amount || 0.00, h.due_amount || 0.00,
            h.payment_status || 'Paid', h.payment_mode || 'Cash', h.next_appointment_date || null,
            h.next_appointment_time || null, h.is_deleted || 0
          ]
        );
      }
      await client.query(`SELECT setval(pg_get_serial_sequence('history', 'id'), (SELECT COALESCE(MAX(id), 1) FROM history))`);
    }

    // 10. Migrate Expenses
    if (localData.expenses && localData.expenses.length > 0) {
      console.log(`9. Migrating expenses (${localData.expenses.length})...`);
      for (const e of localData.expenses) {
        await client.query(
          `INSERT INTO expenses (id, title, category, amount, date, notes)
           VALUES ($1, $2, $3, $4, $5, $6)
           ON CONFLICT (id) DO NOTHING`,
          [e.id, e.title, e.category, e.amount, e.date, e.notes || '']
        );
      }
      await client.query(`SELECT setval(pg_get_serial_sequence('expenses', 'id'), (SELECT COALESCE(MAX(id), 1) FROM expenses))`);
    }

    // 11. Print Verification Summary
    console.log('\n📊 Migration Complete! Verification of Neon DB table row counts:');
    const tables = ['admins', 'settings', 'services', 'doctors', 'patients', 'bookings', 'history', 'expenses', 'notifications', 'logs'];
    for (const tbl of tables) {
      const res = await client.query(`SELECT COUNT(*) as count FROM ${tbl}`);
      console.log(`   • ${tbl.padEnd(15)} : ${res.rows[0].count} rows`);
    }

    console.log('\n🎉 ALL TABLES CREATED AND DATA MIGRATED TO NEON POSTGRESQL SUCCESSFULLY!');
  } catch (err) {
    console.error('❌ Migration failed:', err.message);
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

migrate().catch(e => {
  console.error(e);
  process.exit(1);
});
