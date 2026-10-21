// What a session's reminders say, and when they go off: one when it is time
// to head back (the walk plus a buffer before the end), one when the time is
// up. Pure, so it can be tested; services/reminders.js schedules them.

import { formatClock } from './sessionHelpers';

export const REMINDER_IDS = {
    headBack: 'parkaid-session-head-back',
    timesUp: 'parkaid-session-times-up',
};

// session:       the stored session (locationName, scheduledEnd, walkMinutes, spotId)
// warnAtMinutes: minutes before the end to say "head back"
// now:           ms; reminders already in the past are left out
export function buildSessionReminders(session, warnAtMinutes, now = Date.now()) {
    if (!session?.scheduledEnd) return [];
    const end = new Date(session.scheduledEnd).getTime();
    if (!Number.isFinite(end)) return [];

    const place = session.locationName || 'your spot';
    const endsAt = formatClock(end);
    const walk = Number(session.walkMinutes);
    // Street spots carry their ParkPlus zone ("Zone 1684"); lots do not.
    const zone = /^Zone /.test(session.spotId || '') ? session.spotId : null;

    const reminders = [];
    const headBackAt = end - warnAtMinutes * 60000;
    if (headBackAt > now) {
        reminders.push({
            id: REMINDER_IDS.headBack,
            date: new Date(headBackAt),
            title: 'Time to head back',
            body: walk > 0
                ? `Your parking at ${place} ends at ${endsAt}. It’s about a ${walk} minute walk.`
                : `Your parking at ${place} ends at ${endsAt}.`,
        });
    }
    if (end > now) {
        reminders.push({
            id: REMINDER_IDS.timesUp,
            date: new Date(end),
            title: 'Your parking time is up',
            body: zone
                ? `${place} ended at ${endsAt}. Move your car, or add time in ParkPlus for ${zone.toLowerCase()}.`
                : `${place} ended at ${endsAt}. Move your car, or add time where you paid.`,
        });
    }
    return reminders;
}
