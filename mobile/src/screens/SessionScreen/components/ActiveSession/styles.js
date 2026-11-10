import { StyleSheet } from 'react-native';
import { LAYOUT, RADIUS, SPACING, TOKENS, TYPOGRAPHY, alpha } from '../../../../constants/theme';

export const styles = StyleSheet.create({
    // Sits on TOKENS.inkSurface (see SessionScreen).
    scroll: {
        flexGrow: 1,
        width: '100%',
        maxWidth: LAYOUT.column,
        alignSelf: 'center',
        paddingHorizontal: SPACING.xl,
        paddingTop: SPACING.lg,
    },
    screenTitle: {
        fontSize: 20,
        lineHeight: 24,
        fontWeight: '600',
        color: TOKENS.surface,
        marginBottom: SPACING.lg,
    },
    notice: {
        marginBottom: SPACING.lg,
        fontSize: 14,
        lineHeight: 20,
        color: TOKENS.inkMuted,
    },

    card: {
        padding: SPACING.xl,
        borderRadius: RADIUS['2xl'],
        backgroundColor: TOKENS.surface,
    },
    cardTop: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    timeLabel: {
        marginTop: SPACING.md,
        fontSize: 14,
        color: TOKENS.textMuted,
    },
    time: {
        ...TYPOGRAPHY.numLarge,
        fontSize: 40,
        lineHeight: 46,
        fontWeight: '500',
        letterSpacing: -1,
        marginTop: 2,
    },
    timeWarning: {
        color: TOKENS.warningInk,
    },
    // Said once, in plain ink: the card's one instruction carries the rest.
    expiredTitle: {
        fontSize: 28,
        lineHeight: 34,
        fontWeight: '600',
        letterSpacing: -0.6,
        color: TOKENS.text,
    },

    track: {
        height: 6,
        marginTop: SPACING.md,
        borderRadius: 3,
        overflow: 'hidden',
        backgroundColor: TOKENS.surfaceMuted,
    },
    fill: {
        height: '100%',
        width: '100%',
        borderRadius: 3,
        backgroundColor: TOKENS.primary,
        transformOrigin: 'left',
    },
    fillWarning: {
        backgroundColor: TOKENS.warning,
    },
    endsAt: {
        marginTop: SPACING.sm,
        fontSize: 14,
        fontWeight: '500',
        color: TOKENS.text,
        fontVariant: ['tabular-nums'],
    },

    warning: {
        flexDirection: 'row',
        gap: SPACING.sm,
        marginTop: SPACING.lg,
        padding: SPACING.md,
        borderRadius: RADIUS.md,
        backgroundColor: TOKENS.warningSoft,
    },
    warningText: {
        flex: 1,
        fontSize: 14,
        lineHeight: 20,
        fontWeight: '500',
        color: TOKENS.warningInk,
    },

    // The second card opens with the place.
    place: {
        marginBottom: SPACING.sm,
    },
    details: {
        marginTop: SPACING['2xl'],
    },
    placeName: {
        fontSize: 16,
        lineHeight: 22,
        fontWeight: '600',
        color: TOKENS.text,
    },
    placeDetailLine: {
        marginTop: 2,
    },
    placeDetail: {
        fontSize: 14,
        lineHeight: 20,
        color: TOKENS.textMuted,
    },
    // Read before anything else under the place: the timer pays for nothing.
    pay: {
        marginTop: SPACING.md,
        fontSize: 14,
        lineHeight: 20,
        fontWeight: '500',
        color: TOKENS.text,
    },
    payActions: {
        marginTop: SPACING.md,
    },
    kv: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: SPACING.sm,
    },
    kvLabel: {
        fontSize: 14,
        color: TOKENS.textMuted,
    },
    kvValue: {
        fontSize: 16,
        fontWeight: '500',
        color: TOKENS.text,
        fontVariant: ['tabular-nums'],
    },

    // Extend on top, End well below it so they are never confused.
    actions: {
        marginTop: SPACING['2xl'],
    },
    extend: {
        minHeight: 54,
        paddingVertical: SPACING.md,
        borderRadius: RADIUS.lg,
        backgroundColor: TOKENS.primary,
        alignItems: 'center',
        justifyContent: 'center',
    },
    extendText: {
        fontSize: 16,
        fontWeight: '600',
        color: TOKENS.surface,
        textAlign: 'center',
        fontVariant: ['tabular-nums'],
    },
    extendNote: {
        marginTop: 2,
        fontSize: 14,
        color: alpha(TOKENS.surface, 0.85),
        textAlign: 'center',
        fontVariant: ['tabular-nums'],
    },

    // Under Extend for a few seconds: what changed, and a way back.
    undo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING.md,
        marginTop: SPACING.md,
        paddingVertical: SPACING.sm,
        paddingLeft: SPACING.lg,
        paddingRight: SPACING.xs,
        borderRadius: RADIUS.lg,
        backgroundColor: alpha(TOKENS.surface, 0.08),
    },
    undoText: {
        flex: 1,
    },
    undoTitle: {
        fontSize: 14,
        lineHeight: 20,
        fontWeight: '600',
        color: TOKENS.surface,
        fontVariant: ['tabular-nums'],
    },
    undoBody: {
        fontSize: 14,
        lineHeight: 18,
        color: TOKENS.inkMuted,
    },
    undoButton: {
        minWidth: 64,
        minHeight: 44,
        paddingHorizontal: SPACING.md,
        alignItems: 'center',
        justifyContent: 'center',
    },
    undoButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: TOKENS.surface,
        textDecorationLine: 'underline',
    },
    capped: {
        padding: SPACING.lg,
        borderRadius: RADIUS.lg,
        backgroundColor: alpha(TOKENS.surface, 0.08),
    },
    cappedTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: TOKENS.surface,
    },
    cappedBody: {
        marginTop: 2,
        fontSize: 14,
        color: TOKENS.inkMuted,
    },
    end: {
        minHeight: 48,
        marginTop: SPACING['3xl'],
        paddingVertical: SPACING.md,
        borderRadius: RADIUS.lg,
        borderWidth: 1,
        borderColor: alpha(TOKENS.surface, 0.35),
        alignItems: 'center',
        justifyContent: 'center',
    },
    endText: {
        fontSize: 16,
        fontWeight: '600',
        color: TOKENS.surface,
    },

    // Time is up: Done first, then somewhere else to park.
    done: {
        minHeight: 54,
        paddingVertical: SPACING.md,
        borderRadius: RADIUS.lg,
        backgroundColor: TOKENS.surface,
        alignItems: 'center',
        justifyContent: 'center',
    },
    doneText: {
        fontSize: 16,
        fontWeight: '600',
        color: TOKENS.text,
    },
    findParking: {
        marginTop: SPACING.md,
    },
});
