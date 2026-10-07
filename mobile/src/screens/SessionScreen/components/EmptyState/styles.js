import { StyleSheet } from 'react-native';
import { RADIUS, TOKENS } from '../../../../constants/theme';

export const styles = StyleSheet.create({
    scrollContent: {
        paddingHorizontal: 20,
        paddingTop: 24,
        paddingBottom: 40,
    },

    header: {
        alignItems: 'center',
        marginBottom: 28,
    },
    iconContainer: {
        width: 64,
        height: 44,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 12,
    },
    title: {
        fontSize: 22,
        fontWeight: '600',
        color: TOKENS.text,
        letterSpacing: -0.3,
    },
    subtitle: {
        fontSize: 14,
        color: TOKENS.textMuted,
        marginTop: 6,
    },

    setupCard: {
        backgroundColor: TOKENS.surface,
        borderRadius: 18,
        padding: 20,
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: TOKENS.hairline,
        shadowColor: TOKENS.shadow,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.04,
        shadowRadius: 12,
        elevation: 1,
    },

    setupLabel: {
        fontSize: 13,
        fontWeight: '600',
        color: TOKENS.textMuted,
        marginBottom: 10,
    },
    setupLabelSpaced: {
        marginTop: 20,
    },

    // Where — the chosen spot, a suggestion, or a way to pick one.
    spotRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        minHeight: 56,
        paddingHorizontal: 14,
        paddingVertical: 10,
        borderRadius: RADIUS.lg,
        backgroundColor: TOKENS.surfaceMuted,
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: TOKENS.hairline,
    },
    suggestionRow: {
        backgroundColor: TOKENS.surface,
        borderColor: TOKENS.primaryBorder,
    },
    spotText: {
        flex: 1,
        gap: 2,
    },
    spotAddress: {
        fontSize: 15,
        fontWeight: '600',
        color: TOKENS.text,
    },
    spotMeta: {
        fontSize: 13,
        color: TOKENS.textMuted,
        fontVariant: ['tabular-nums'],
    },
    spotClear: {
        width: 32,
        height: 32,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
    },
    suggestionLabel: {
        fontSize: 12,
        fontWeight: '500',
        color: TOKENS.textMuted,
    },
    suggestionAction: {
        fontSize: 14,
        fontWeight: '600',
        color: TOKENS.primary,
    },
    findSpotText: {
        fontSize: 15,
        fontWeight: '500',
        color: TOKENS.text,
    },

    // How long — single-line options are pills, like every other control.
    durationGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        rowGap: 8,
    },
    durationOption: {
        width: '48%',
        minHeight: 44,
        borderRadius: RADIUS.pill,
        backgroundColor: TOKENS.surfaceMuted,
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: TOKENS.hairline,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 12,
    },
    durationOptionActive: {
        backgroundColor: TOKENS.primary,
        borderColor: TOKENS.primary,
    },
    durationOptionDisabled: {
        opacity: 0.45,
    },
    durationTime: {
        fontSize: 15,
        fontWeight: '600',
        color: TOKENS.text,
        fontVariant: ['tabular-nums'],
    },
    durationTimeActive: {
        color: TOKENS.onPrimary,
    },
    durationTimeDisabled: {
        color: TOKENS.textMuted,
    },
    limitNote: {
        fontSize: 13,
        color: TOKENS.textMuted,
        marginTop: 10,
    },

    summaryBox: {
        paddingVertical: 16,
        paddingHorizontal: 16,
        marginTop: 20,
        marginBottom: 16,
        borderRadius: RADIUS.lg,
        backgroundColor: TOKENS.surfaceMuted,
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: TOKENS.hairline,
    },
    summaryRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    summaryLabel: {
        fontSize: 13,
        color: TOKENS.textMuted,
        fontWeight: '500',
    },
    summaryValue: {
        fontSize: 16,
        fontWeight: '600',
        color: TOKENS.text,
        fontVariant: ['tabular-nums'],
    },
    summaryValueLarge: {
        fontSize: 18,
        fontWeight: '600',
        color: TOKENS.primary,
        fontVariant: ['tabular-nums'],
    },
    summaryDivider: {
        height: StyleSheet.hairlineWidth,
        backgroundColor: TOKENS.divider,
        marginVertical: 10,
    },

    reminderNoteWrap: {
        marginBottom: 16,
    },

    primaryButton: {
        minHeight: 54,
        borderRadius: RADIUS.pill, // primary actions are pills app-wide
        backgroundColor: TOKENS.primary,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        shadowColor: TOKENS.shadow,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.04,
        shadowRadius: 10,
        elevation: 2,
    },
    primaryButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: TOKENS.onPrimary,
    },

    optionPressed: {
        transform: [{ scale: 0.97 }],
        opacity: 0.9,
    },
});
