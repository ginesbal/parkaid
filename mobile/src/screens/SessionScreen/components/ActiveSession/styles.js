import { StyleSheet } from 'react-native';
import { RADIUS, SPACING, TOKENS, TYPOGRAPHY, alpha } from '../../../../constants/theme';

export const styles = StyleSheet.create({
    // Sits on TOKENS.inkSurface (see SessionScreen).
    scroll: {
        flexGrow: 1,
        width: '100%',
        maxWidth: 520,
        alignSelf: 'center',
        paddingHorizontal: SPACING.xl,
        paddingTop: SPACING.lg,
    },
    screenTitle: {
        fontSize: 18,
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
    demo: {
        fontSize: 12,
        fontWeight: '600',
        color: TOKENS.textMuted,
        letterSpacing: 0.3,
        textTransform: 'uppercase',
    },
    timeLabel: {
        marginTop: SPACING.md,
        fontSize: 14,
        color: TOKENS.textMuted,
    },
    time: {
        ...TYPOGRAPHY.numLarge,
        fontSize: 44,
        lineHeight: 50,
        fontWeight: '600',
        letterSpacing: -1,
        marginTop: 2,
    },
    timeWarning: {
        color: TOKENS.warningInk,
    },
    timeDanger: {
        color: TOKENS.danger,
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
    fillDanger: {
        backgroundColor: TOKENS.danger,
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
    warningDanger: {
        backgroundColor: TOKENS.dangerSoft,
    },
    warningText: {
        flex: 1,
        fontSize: 14,
        lineHeight: 20,
        fontWeight: '500',
        color: TOKENS.warningInk,
    },
    warningTextDanger: {
        color: TOKENS.danger,
    },

    place: {
        marginTop: SPACING.xl,
        paddingTop: SPACING.lg,
        marginBottom: SPACING.sm,
        borderTopWidth: StyleSheet.hairlineWidth,
        borderTopColor: TOKENS.hairline,
    },
    placeName: {
        fontSize: 17,
        lineHeight: 22,
        fontWeight: '600',
        color: TOKENS.text,
    },
    placeDetail: {
        marginTop: 2,
        fontSize: 14,
        lineHeight: 20,
        color: TOKENS.textMuted,
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
        fontSize: 15,
        fontWeight: '600',
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
    // When time is up, ending is the main thing left to do.
    endPrimary: {
        marginTop: SPACING.lg,
        backgroundColor: TOKENS.surface,
        borderColor: TOKENS.surface,
    },
    endText: {
        fontSize: 15,
        fontWeight: '600',
        color: TOKENS.surface,
    },
    endTextPrimary: {
        color: TOKENS.text,
    },
});
