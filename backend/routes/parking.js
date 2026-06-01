const express = require('express');
const router = express.Router();
const { pool } = require('../config/env');
const { jlog } = require('../utils/logger');

// Calgary price-zone -> $/hour. The mobile app reads both `price` and
// `price_per_hour`, so /nearby returns both from this one source.
const PRICE_BY_ZONE = { '1': 1.0, '2': 2.0, '3': 3.0, '4': 4.0, '5': 5.0, '6': 6.0 };
const priceForZone = (zone) => (zone ? PRICE_BY_ZONE[zone] || 0 : 0);

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
      data: result.rows.map((spot) => ({
        id: spot.id,
        spot_type: spot.spot_type,
        address: spot.address_desc || 'Unknown Address',
        coordinates: spot.coordinates,
        distance: Math.round(spot.distance),
        walkingTime: Math.ceil(spot.distance / 80),

        capacity: spot.zone_cap || spot.seg_cap || 0,
        available: spot.zone_cap || spot.seg_cap || 0,

        zone_info: {
          permit_zone: spot.permit_zone,
          price_zone: spot.price_zone,
          html_zone_rate: spot.html_zone_rate,
          zone_type: spot.zone_type,
          parking_zone: spot.parking_zone,
          enforceable_time: spot.enforceable_time,
        },

        metadata: {
          stall_type: spot.stall_type,
          camera: spot.camera,
          block_side: spot.block_side,
          max_time: spot.max_time,
          zone_cap: spot.zone_cap,
          seg_cap: spot.seg_cap,
          lot_name: spot.lot_name,
          lot_num: spot.lot_num,
          parking_type: spot.parking_type,
          home_page: spot.home_page,
          time_restriction: spot.time_restriction,
          parking_restriction: spot.parking_restriction,
          no_stopping: spot.no_stopping,
          description: spot.description,
          ctp_class: spot.ctp_class,
          dot: spot.dot,
          octant: spot.octant,
        },

        price: priceForZone(spot.price_zone),
        price_per_hour: priceForZone(spot.price_zone),

        max_duration_minutes: spot.max_time ? parseFloat(spot.max_time) : null,
      })),
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
