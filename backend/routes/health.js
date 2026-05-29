const express = require('express');
const router = express.Router();
const { pool } = require('../config/env');
const { jlog } = require('../utils/logger');

router.get('/health', (req, res) => {
  // Liveness only: return 200 whenever the web process is up. We deliberately
  // do NOT query the database here, so a transient or paused database (common
  // on Supabase's free tier) can't fail the platform health check and block a
  // deploy. Use GET /api/test-db for a strict database-connectivity check.
  res.json({ status: 'ok' });
});

router.get('/api/test-db', async (req, res) => {
  try {
    const result = await pool.query('SELECT COUNT(*) as count FROM parking_spots');
    const count = Number(result.rows[0].count);

    jlog('database_test', { totalSpots: count });

    res.json({
      success: true,
      totalSpots: count,
      message: `Database has ${count} parking spots`,
    });
  } catch (error) {
    jlog('database_test_error', { error: error.message }, 'error');
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
