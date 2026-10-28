const express = require('express');
const router = express.Router();
const { pool } = require('../config/env');
const { jlog } = require('../utils/logger');
const { toSpot } = require('../utils/spotRows');

router.get('/nearby', async (req, res) => {
  const started = Date.now();
  try {
    const { lat, lng, radius = 500, type, free } = req.query;

    if (!lat || !lng) {
      jlog('nearby_search_missing_coordinates', { received: req.query });
      return res.status(400).json({ error: 'lat and lng required' });
    }

    const where = [];
    const params = [];
    let p = 1;

    where.push(`ST_DWithin(location, ST_MakePoint($${p + 1}, $${p})::geography, $${p + 2})`);
    params.push(lat, lng, radius);
    p += 3;

    if (type && type !== 'all') {
      where.push(`spot_type = $${p}`);
      params.push(type);
      p += 1;
    }

    if (free === 'true') {
      where.push(`(price_zone IS NULL OR price_zone = '0' OR price_zone = '')`);
    }

    const sql = `
      SELECT
        id,
        spot_type,
        address_desc,
        permit_zone,
        price_zone,
        html_zone_rate,
        block_side,
        enforceable_time,
        zone_cap,
        zone_length,
        seg_cap,
        seg_length,
        max_time,
        zone_type,
        parking_restrict_type,
        parking_restrict_time,
        lot_name,
        parking_type,
        lot_num,
        home_page,
        description,
        parking_zone,
        ctp_class,
        dot,
        parking_restriction,
        time_restriction,
        no_stopping,
        octant,
        stall_type,
        camera,
        ST_Distance(location, ST_MakePoint($2, $1)::geography) as distance,
        ST_AsGeoJSON(location)::json as coordinates
      FROM parking_spots
      WHERE ${where.join(' AND ')}
      ORDER BY distance
      LIMIT 100
    `;

    const result = await pool.query(sql, params);
    const ms = Date.now() - started;

    jlog('nearby_search_completed', {
      coordinates: `${lat}, ${lng}`,
      radius: `${radius}m`,
      type: type || 'all',
      freeOnly: free === 'true',
      spotsFound: result.rows.length,
      queryTimeMs: ms,
    });

    res.json({
      success: true,
      count: result.rows.length,
      data: result.rows.map(toSpot),
    });
  } catch (error) {
    jlog('nearby_search_error', { error: error.message }, 'error');
    res.status(500).json({
      success: false,
      error: error.message,
      details: error.detail || 'Unknown error',
    });
  }
});

module.exports = router;
