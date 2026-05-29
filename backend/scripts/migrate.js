require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { pool } = require('../config/env');

async function migrate() {
  const schemaPath = path.join(__dirname, '..', 'migrations', 'schema.sql');
  const sql = fs.readFileSync(schemaPath, 'utf8');

  console.log('Applying migrations/schema.sql ...');
  try {
    await pool.query(sql);
    console.log('Schema applied successfully.');
  } catch (err) {
    console.error('Migration failed:', err.message);
    if (/permission denied to create extension|must be (owner|superuser)/i.test(err.message)) {
      console.error(
        '\nThe database user cannot create extensions. On Supabase, enable them once in\n' +
        'the dashboard (Database -> Extensions): "postgis" and "uuid-ossp", then re-run.'
      );
    }
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

migrate();
