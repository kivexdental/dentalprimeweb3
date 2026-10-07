const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');
require('dotenv').config();

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error('❌ DATABASE_URL is not set.');
  process.exit(1);
}

const pool = new Pool({
  connectionString,
  ssl: { rejectUnauthorized: false },
  connectionTimeoutMillis: 15000
});

async function clearDataAndResetSequences() {
  console.log('🧹 1. Clearing patient and booking records from Neon PostgreSQL...');
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Truncate tables and restart identity
    await client.query('TRUNCATE TABLE history RESTART IDENTITY CASCADE');
    await client.query('TRUNCATE TABLE bookings RESTART IDENTITY CASCADE');
    await client.query('TRUNCATE TABLE patients RESTART IDENTITY CASCADE');
    
    // Also clear notifications related to old bookings if any
    await client.query('TRUNCATE TABLE notifications RESTART IDENTITY CASCADE');

    await client.query('COMMIT');
    console.log('   ✅ Neon PostgreSQL tables truncated and sequences reset to 1.');

    // Verify row counts
    const bRes = await client.query('SELECT COUNT(*) as count FROM bookings');
    const pRes = await client.query('SELECT COUNT(*) as count FROM patients');
    const hRes = await client.query('SELECT COUNT(*) as count FROM history');
    console.log(`   • bookings count: ${bRes.rows[0].count}`);
    console.log(`   • patients count: ${pRes.rows[0].count}`);
    console.log(`   • history  count: ${hRes.rows[0].count}`);

  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Failed to clear Neon DB:', err.message);
    throw err;
  } finally {
    client.release();
    await pool.end();
  }

  // 2. Clear local storage in data/crm_store.json
  console.log('\n🧹 2. Clearing local persistent storage (data/crm_store.json)...');
  const dataFilePath = path.join(__dirname, '..', 'data', 'crm_store.json');
  if (fs.existsSync(dataFilePath)) {
    const localData = JSON.parse(fs.readFileSync(dataFilePath, 'utf8'));
    localData.bookings = [];
    localData.patients = [];
    localData.history = [];
    localData.notifications = [];
    fs.writeFileSync(dataFilePath, JSON.stringify(localData, null, 2), 'utf8');
    console.log('   ✅ Local crm_store.json cleared (patients, bookings, history, notifications reset).');
  }

  console.log('\n✨ Data reset completed successfully!');
}

clearDataAndResetSequences().catch(e => {
  console.error(e);
  process.exit(1);
});
