const fs = require('fs');
const path = require('path');
const { pool } = require('../config/db');

async function initializeDatabase() {
  const client = await pool.connect();
  try {
    console.log('--- Starting PostgreSQL Database Initialization ---');
    const schemaPath = path.join(__dirname, 'schema.sql');
    const seedPath = path.join(__dirname, 'seed.sql');

    const schemaSql = fs.readFileSync(schemaPath, 'utf8');
    const seedSql = fs.readFileSync(seedPath, 'utf8');

    await client.query(schemaSql);
    console.log('✔ Schema tables created successfully.');

    await client.query(seedSql);
    console.log('✔ Seed data populated successfully.');
    console.log('--- Database Initialization Complete ---');
  } catch (error) {
    console.error('❌ Error initializing database:', error.message);
  } finally {
    client.release();
    pool.end();
  }
}

if (require.main === module) {
  initializeDatabase();
}

module.exports = initializeDatabase;
