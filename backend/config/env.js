require('dotenv').config();
const { Pool } = require('pg');

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error(
    '\n[config] DATABASE_URL is not set.\n' +
    'This is the only variable the server needs to run.\n' +
    'Get it from Supabase: Project -> Settings -> Database -> Connection string (URI),\n' +
    'then set it, e.g.:\n' +
    '  DATABASE_URL=postgresql://postgres.<ref>:<password>@<region>.pooler.supabase.com:6543/postgres\n'
  );
  process.exit(1);
}

// Managed Postgres (Supabase, etc.) requires SSL; local/dev Postgres usually does not.
// Disable SSL for localhost or when the URL explicitly opts out via sslmode=disable.
function sslConfig(url) {
  if (/[?&]sslmode=disable/i.test(url)) return false;
  if (/@(localhost|127\.0\.0\.1|\[::1\])(:\d+)?\//i.test(url)) return false;
  return { rejectUnauthorized: false };
}

const pool = new Pool({
  connectionString,
  ssl: sslConfig(connectionString),
  max: Number(process.env.PG_POOL_MAX) || 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
});

// Without this listener, a dropped idle connection (common with Supabase's
// connection pooler) emits an unhandled 'error' that can crash the process.
pool.on('error', (err) => {
  console.error('[pg] idle client error:', err.message);
});

module.exports = { pool };
