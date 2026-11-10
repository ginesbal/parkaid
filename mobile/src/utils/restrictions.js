// Rush-hour restrictions on street blocks, from the City's data. Nobody may
// park on a restricted block at those times on weekdays, paid or not:
// parking_restrict_time "07:00 - 08:30 , 15:30 - 18:00". The City's charging
// hours stop around them ("0910-1520 MON-FRI"), so a block that is not
// charged is not always free to park on. Read as the phone's local time,
// like the charging hours (utils/chargeHours).

const WEEKDAYS = [1, 2, 3, 4, 5];
const DAY_MINUTES = 24 * 60;

// [{ days, from, to }] in minutes of the day, or null when the block has none
// or the text cannot be read.
export function parseRestrictions(raw) {
    if (!raw || typeof raw !== 'string') return null;
    const windows = [];
    for (const part of raw.split(',').map((p) => p.trim()).filter(Boolean)) {
        const m = part.match(/^(\d{1,2}):(\d{2})\s*-\s*(\d{1,2}):(\d{2})$/);
        if (!m) return null;
        const from = Number(m[1]) * 60 + Number(m[2]);
        const to = Number(m[3]) * 60 + Number(m[4]);
        if (to <= from || to > DAY_MINUTES) return null;
        windows.push({ days: WEEKDAYS, from, to });
    }
    return windows.length ? windows : null;
}

const dayOf = (time, offset = 0) => {
    const t = new Date(time);
    return new Date(t.getFullYear(), t.getMonth(), t.getDate() + offset);
};

// A day's restrictions as times: [{ start, end }], earliest first.
function stretchesOn(windows, day) {
    return windows
        .filter((w) => w.days.includes(day.getDay()))
        .map((w) => ({
            start: new Date(day.getFullYear(), day.getMonth(), day.getDate(), 0, w.from),
            end: new Date(day.getFullYear(), day.getMonth(), day.getDate(), 0, w.to),
        }))
        .sort((a, b) => a.start - b.start);
}

// The restriction in force at `time`, as { start, end }, or null.
export function restrictionAt(windows, time) {
    if (!windows) return null;
    const t = new Date(time).getTime();
    return stretchesOn(windows, dayOf(time))
        .find(({ start, end }) => t >= start.getTime() && t < end.getTime()) ?? null;
}

// The next restriction to start after `time`, within a week, or null.
export function nextRestriction(windows, time) {
    if (!windows) return null;
    const t = new Date(time).getTime();
    for (let i = 0; i <= 7; i++) {
        const next = stretchesOn(windows, dayOf(time, i)).find(({ start }) => start.getTime() > t);
        if (next) return next;
    }
    return null;
}

// "7–8:30 AM and 3:30–6 PM". A word joiner after each dash and a no-break
// space before AM or PM, so a range never splits across lines.
const DASH = '–⁠';
const NBSP = ' ';

function clockParts(minutes) {
    const h = Math.floor(minutes / 60) % 24;
    const m = minutes % 60;
    const h12 = h % 12 === 0 ? 12 : h % 12;
    return { time: m ? `${h12}:${String(m).padStart(2, '0')}` : `${h12}`, half: h < 12 ? 'AM' : 'PM' };
}

// "7–8:30 AM", "11 AM–1:30 PM": a stretch of the day, in minutes.
export function formatTimeRange(from, to) {
    const a = clockParts(from);
    const b = clockParts(to);
    return a.half === b.half
        ? `${a.time}${DASH}${b.time}${NBSP}${b.half}`
        : `${a.time}${NBSP}${a.half}${DASH}${b.time}${NBSP}${b.half}`;
}

export function formatRestrictions(windows) {
    if (!windows) return null;
    const seen = new Set();
    return windows
        .filter(({ from, to }) => !seen.has(`${from}-${to}`) && seen.add(`${from}-${to}`))
        .map(({ from, to }) => formatTimeRange(from, to))
        .join(' and ');
}
