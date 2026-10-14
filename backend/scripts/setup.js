require('dotenv').config();
const axios = require('axios');
const { Pool } = require('pg');

// Street blocks' rates are in a second dataset, "On-Street Parking Zones with
// Rates", which lists the same blocks with each one's rate schedule
// (html_zone_rate). It has no parking_zone, which the row ids below are built
// from, so its fields are merged into the on-street records, matched by each
// block's first point: re-running this updates rows instead of adding copies.
const STREET_RATES_ENDPOINT = '45az-7kh9.json';
const RATE_FIELDS = ['html_zone_rate', 'zone_cap', 'zone_length', 'seg_cap', 'seg_length', 'camera', 'dot'];

const firstPoint = (geometry) => {
    const point = geometry?.coordinates?.[0]?.[0];
    return point ? `${point[0].toFixed(6)},${point[1].toFixed(6)}` : null;
};

async function loadStreetRates() {
    const response = await axios.get(`https://data.calgary.ca/resource/${STREET_RATES_ENDPOINT}`, {
        params: { $limit: 5000, $$app_token: process.env.CALGARY_API_TOKEN }
    });
    return new Map(response.data.map((record) => [firstPoint(record.the_geom), record]));
}

async function loadParkingData() {
    const pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false }
    });

    console.log('Loading Calgary parking data...\n');

    // Updated endpoints using current Calgary Open Data API
    const datasets = [
        { type: 'on_street', endpoint: 'rhkg-vwwp.json', limit: 2000 },
        { type: 'off_street', endpoint: 'ggxk-g2u3.json', limit: 500 },
        { type: 'residential', endpoint: '2rmy-g65b.json', limit: 500 },
        { type: 'school', endpoint: '9hbw-zj92.json', limit: 500 }
    ];

    let totalLoaded = 0;

    for (const dataset of datasets) {
        console.log(`\nLoading ${dataset.type} parking...`);

        try {
            const response = await axios.get(
                `https://data.calgary.ca/resource/${dataset.endpoint}`,
                {
                    params: {
                        $limit: dataset.limit,
                        $$app_token: process.env.CALGARY_API_TOKEN
                    }
                }
            );

            let loaded = 0;
            let skipped = 0;
            let rated = 0;
            const streetRates = dataset.type === 'on_street' ? await loadStreetRates() : null;

            for (const record of response.data) {
                try {
                    const rates = streetRates?.get(firstPoint(record.line));
                    if (rates) {
                        for (const field of RATE_FIELDS) {
                            if (record[field] == null && rates[field] != null) record[field] = rates[field];
                        }
                        if (record.html_zone_rate) rated++;
                    }

                    let lng, lat;

                    // Extract coordinates based on geometry type
                    if (dataset.type === 'off_street' && record.multipolygon?.coordinates) {
                        const polygon = record.multipolygon.coordinates[0][0];
                        lng = polygon.reduce((sum, pt) => sum + pt[0], 0) / polygon.length;
                        lat = polygon.reduce((sum, pt) => sum + pt[1], 0) / polygon.length;
                    } else if (record.line?.coordinates?.[0]?.[0]) {
                        [lng, lat] = record.line.coordinates[0][0];
                    } else if (record.the_geom?.coordinates?.[0]?.[0]) {
                        [lng, lat] = record.the_geom.coordinates[0][0];
                    } else if (record.point?.coordinates) {
                        [lng, lat] = record.point.coordinates;
                    } else {
                        skipped++;
                        continue;
                    }

                    // Generate a unique ID if not provided
                    const globalId = record.globalid_guid || record.globalid ||
                        `${dataset.type}-${record.parking_zone || ''}-${lng.toFixed(6)}-${lat.toFixed(6)}`;

                    await pool.query(`
                        INSERT INTO parking_spots (
                            global_id, spot_type, location,
                            address_desc, status,
                            permit_zone, price_zone, html_zone_rate,
                            block_side, enforceable_time,
                            zone_cap, zone_length, seg_cap, seg_length,
                            max_time, zone_type,
                            parking_restrict_type, parking_restrict_time,
                            lot_name, parking_type, lot_num, home_page,
                            description, parking_zone, ctp_class, dot,
                            parking_restriction, time_restriction,
                            no_stopping, octant,
                            stall_type, camera
                        ) VALUES (
                            $1, $2, ST_SetSRID(ST_MakePoint($3, $4), 4326)::geography,
                            $5, $6,
                            $7, $8, $9,
                            $10, $11,
                            $12, $13, $14, $15,
                            $16, $17,
                            $18, $19,
                            $20, $21, $22, $23,
                            $24, $25, $26, $27,
                            $28, $29,
                            $30, $31,
                            $32, $33
                        )
                        ON CONFLICT (global_id) DO UPDATE SET
                            address_desc = EXCLUDED.address_desc,
                            status = EXCLUDED.status,
                            permit_zone = EXCLUDED.permit_zone,
                            price_zone = EXCLUDED.price_zone,
                            html_zone_rate = EXCLUDED.html_zone_rate,
                            block_side = EXCLUDED.block_side,
                            enforceable_time = EXCLUDED.enforceable_time,
                            zone_cap = EXCLUDED.zone_cap,
                            zone_length = EXCLUDED.zone_length,
                            seg_cap = EXCLUDED.seg_cap,
                            seg_length = EXCLUDED.seg_length,
                            max_time = EXCLUDED.max_time,
                            zone_type = EXCLUDED.zone_type,
                            parking_restrict_type = EXCLUDED.parking_restrict_type,
                            parking_restrict_time = EXCLUDED.parking_restrict_time,
                            lot_name = EXCLUDED.lot_name,
                            parking_type = EXCLUDED.parking_type,
                            lot_num = EXCLUDED.lot_num,
                            home_page = EXCLUDED.home_page,
                            description = EXCLUDED.description,
                            parking_zone = EXCLUDED.parking_zone,
                            ctp_class = EXCLUDED.ctp_class,
                            dot = EXCLUDED.dot,
                            parking_restriction = EXCLUDED.parking_restriction,
                            time_restriction = EXCLUDED.time_restriction,
                            no_stopping = EXCLUDED.no_stopping,
                            octant = EXCLUDED.octant,
                            stall_type = EXCLUDED.stall_type,
                            camera = EXCLUDED.camera,
                            last_updated = NOW()
                    `, [
                        globalId,                                    // $1 global_id
                        dataset.type,                                // $2 spot_type
                        lng,                                         // $3 longitude
                        lat,                                         // $4 latitude
                        record.address_desc || null,                 // $5 address_desc
                        record.status || 'Active',                   // $6 status
                        record.permit_zone || null,                  // $7 permit_zone
                        record.price_zone || null,                   // $8 price_zone
                        record.html_zone_rate || null,               // $9 html_zone_rate
                        record.block_side || null,                   // $10 block_side
                        record.enforceable_time || null,             // $11 enforceable_time
                        parseInt(record.zone_cap) || null,           // $12 zone_cap
                        parseFloat(record.zone_length) || null,      // $13 zone_length
                        parseInt(record.seg_cap) || null,            // $14 seg_cap
                        parseFloat(record.seg_length) || null,       // $15 seg_length
                        parseFloat(record.max_time) || null,         // $16 max_time
                        record.zone_type || null,                    // $17 zone_type
                        record.parking_restrict_type || null,        // $18 parking_restrict_type
                        record.parking_restrict_time || null,        // $19 parking_restrict_time
                        record.lot_name || null,                     // $20 lot_name
                        record.parking_type || null,                 // $21 parking_type
                        record.lot_num || null,                      // $22 lot_num
                        record.home_page || null,                    // $23 home_page
                        record.description || null,                  // $24 description
                        record.parking_zone || null,                 // $25 parking_zone
                        record.ctp_class || null,                    // $26 ctp_class
                        record.dot || null,                          // $27 dot
                        record.parking_restriction || null,          // $28 parking_restriction
                        record.time_restriction || null,             // $29 time_restriction
                        record.no_stopping || null,                  // $30 no_stopping
                        record.octant || null,                       // $31 octant
                        record.stall_type || null,                   // $32 stall_type
                        record.camera || null                        // $33 camera
                    ]);

                    loaded++;
                } catch (err) {
                    console.error(`  Error inserting record: ${err.message}`);
                }
            }

            console.log(`  Loaded ${loaded} ${dataset.type} spots (skipped ${skipped} without coordinates)`);
            if (streetRates) console.log(`  ${rated} of them have the City's rate schedule`);
            totalLoaded += loaded;

        } catch (error) {
            console.error(`  Failed to load ${dataset.type}: ${error.message}`);
        }
    }

    // Verify total
    const result = await pool.query('SELECT COUNT(*) as count FROM parking_spots');
    console.log(`\nTotal spots in database: ${result.rows[0].count}`);

    // Show breakdown
    const sample = await pool.query(`
        SELECT spot_type, COUNT(*) as count
        FROM parking_spots
        GROUP BY spot_type
        ORDER BY count DESC
    `);

    console.log('\nBreakdown by type:');
    sample.rows.forEach(row => {
        console.log(`  ${row.spot_type}: ${row.count} spots`);
    });

    await pool.end();
    console.log('\nDone!');
}

loadParkingData();