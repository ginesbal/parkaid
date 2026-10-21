// reminders — a session's local notifications (see utils/sessionReminders).
// Scheduled on start and on every extend, cancelled on end, so a driver with
// the phone in a pocket still hears when to head back. Web has no scheduled
// notifications; there the in-app warning carries on alone.

import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { REMINDER_IDS, buildSessionReminders } from '../utils/sessionReminders';

export const REMINDERS_SUPPORTED = Platform.OS !== 'web';

const CHANNEL_ID = 'parking-reminders';
let setUp = null;

// Once: show reminders while the app is open too (the driver may be on Home),
// and give Android its channel.
function setUpOnce() {
    if (!setUp) {
        Notifications.setNotificationHandler({
            handleNotification: async () => ({
                shouldShowBanner: true,
                shouldShowList: true,
                shouldPlaySound: true,
                shouldSetBadge: false,
            }),
        });
        setUp = Platform.OS === 'android'
            ? Notifications.setNotificationChannelAsync(CHANNEL_ID, {
                name: 'Parking reminders',
                importance: Notifications.AndroidImportance.HIGH,
            }).catch(() => null)
            : Promise.resolve();
    }
    return setUp;
}

// Asks only when `ask` is set (the first Start); later calls just check.
async function allowed(ask) {
    try {
        const current = await Notifications.getPermissionsAsync();
        if (current.granted) return true;
        if (!ask || !current.canAskAgain) return false;
        return (await Notifications.requestPermissionsAsync()).granted;
    } catch (error) {
        return false;
    }
}

export async function cancelSessionReminders() {
    if (!REMINDERS_SUPPORTED) return;
    await Promise.all(Object.values(REMINDER_IDS).map((id) =>
        Notifications.cancelScheduledNotificationAsync(id).catch(() => null)
    ));
}

// Replaces whatever was scheduled for the session.
export async function scheduleSessionReminders(session, warnAtMinutes, { ask = false } = {}) {
    if (!REMINDERS_SUPPORTED) return;
    try {
        await cancelSessionReminders();
        if (!(await allowed(ask))) return;
        await setUpOnce();
        for (const reminder of buildSessionReminders(session, warnAtMinutes)) {
            await Notifications.scheduleNotificationAsync({
                identifier: reminder.id,
                content: { title: reminder.title, body: reminder.body, sound: true },
                trigger: {
                    type: Notifications.SchedulableTriggerInputTypes.DATE,
                    date: reminder.date,
                    channelId: CHANNEL_ID,
                },
            });
        }
    } catch (error) {
        console.warn('Failed to schedule parking reminders:', error);
    }
}
