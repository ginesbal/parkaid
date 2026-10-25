// reminders (web) — browsers here cannot schedule notifications, so the
// in-app warning carries on alone (see reminders.js). Not importing
// expo-notifications also keeps its push-token warning out of the console.

export const REMINDERS_SUPPORTED = false;

export async function cancelSessionReminders() {}

export async function remindersBlocked() {
    return false;
}

export async function scheduleSessionReminders() {}
