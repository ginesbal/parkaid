// Street rates by time of day, from the City (see backend utils/zoneRates):
// spot.rates.periods = [{ days, from, to, rate, dayMax }]: an hourly rate (0
// for free) from `from` to `to` minutes of the day on those days, and the
// most a day can cost, if there is one. A charged minute no period covers
// has no known price: nothing is priced from a guess.

import { chargedCost, isChargedAt, parseChargeHours } from './chargeHours';

export function periodAt(periods, time) {
    if (!periods) return null;
    const date = new Date(time);
    const minute = date.getHours() * 60 + date.getMinutes();
    return periods.find((p) => p.days.includes(date.getDay()) && minute >= p.from && minute < p.to) ?? null;
}

// What `minutes` from `start` cost: each charged minute (chargeHours, see
// utils/chargeHours) at the rate then, within each day's maximum. null when
// a charged minute has no known rate.
export function periodsCost(periods, chargeHours, start, minutes) {
    if (!periods) return null;
    const from = new Date(start).getTime();
    const days = new Map();
    for (let i = 0; i < Math.max(0, Math.round(minutes || 0)); i++) {
        const t = from + i * 60000;
        if (!isChargedAt(chargeHours, t)) continue;
        const period = periodAt(periods, t);
        if (!period) return null;
        if (!period.rate) continue;
        const key = new Date(t).toDateString();
        const day = days.get(key) ?? { sum: 0, cap: null };
        day.sum += period.rate / 60;
        if (period.dayMax) day.cap = Math.max(day.cap ?? 0, period.dayMax);
        days.set(key, day);
    }
    let total = 0;
    for (const { sum, cap } of days.values()) total += cap ? Math.min(sum, cap) : sum;
    // Half a cent rounds up, as on a receipt.
    return Math.round((total + 1e-9) * 100) / 100;
}

// The hourly rate charged at `time`: a number (0 when not charged then), or
// null when it is charged and no period says how much.
export function chargedRateAt(periods, chargeHours, time) {
    if (!isChargedAt(chargeHours, time)) return 0;
    return periodAt(periods, time)?.rate ?? null;
}

// The first time within `minutes` after `start` that the charged rate
// differs from the one at `start`: { at, rate } (rate as above), or null.
export function nextRateChange(periods, chargeHours, start, minutes) {
    if (!periods) return null;
    const from = Math.ceil(new Date(start).getTime() / 60000) * 60000;
    const first = chargedRateAt(periods, chargeHours, from);
    for (let i = 1; i < minutes; i++) {
        const t = from + i * 60000;
        const rate = chargedRateAt(periods, chargeHours, t);
        if (rate !== first) return { at: new Date(t), rate };
    }
    return null;
}

// What a session's time costs: by its rate periods when it has them, else at
// its one hourly rate; charged minutes only (utils/chargeHours). null when
// the rate is unknown. Sessions saved before rates had periods keep their
// one rate.
export function sessionCost(session, start, minutes) {
    const chargeHours = parseChargeHours(session?.chargeHours);
    return session?.ratePeriods
        ? periodsCost(session.ratePeriods, chargeHours, start, minutes)
        : chargedCost(session?.hourlyRate ?? null, chargeHours, start, minutes);
}

// A session's hourly rate at `time`: by its periods when it has them, else
// its one rate; 0 while the City isn't charging, null when unknown.
export function sessionRateAt(session, time) {
    if (!session?.ratePeriods) return session?.hourlyRate ?? null;
    return chargedRateAt(session.ratePeriods, parseChargeHours(session.chargeHours), time);
}
