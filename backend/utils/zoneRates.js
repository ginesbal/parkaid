// The City's on-street rates, from its map layer "On-Street Parking Zones
// with Rates" (field HTML_ZONE_RATE). Each zone's text is a list of headings
// and lines:
//
//   <b>Mon-Fri 9:00 AM to 11:00 AM</b><br><br>$3.75 per Hour<br><br>
//   <b>Saturday: 9:00 AM to 6:00 PM</b><br><br>$1.00 per Hour<br><br>
//   <b>Sunday/Holidays:</b><br><br>Free parking<br><br>
//   <b>Weekdays: Max 9 Hours</b><br><br>$1.50 per hour, max:$6.00<br><br>
//   <b>Loading zone:</b><br><br>Free 20 mins<br><br>
//
// parseZoneRate turns it into periods: { days, from, to, rate, dayMax },
// with days as day numbers (0 is Sunday), from/to in minutes of the day, the
// hourly rate (0 for free) and the most a day can cost, if there is one.
// Lines it cannot read ("See Signs", "Press GREEN Button to Register") give
// no period, so nothing is priced from a guess.

const LAYER =
  'https://services1.arcgis.com/AVP60cs0Q9PEA8rH/arcgis/rest/services/Calgary_Parking_Authority_On_Street_Parking_Zones_with_Rates/FeatureServer/0';

const EVERY_DAY = [0, 1, 2, 3, 4, 5, 6];

const DAY_GROUPS = [
  [/^(mon-fri|weekdays)\b/i, [1, 2, 3, 4, 5]],
  [/^mon-sat\b/i, [1, 2, 3, 4, 5, 6]],
  [/^mon-thu\b/i, [1, 2, 3, 4]],
  [/^fri\b/i, [5]],
  [/^(saturday|sat)\b/i, [6]],
  [/^(sunday|sun)\b/i, [0]],
];

// "9:00 AM", "09:00 AM", "6 PM", or 24-hour "18:00" -> minutes of the day.
function minutesOf(text) {
  const m = text.trim().match(/^(\d{1,2})(?::(\d{2}))?\s*([AP]M)?$/i);
  if (!m) return null;
  let h = Number(m[1]);
  const min = Number(m[2] || 0);
  const half = m[3]?.toUpperCase();
  if (half === 'PM' && h < 12) h += 12;
  if (half === 'AM' && h === 12) h = 0;
  return h * 60 + min;
}

// A heading -> { days, from, to }, or null when it is not a time window
// ("Free parking to 9 AM", "Loading zone:", "No Parking at this time").
function windowOf(heading) {
  const text = heading.replace(/:\s*$/, '').trim();
  // A loading zone is free (for its posted few minutes) whenever it is one.
  if (/loading zone$/i.test(text)) return { days: EVERY_DAY, from: 0, to: 24 * 60 };
  const group = DAY_GROUPS.find(([pattern]) => pattern.test(text));
  if (!group) return null;
  const rest = text.replace(group[0], '').replace(/^[:\s]+/, '').trim();
  // "Sunday/Holidays", "Saturday", "Weekdays: Max 9 Hours": all day
  if (!rest || /^\/?holidays$/i.test(rest) || /^max\b/i.test(rest)) {
    return { days: group[1], from: 0, to: 24 * 60 };
  }
  const range = rest.match(/^(.+?)\s+to\s+(.+)$/i);
  if (!range) return null;
  const from = minutesOf(range[1]);
  const to = minutesOf(range[2]);
  if (from === null || to === null || to <= from) return null;
  return { days: group[1], from, to };
}

const money = (text) => Math.round(Number(text) * 100) / 100;

// A line -> { rate, dayMax }, or null when it says no price ("See Signs").
function priceOf(line) {
  const text = line.replace(/@/g, '').replace(/\s+/g, ' ').trim();
  if (/^free\b/i.test(text)) return { rate: 0, dayMax: null };
  const m = text.match(/^\$?(\d*\.?\d+)(?:\s*(?:per|each)\s*(hour|1\/2 hour|30 min))?/i);
  if (!m || !Number.isFinite(Number(m[1]))) return null;
  const perHalf = m[2] && !/^hour$/i.test(m[2]);
  const dayMax = text.match(/max:?\s*\$(\d*\.?\d+)/i);
  return {
    rate: money(Number(m[1]) * (perHalf ? 2 : 1)),
    dayMax: dayMax ? money(dayMax[1]) : null,
  };
}

function parseZoneRate(html) {
  if (!html || typeof html !== 'string') return null;
  const parts = html
    .split(/<br\s*\/?>/i)
    .map((part) => part.trim())
    .filter(Boolean);
  const periods = [];
  for (let i = 0; i < parts.length; i += 1) {
    const heading = parts[i].match(/^<b>(.*)<\/b>$/i);
    if (!heading) continue;
    const window = windowOf(heading[1]);
    const line = parts[i + 1] && !/^<b>/i.test(parts[i + 1]) ? parts[i + 1] : null;
    const price = line ? priceOf(line) : null;
    if (window && price) periods.push({ ...window, ...price });
  }
  return periods.length ? { periods } : null;
}

// The hourly rate at `date` in Calgary, or null when no period covers it.
function rateAt(rates, date = new Date()) {
  if (!rates) return null;
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Edmonton', weekday: 'short', hour: 'numeric', minute: 'numeric', hourCycle: 'h23',
  }).formatToParts(date);
  const get = (type) => parts.find((p) => p.type === type)?.value;
  const day = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(get('weekday'));
  const minute = Number(get('hour')) * 60 + Number(get('minute'));
  const period = rates.periods.find((p) => p.days.includes(day) && minute >= p.from && minute < p.to);
  return period ? period.rate : null;
}

// Every active zone's rate text, by zone number, from the City's layer.
async function fetchZoneRates(get) {
  const byZone = new Map();
  for (let offset = 0; ; offset += 1000) {
    const { data } = await get(`${LAYER}/query`, {
      params: {
        where: "STATUS='Active'",
        outFields: 'PARKING_ZONE,HTML_ZONE_RATE',
        returnGeometry: 'false',
        orderByFields: 'OBJECTID',
        resultOffset: offset,
        resultRecordCount: 1000,
        f: 'json',
      },
    });
    if (data.error) throw new Error(data.error.message || 'rates layer error');
    for (const { attributes } of data.features) {
      if (attributes.HTML_ZONE_RATE) byZone.set(String(attributes.PARKING_ZONE), attributes.HTML_ZONE_RATE);
    }
    if (!data.exceededTransferLimit && data.features.length < 1000) break;
  }
  return byZone;
}

module.exports = { parseZoneRate, rateAt, fetchZoneRates };
