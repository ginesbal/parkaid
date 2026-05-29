require('dotenv').config();
const express = require('express');
const cors = require('cors');

const { pool } = require('./config/env');
const { requestLogger } = require('./middleware/requestLogger');
const { jlog, FILE_LOGGING, LOG_FILE } = require('./utils/logger');
const healthRoutes = require('./routes/health');
const parkingRoutes = require('./routes/parking');
const placesRoutes = require('./routes/places');

const app = express();
app.use(cors());
app.use(express.json());
app.use(requestLogger);

app.use('/', healthRoutes);
app.use('/api/parking', parkingRoutes);
app.use('/api/places', placesRoutes);

process.on('unhandledRejection', (err) => {
  jlog('unhandled_promise_rejection', { error: err?.message || String(err) }, 'error');
});

process.on('uncaughtException', (err) => {
  jlog('uncaught_exception', { error: err?.message || String(err) }, 'error');
});

app.use((err, req, res, _next) => {
  jlog('express_error', { error: err?.message }, 'error');
  res.status(500).json({ error: 'internal error' });
});

const PORT = process.env.PORT || 3000;

if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log('\n==============================================');
    console.log('  ParkPal Backend Server');
    console.log('==============================================\n');
    console.log(`Server running on http://localhost:${PORT}`);
    if (FILE_LOGGING) console.log(`Logging to: ${LOG_FILE}`);
    console.log('\nAvailable endpoints:');
    console.log(`  Health check:    http://localhost:${PORT}/health`);
    console.log(`  DB row count:    http://localhost:${PORT}/api/test-db`);
    console.log(`  Nearby parking:  http://localhost:${PORT}/api/parking/nearby?lat=51.0447&lng=-114.0719&radius=1000\n`);

    jlog('server_started', {
      port: PORT,
      environment: process.env.NODE_ENV || 'development',
    });
  });
}

module.exports = { app, pool };
