import { StyleSheet } from 'react-native';
import { RADIUS, TOKENS, alpha } from '../../../../constants/theme';

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
        padding: 22,
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: TOKENS.hairline,
        shadowColor: TOKENS.shadow,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.04,
        shadowRadius: 12,
        elevation: 1,
    },

    setupSection: {
        flexDirection: 'row',
        marginBottom: 20,
    },
    stepIndicator: {
        width: 30,
        height: 30,
        borderRadius: 15, // numbered step marker reads as a circle
        backgroundColor: TOKENS.surfaceMuted,
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: TOKENS.hairline,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 14,
        marginTop: 2,
    },
    stepNumber: {
        fontSize: 13,
        fontWeight: '600',
        color: TOKENS.primary,
    },
    setupContent: {
        flex: 1,
    },
    setupLabel: {
        fontSize: 13,
        fontWeight: '600',
        color: TOKENS.textMuted,
        marginBottom: 12,
        letterSpacing: 0,
    },

    plateInput: {
        minHeight: 50,
        borderRadius: RADIUS.pill, // text fields are pills, like the map search
        backgroundColor: TOKENS.surfaceMuted,
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: TOKENS.hairline,
        paddingHorizontal: 16,
        fontSize: 18,
        fontWeight: '600',
        color: TOKENS.text,
        letterSpacing: 2,
        textAlign: 'center',
        textTransform: 'uppercase',
        fontVariant: ['tabular-nums'],
    },

    durationGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        rowGap: 8,
    },
    durationOption: {
        width: '48%',
        minHeight: 60,
        borderRadius: RADIUS.xl, // two-line tile: soft, not a stretched pill
        backgroundColor: TOKENS.surfaceMuted,
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: TOKENS.hairline,
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 10,
        paddingHorizontal: 10,
    },
    durationOptionActive: {
        backgroundColor: TOKENS.primaryWash,
        borderColor: TOKENS.primary,
    },
    durationTime: {
        fontSize: 16,
        fontWeight: '600',
        color: TOKENS.text,
        marginBottom: 4,
        textAlign: 'center',
        fontVariant: ['tabular-nums'],
    },
    durationTimeActive: {
        color: TOKENS.primary,
        fontWeight: '600',
    },
    durationCost: {
        fontSize: 12,
        color: TOKENS.textMuted,
        fontWeight: '500',
        textAlign: 'center',
        fontVariant: ['tabular-nums'],
    },
    durationCostActive: {
        color: TOKENS.primary,
        fontWeight: '500',
    },

    rateOptions: {
        flexDirection: 'row',
        gap: 8,
    },
    rateOption: {
        flex: 1,
        minHeight: 44,
        borderRadius: RADIUS.pill,
        backgroundColor: TOKENS.surfaceMuted,
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: TOKENS.hairline,
        alignItems: 'center',
        justifyContent: 'center',
    },
    rateOptionActive: {
        backgroundColor: TOKENS.primary,
        borderColor: TOKENS.primary,
    },
    rateText: {
        fontSize: 12,
        fontWeight: '500',
        color: TOKENS.text,
        fontVariant: ['tabular-nums'],
    },
    rateTextActive: {
        color: TOKENS.onPrimary,
        fontWeight: '600',
    },

    summaryBox: {
        paddingVertical: 16,
        paddingHorizontal: 16,
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
        fontSize: 20,
        fontWeight: '600',
        color: TOKENS.primary,
        fontVariant: ['tabular-nums'],
    },
    summaryDivider: {
        height: StyleSheet.hairlineWidth,
        backgroundColor: TOKENS.divider,
        marginVertical: 10,
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
    primaryButtonDisabled: {
        backgroundColor: alpha(TOKENS.textMuted, 0.2),
        shadowOpacity: 0,
    },
    primaryButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: TOKENS.onPrimary,
    },
});
