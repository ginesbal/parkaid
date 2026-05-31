require('dotenv').config();
const { Pool } = require('pg');

async function quickTest() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  // Test spatial query - find parking near Calgary Tower
  const result = await pool.query(`
    SELECT 
      id,
      address,
      price_per_hour,
      capacity,
      ST_Distance(location, ST_MakePoint(-114.0629, 51.0453)::geography) as distance
    FROM parking_spots
    WHERE ST_DWithin(
      location,
      ST_MakePoint(-114.0629, 51.0453)::geography,
      500  -- 500 meters
    )
    ORDER BY distance
    LIMIT 5
  `);

  console.log('Parking spots near Calgary Tower:');
  result.rows.forEach(spot => {
    console.log(`- ${spot.address}: ${Math.round(spot.distance)}m away, $${spot.price_per_hour || 0}/hr`);
  });

  await pool.end();
}

quickTest();