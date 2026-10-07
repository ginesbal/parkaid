// Reminders for the parking timer.
//
// Local notifications, scheduled on the phone itself: they fire with the app
// closed and need no push service or account. Two per timer — ten minutes
// before it ends, and when time's up — each with a fixed id, so scheduling
// again (after "Add time" or "Undo") simply replaces them.

import * as Notifications from 'expo-notifications';
import { useEffect } from 'react';
import { Linking, Platform } from 'react-native';
import { formatEndTime } from '../utils/formatters';

export const WARNING_LEAD_MINUTES = 10;

const CHANNEL_ID = 'parking-timer';
const WARNING_ID = 'parking-timer-warning';
const ENDED_ID = 'parking-timer-ended';
// Opening a reminder takes you to the Park tab.
const OPEN_PARK = { screen: 'Park' };

// Scheduling isn't available on web.
const SUPPORTED = Platform.OS === 'ios' || Platform.OS === 'android';

/**
 * Call once at startup. Reminders show as banners even with the app open —
 * you may be on the map when time's nearly up.
 */
export function initTimerReminders() {
    if (!SUPPORTED) return;
    Notifications.setNotificationHandler({
        handleNotification: async () => ({
            shouldShowBanner: true,
            shouldShowList: true,
            shouldPlaySound: true,
            shouldSetBadge: false,
        }),
    });
}

// Android 8+ files notifications under a channel the user can manage in
// Settings; on Android 13+ the permission prompt only appears once one exists.
async function ensureChannel() {
    if (Platform.OS !== 'android') return;
    await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
        name: 'Parking timer',
        description: 'Reminders before your parking time runs out',
        importance: Notifications.AndroidImportance.HIGH,
    });
}

/**
 * Whether reminders can reach the user, optionally asking first. Only ask
 * when the reason is obvious (starting a timer) — never on launch.
 * @returns {Promise<'granted'|'denied'|'undetermined'|'unsupported'>}
 */
export async function getReminderStatus({ ask = false } = {}) {
    if (!SUPPORTED) return 'unsupported';
    try {
        await ensureChannel();
        let permission = await Notifications.getPermissionsAsync();
        if (!permission.granted && ask && permission.canAskAgain) {
            permission = await Notifications.requestPermissionsAsync();
        }
        if (permission.granted) return 'granted';
        return permission.status === 'undetermined' ? 'undetermined' : 'denied';
    } catch {
        return 'unsupported';
    }
}

/** The app's page in system Settings, where notifications are switched on. */
export function openNotificationSettings() {
    Linking.openSettings().catch(() => {});
}

/** Replace the reminders for a running timer. */
export async function scheduleTimerReminders(session) {
    if (!SUPPORTED || !session?.scheduledEnd) return;
    await cancelTimerReminders();

    const end = new Date(session.scheduledEnd).getTime();
    const now = Date.now();
    if (!Number.isFinite(end) || end <= now) return;

    const where = session.spot?.address || null;
    const endsAt = formatEndTime(new Date(end));
    const warnAt = end - WARNING_LEAD_MINUTES * 60000;

    try {
        // Skip the heads-up when the timer is already inside its last ten
        // minutes (a short limit, or after an undo) — it would fire at once.
        if (warnAt > now) {
            await Notifications.scheduleNotificationAsync({
                identifier: WARNING_ID,
                content: {
                    title: 'Parking ends in 10 minutes',
                    body: where ? `${where} · ends at ${endsAt}` : `Your timer ends at ${endsAt}.`,
                    sound: true,
                    data: OPEN_PARK,
                },
                trigger: {
                    type: Notifications.SchedulableTriggerInputTypes.DATE,
                    date: warnAt,
                    channelId: CHANNEL_ID,
                },
            });
        }

        await Notifications.scheduleNotificationAsync({
            identifier: ENDED_ID,
            content: {
                title: 'Parking time is up',
                body: where
                    ? `${where}. Move your car or pay for more time.`
                    : 'Move your car or pay for more time.',
                sound: true,
                data: OPEN_PARK,
            },
            trigger: {
                type: Notifications.SchedulableTriggerInputTypes.DATE,
                date: end,
                channelId: CHANNEL_ID,
            },
        });
    } catch {
        // A reminder that can't be scheduled must never break the timer.
    }
}

/** Cancel any pending reminders (timer ended, or time's already up). */
export async function cancelTimerReminders() {
    if (!SUPPORTED) return;
    await Promise.all(
        [WARNING_ID, ENDED_ID].map((id) =>
            Notifications.cancelScheduledNotificationAsync(id).catch(() => {})
        )
    );
}

/**
 * Calls `onOpenPark` when a reminder is tapped — including the tap that
 * launched the app.
 */
export function useReminderTaps(onOpenPark) {
    useEffect(() => {
        if (!SUPPORTED) return undefined;
        let active = true;

        const handle = (response) => {
            if (!active || response?.notification?.request?.content?.data?.screen !== OPEN_PARK.screen) return;
            onOpenPark();
            // Otherwise the same tap would reopen Park on every later launch.
            Notifications.clearLastNotificationResponseAsync().catch(() => {});
        };

        Notifications.getLastNotificationResponseAsync().then(handle).catch(() => {});
        const subscription = Notifications.addNotificationResponseReceivedListener(handle);

        return () => {
            active = false;
            subscription.remove();
        };
    }, [onOpenPark]);
}
