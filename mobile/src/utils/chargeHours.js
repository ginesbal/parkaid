// When the City charges for a street spot, read from its enforceable_time
// ("0910-1750 MON-SAT, 0001-2359 SUN"). Outside those hours parking is free,
// so ParkAid prices only the minutes that are charged. Times are Calgary's,
// taken as the phone's local time.

import { formatClock } from './sessionHelpers';

const DAYS = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
const DAY_MINUTES = 24 * 60;

// [{ days, from, to }] with days as day numbers (0 is Sunday) and from/to in
// minutes of the day, or null when there is nothing to read. Text it cannot
// read is also null: then every minute counts as charged, never as free.
export function parseChargeHours(raw) {
    if (!raw || typeof raw !== 'string') return null;
    const windows = [];
    for (const part of raw.split(',').map((p) => p.trim()).filter(Boolean)) {
        const m = part.match(/^(\d{2})(\d{2})-(\d{2})(\d{2})\s+([A-Z]{3})(?:-([A-Z]{3}))?$/i);
        if (!m) return null;
        const [, fromH, fromM, toH, toM, firstDay, lastDay] = m;
        const first = DAYS.indexOf(firstDay.toUpperCase());
        const last = lastDay ? DAYS.indexOf(lastDay.toUpperCase()) : first;
        if (first < 0 || last < 0) return null;
        const days = [];
        for (let d = first; ; d = (d + 1) % 7) {
            days.push(d);
            if (d === last) break;
        }
        let from = Number(fromH) * 60 + Number(fromM);
        let to = Number(toH) * 60 + Number(toM);
        // "0001-2359" is the City's way of saying all day.
        if (from === 1) from = 0;
        if (to >= DAY_MINUTES - 1) to = DAY_MINUTES;
        // Hours past midnight are not read, rather than read as free.
        if (to <= from) return null;
        windows.push({ days, from, to });
    }
    return windows.length ? windows : null;
}

export function isChargedAt(windows, time) {
    if (!windows) return true;
    const date = new Date(time);
    const minute = date.getHours() * 60 + date.getMinutes();
    return windows.some((w) => w.days.includes(date.getDay()) && minute >= w.from && minute < w.to);
}

// Charged minutes from `start` for `minutes`.
export function chargedMinutes(windows, start, minutes) {
    const total = Math.max(0, Math.round(minutes || 0));
    if (!windows) return total;
    const from = new Date(start).getTime();
    let charged = 0;
    for (let i = 0; i < total; i++) {
        if (isChargedAt(windows, from + i * 60000)) charged++;
    }
    return charged;
}

// What `minutes` from `start` cost at `rate` an hour, counting only charged
// minutes; null when the rate is unknown.
export function chargedCost(rate, windows, start, minutes) {
    if (rate === null || rate === undefined) return null;
    return Number(((chargedMinutes(windows, start, minutes) / 60) * rate).toFixed(2));
}

// The first charged minute at or after `time`, within a week; null if none.
export function nextChargedAt(windows, time) {
    if (!windows) return null;
    const from = Math.ceil(new Date(time).getTime() / 60000) * 60000;
    for (let i = 0; i < 7 * DAY_MINUTES; i++) {
        const t = from + i * 60000;
        if (isChargedAt(windows, t)) return new Date(t);
    }
    return null;
}

// "9:10 AM" today, "9:10 AM Mon" on another day.
export function formatChargeStart(date, now = Date.now()) {
    const sameDay = new Date(date).toDateString() === new Date(now).toDateString();
    return sameDay
        ? formatClock(date)
        : `${formatClock(date)} ${new Date(date).toLocaleDateString([], { weekday: 'short' })}`;
}

// "Free now · charged from 9:10 AM Mon" outside charging hours; null while
// charged, or when the hours are unknown.
export function describeFreeNow(windows, now = Date.now()) {
    if (!windows || isChargedAt(windows, now)) return null;
    const next = nextChargedAt(windows, now);
    return next ? `Free now · charged from ${formatChargeStart(next, now)}` : 'Free now';
}
