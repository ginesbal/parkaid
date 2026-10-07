import * as Notifications from 'expo-notifications';
import {
    cancelTimerReminders,
    getReminderStatus,
    scheduleTimerReminders,
    WARNING_LEAD_MINUTES,
} from '../timerReminders';

jest.mock('react-native', () => ({
    Platform: { OS: 'android' },
    Linking: { openSettings: jest.fn(() => Promise.resolve()) },
}));

jest.mock('expo-notifications', () => ({
    setNotificationHandler: jest.fn(),
    setNotificationChannelAsync: jest.fn(async () => null),
    getPermissionsAsync: jest.fn(),
    requestPermissionsAsync: jest.fn(),
    scheduleNotificationAsync: jest.fn(async (request) => request.identifier),
    cancelScheduledNotificationAsync: jest.fn(async () => {}),
    getLastNotificationResponseAsync: jest.fn(async () => null),
    clearLastNotificationResponseAsync: jest.fn(async () => {}),
    addNotificationResponseReceivedListener: jest.fn(() => ({ remove: jest.fn() })),
    AndroidImportance: { HIGH: 6 },
    SchedulableTriggerInputTypes: { DATE: 'date' },
}), { virtual: true });

const NOW = new Date('2026-10-07T12:00:00Z').getTime();
const timer = (minutesLeft, spot = { address: '7 Ave SW' }) => ({
    id: 'timer_1',
    scheduledEnd: new Date(NOW + minutesLeft * 60000).toISOString(),
    spot,
});
const scheduled = () => Notifications.scheduleNotificationAsync.mock.calls.map(([request]) => request);

beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers({ now: NOW });
});

afterEach(() => {
    jest.useRealTimers();
});

describe('scheduleTimerReminders', () => {
    it('schedules a heads-up 10 minutes before the end, and one at the end', async () => {
        await scheduleTimerReminders(timer(60));

        const [warning, ended] = scheduled();
        expect(warning.identifier).toBe('parking-timer-warning');
        expect(warning.trigger).toEqual({ type: 'date', date: NOW + (60 - WARNING_LEAD_MINUTES) * 60000, channelId: 'parking-timer' });
        expect(warning.content.title).toBe('Parking ends in 10 minutes');
        expect(warning.content.body).toMatch(/^7 Ave SW · ends at /);
        expect(warning.content.data).toEqual({ screen: 'Park' });

        expect(ended.identifier).toBe('parking-timer-ended');
        expect(ended.trigger.date).toBe(NOW + 60 * 60000);
        expect(ended.content.title).toBe('Parking time is up');
        expect(ended.content.body).toBe('7 Ave SW. Move your car or pay for more time.');
    });

    it('replaces earlier reminders instead of stacking them', async () => {
        await scheduleTimerReminders(timer(60));
        expect(Notifications.cancelScheduledNotificationAsync).toHaveBeenCalledWith('parking-timer-warning');
        expect(Notifications.cancelScheduledNotificationAsync).toHaveBeenCalledWith('parking-timer-ended');
    });

    it('skips the heads-up inside the last 10 minutes', async () => {
        await scheduleTimerReminders(timer(8));
        expect(scheduled().map((r) => r.identifier)).toEqual(['parking-timer-ended']);
    });

    it('schedules nothing for a timer that has already ended', async () => {
        await scheduleTimerReminders(timer(-1));
        expect(scheduled()).toHaveLength(0);
    });

    it('words the reminder without a spot', async () => {
        await scheduleTimerReminders(timer(30, null));
        const [warning, ended] = scheduled();
        expect(warning.content.body).toMatch(/^Your timer ends at /);
        expect(ended.content.body).toBe('Move your car or pay for more time.');
    });

    it('never throws if the system refuses to schedule', async () => {
        Notifications.scheduleNotificationAsync.mockRejectedValueOnce(new Error('nope'));
        await expect(scheduleTimerReminders(timer(30))).resolves.toBeUndefined();
    });
});

describe('cancelTimerReminders', () => {
    it('cancels both reminders', async () => {
        await cancelTimerReminders();
        expect(Notifications.cancelScheduledNotificationAsync.mock.calls.map(([id]) => id).sort())
            .toEqual(['parking-timer-ended', 'parking-timer-warning']);
    });
});

describe('getReminderStatus', () => {
    it('checks without asking by default', async () => {
        Notifications.getPermissionsAsync.mockResolvedValue({ granted: false, status: 'undetermined', canAskAgain: true });
        await expect(getReminderStatus()).resolves.toBe('undetermined');
        expect(Notifications.requestPermissionsAsync).not.toHaveBeenCalled();
    });

    it('creates the Android channel before asking, so the prompt can appear', async () => {
        Notifications.getPermissionsAsync.mockResolvedValue({ granted: false, status: 'undetermined', canAskAgain: true });
        Notifications.requestPermissionsAsync.mockResolvedValue({ granted: true, status: 'granted' });

        await expect(getReminderStatus({ ask: true })).resolves.toBe('granted');

        const channelOrder = Notifications.setNotificationChannelAsync.mock.invocationCallOrder[0];
        const askOrder = Notifications.requestPermissionsAsync.mock.invocationCallOrder[0];
        expect(channelOrder).toBeLessThan(askOrder);
        expect(Notifications.setNotificationChannelAsync).toHaveBeenCalledWith('parking-timer', expect.objectContaining({ name: 'Parking timer', importance: 6 }));
    });

    it("doesn't nag once the user has said no for good", async () => {
        Notifications.getPermissionsAsync.mockResolvedValue({ granted: false, status: 'denied', canAskAgain: false });
        await expect(getReminderStatus({ ask: true })).resolves.toBe('denied');
        expect(Notifications.requestPermissionsAsync).not.toHaveBeenCalled();
    });
});
