require('dotenv').config();
const axios = require('axios');
const { Pool } = require('pg');

async function loadSampleData() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  console.log('Fetching Calgary parking data...');
  
  try {
    // Fetch sample on-street parking data
    const response = await axios.get(
      'https://data.calgary.ca/resource/45az-7kh9.json',
      {
        params: {
          $limit: 50, // Start with 50 records
          $$app_token: process.env.CALGARY_API_TOKEN
        }
      }
    );

    console.log(`Processing ${response.data.length} records...`);
    let loaded = 0;

    for (const record of response.data) {
      try {
        // Extract coordinates
        if (!record.the_geom?.coordinates?.[0]?.[0]) continue;
        
        const [lng, lat] = record.the_geom.coordinates[0][0];
        
        // Price mapping
        const priceMap = {
          '1': 1.00, '2': 2.00, '3': 3.00, 
          '4': 4.00, '5': 5.00
        };
        
        await pool.query(`
          INSERT INTO parking_spots (
            global_id, spot_type, address, location,
            price_per_hour, capacity, zone_info, metadata, is_active
          ) VALUES ($1, $2, $3, ST_MakePoint($4, $5)::geography, $6, $7, $8, $9, true)
          ON CONFLICT (global_id) DO UPDATE SET
            address = EXCLUDED.address,
            price_per_hour = EXCLUDED.price_per_hour,
            last_updated = NOW()
        `, [
          record.globalid_guid,
          'on_street',
          record.address_desc || '',
          lng,
          lat,
          priceMap[record.price_zone] || null,
          parseInt(record.zone_cap) || 1,
          JSON.stringify({
            zone_type: record.zone_type,
            permit_zone: record.permit_zone,
            enforceable_time: record.enforceable_time
          }),
          JSON.stringify({
            max_time: record.max_time,
            stall_type: record.stall_type
          })
        ]);
        
        loaded++;
        console.log(`✓ ${record.address_desc}`);
      } catch (err) {
        console.error(`Failed: ${err.message}`);
      }
    }

    console.log(`\nLoaded ${loaded} parking spots!`);
    
    // Verify data
    const check = await pool.query('SELECT COUNT(*) FROM parking_spots');
    console.log(`Total spots in database: ${check.rows[0].count}`);
    
    await pool.end();
  } catch (error) {
    console.error('Error:', error.message);
  }
}

loadSampleData();