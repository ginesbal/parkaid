// Reminders on the web: there are none (they're a phone feature), so this
// is the same API as timerReminders.js, doing nothing. It keeps
// expo-notifications out of the web build, which is smaller for it and no
// longer logs its "not supported on web" warning.

export { WARNING_LEAD_MINUTES } from '../constants/session';

export function initTimerReminders() {}

/** @returns {Promise<'unsupported'>} */
export async function getReminderStatus() {
    return 'unsupported';
}

export function openNotificationSettings() {}

export function scheduleTimerReminders() {
    return Promise.resolve();
}

export function cancelTimerReminders() {
    return Promise.resolve();
}

export function useReminderTaps() {}
