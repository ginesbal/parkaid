require('dotenv').config();
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });

async function test() {
    const result = await pool.query(`
        SELECT
            spot_type,
            address_desc,
            price_zone,
            ST_Distance(location, ST_MakePoint(-114.0719, 51.0447)::geography) as distance
        FROM parking_spots
        WHERE ST_DWithin(location, ST_MakePoint(-114.0719, 51.0447)::geography, 500)
        ORDER BY distance
        LIMIT 5
    `);

    console.log('Nearby parking spots (500m from downtown Calgary):');
    result.rows.forEach((r, i) => {
        console.log(`  ${i + 1}. [${r.spot_type}] ${r.address_desc} - ${Math.round(r.distance)}m away, price zone ${r.price_zone || 'free'}`);
    });

    await pool.end();
}
test();
