const path = require('path');
const { appendFile, mkdir } = require('fs/promises');

// File logging is opt-in: it only happens when LOG_DIR or LOG_FILE is set.
// This keeps production/serverless hosts from writing a log file per request
// to ephemeral disk. Console logging is always on.
const FILE_LOGGING = !!(process.env.LOG_DIR || process.env.LOG_FILE);
const LOG_DIR = process.env.LOG_DIR || path.resolve(__dirname, '..', 'logs');
const LOG_FILE = process.env.LOG_FILE || path.join(LOG_DIR, 'server-activity.log');
const WRAP_COL = 120;
const PRETTY = process.env.LOG_PRETTY !== 'false';

let logDirReady = false;
async function ensureLogDir() {
  if (!logDirReady) {
    await mkdir(LOG_DIR, { recursive: true });
    logDirReady = true;
  }
}

function wrapString(s, width = WRAP_COL) {
  if (typeof s !== 'string' || s.length <= width) return s;
  const out = [];
  for (let i = 0; i < s.length; i += width) out.push(s.slice(i, i + width));
  return out.join('\n');
}

function normalize(val, seen = new WeakSet()) {
  if (val == null) return val;
  if (typeof val === 'string') return wrapString(val);
  if (typeof val === 'number' || typeof val === 'boolean') return val;
  if (val instanceof Error) return `${val.name}: ${val.message}`;
  if (typeof val === 'function') return '[Function]';

  if (Array.isArray(val)) {
    if (val.length > 50) {
      return {
        _type: 'Array',
        _length: val.length,
        _preview: val.slice(0, 50).map((x) => normalize(x, seen)),
        _note: 'truncated to 50 items',
      };
    }
    return val.map((x) => normalize(x, seen));
  }

  if (typeof val === 'object') {
    if (seen.has(val)) return '[Circular]';
    seen.add(val);
    const out = {};
    for (const k of Object.keys(val)) out[k] = normalize(val[k], seen);
    return out;
  }

  try { return String(val); } catch { return '[Unserializable]'; }
}

function consoleLog(event, data = {}, level = 'info') {
  const timestamp = new Date().toLocaleTimeString();
  const colors = {
    reset: '\x1b[0m', bright: '\x1b[1m', dim: '\x1b[2m',
    cyan: '\x1b[36m', green: '\x1b[32m', yellow: '\x1b[33m',
    red: '\x1b[31m', blue: '\x1b[34m', magenta: '\x1b[35m',
  };

  let color = colors.cyan;
  let prefix = 'INFO';

  if (level === 'error') { color = colors.red; prefix = 'ERROR'; }
  else if (event.includes('http_request')) { color = colors.blue; prefix = 'REQUEST'; }
  else if (event.includes('http_response')) { color = colors.green; prefix = 'RESPONSE'; }
  else if (event.includes('query')) { color = colors.magenta; prefix = 'DATABASE'; }
  else if (event.includes('places')) { color = colors.yellow; prefix = 'GOOGLE API'; }

  console.log(`${colors.dim}[${timestamp}]${colors.reset} ${color}${prefix}${colors.reset} ${event}`);

  const relevantData = { ...data };
  delete relevantData.id;

  if (Object.keys(relevantData).length > 0) {
    Object.entries(relevantData).forEach(([key, value]) => {
      if (value !== undefined) {
        const displayValue = typeof value === 'object'
          ? JSON.stringify(value, null, 2).split('\n').join('\n    ')
          : value;
        console.log(`  ${colors.dim}${key}:${colors.reset} ${displayValue}`);
      }
    });
  }
  console.log('');
}

async function jlog(event, data = {}, level = 'info') {
  try {
    consoleLog(event, data, level);

    if (!FILE_LOGGING) return;

    const payload = {
      t: new Date().toISOString(),
      level,
      event,
      data: normalize(data),
    };
    const body = PRETTY
      ? [
        '=== log entry =============================================================',
        JSON.stringify(payload, null, 2),
        '',
      ].join('\n')
      : JSON.stringify(payload) + '\n';

    await ensureLogDir();
    await appendFile(LOG_FILE, body);
  } catch {
    // ignore logging errors
  }
}

module.exports = { jlog, LOG_FILE, FILE_LOGGING };
