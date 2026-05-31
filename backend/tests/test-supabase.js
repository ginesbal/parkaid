require('dotenv').config();

async function testSupabase() {
    const { createClient } = require('@supabase/supabase-js');
    const { Pool } = require('pg');

    console.log('Testing Supabase connection...');
    console.log('URL:', process.env.SUPABASE_URL);

    // Test Supabase client
    const supabase = createClient(
        process.env.SUPABASE_URL,
        process.env.SUPABASE_SERVICE_KEY
    );

    // Test table access
    const { data, error } = await supabase
        .from('parking_spots')
        .select('count');

    if (error) {
        console.log('Supabase test result:', error.message);
    } else {
        console.log('✓ Supabase client connected');
    }

    // Test direct PostgreSQL
    const pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false }
    });

    try {
        const result = await pool.query('SELECT NOW()');
        console.log('✓ PostgreSQL connected:', result.rows[0].now);

        // Test PostGIS
        const gisTest = await pool.query(`
      SELECT postgis_version()
    `);
        console.log('✓ PostGIS version:', gisTest.rows[0].postgis_version);

        await pool.end();
    } catch (err) {
        console.error('PostgreSQL error:', err.message);
    }
}

testSupabase();