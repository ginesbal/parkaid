// SessionStrip — while a session runs, a slim ink strip above the tab bar on
// Home and Map: where you are parked, when it ends and how long is left.
// Tapping it opens Park. It steps aside for the keyboard and on Park itself.

import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { Keyboard, Pressable, StyleSheet, Text, View } from 'react-native';
import { SPACING, TOKENS } from '../../constants/theme';
import { useSession } from '../../context/SessionContext';
import { formatClock, formatRemaining } from '../../utils/sessionHelpers';

// On the ink canvas: light enough for the dot to read, one per state.
const DOT = {
    active: '#83BAD0',
    expiring: TOKENS.warning,
    expired: TOKENS.danger,
};

function useKeyboardShown() {
    const [shown, setShown] = useState(false);
    useEffect(() => {
        const show = Keyboard.addListener('keyboardDidShow', () => setShown(true));
        const hide = Keyboard.addListener('keyboardDidHide', () => setShown(false));
        return () => {
            show.remove();
            hide.remove();
        };
    }, []);
    return shown;
}

export default function SessionStrip({ navigation, hidden }) {
    const sessionData = useSession();
    const keyboardShown = useKeyboardShown();
    if (!sessionData?.session || hidden || keyboardShown) return null;

    const { session, sessionState, timeRemainingMs, endTime } = sessionData;
    const expired = sessionState === 'expired';
    const left = expired ? 'Time’s up' : `${formatRemaining(timeRemainingMs)} left`;
    const ends = expired ? `Ended at ${formatClock(endTime)}` : `Ends at ${formatClock(endTime)}`;

    return (
        <Pressable
            onPress={() => navigation.navigate('Park')}
            style={({ pressed }) => [styles.strip, pressed && styles.pressed]}
            accessibilityRole="button"
            accessibilityLabel={`Parked at ${session.locationName}. ${left}. ${ends}.`}
            accessibilityHint="Opens your parking session"
        >
            <View style={[styles.dot, { backgroundColor: DOT[sessionState] || DOT.active }]} />
            <View style={styles.place}>
                <Text style={styles.title} numberOfLines={1}>Parked at {session.locationName}</Text>
                <Text style={styles.ends} numberOfLines={1}>{ends}</Text>
            </View>
            <Text style={styles.left} numberOfLines={1}>{left}</Text>
            <MaterialCommunityIcons name="chevron-right" size={20} color={TOKENS.inkMuted} />
        </Pressable>
    );
}

const styles = StyleSheet.create({
    strip: {
        minHeight: 52,
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING.md,
        paddingVertical: SPACING.sm,
        paddingLeft: SPACING.xl,
        paddingRight: SPACING.md,
        backgroundColor: TOKENS.inkSurface,
    },
    pressed: {
        opacity: 0.85,
    },
    dot: {
        width: 8,
        height: 8,
        borderRadius: 4,
    },
    place: {
        flex: 1,
        minWidth: 0,
    },
    title: {
        fontSize: 14,
        lineHeight: 19,
        fontWeight: '600',
        color: TOKENS.surface,
    },
    ends: {
        fontSize: 12,
        lineHeight: 16,
        color: TOKENS.inkMuted,
    },
    left: {
        fontSize: 15,
        fontWeight: '600',
        fontVariant: ['tabular-nums'],
        color: TOKENS.surface,
    },
});
