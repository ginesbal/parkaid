import { StyleSheet } from 'react-native';
import { SELECTED, TOKENS, alpha } from '../../../../constants/theme';

export const styles = StyleSheet.create({
    scrollContent: {
        paddingHorizontal: 20,
        paddingTop: 24,
        paddingBottom: 40,
    },

    header: {
        marginBottom: 24,
    },
    title: {
        fontSize: 20,
        fontWeight: '600',
        color: TOKENS.text,
        letterSpacing: -0.3,
    },
    subtitle: {
        fontSize: 14,
        lineHeight: 20,
        color: TOKENS.textMuted,
        marginTop: 6,
    },
    headerLink: {
        alignSelf: 'flex-start',
        marginTop: 4,
        paddingVertical: 12,
        fontSize: 14,
        fontWeight: '600',
        color: TOKENS.primaryInk,
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
    setupContent: {
        flex: 1,
    },
    setupLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: TOKENS.textMuted,
        marginBottom: 12,
        letterSpacing: 0,
    },

    plateInput: {
        minHeight: 50,
        borderRadius: 12,
        backgroundColor: TOKENS.surfaceMuted,
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: TOKENS.hairline,
        paddingHorizontal: 16,
        fontSize: 20,
        fontWeight: '600',
        color: TOKENS.text,
        letterSpacing: 2,
        textAlign: 'center',
        textTransform: 'uppercase',
        fontVariant: ['tabular-nums'],
    },

    places: {
        gap: 8,
    },
    place: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        minHeight: 56,
        paddingVertical: 10,
        paddingHorizontal: 12,
        borderRadius: 12,
        backgroundColor: TOKENS.surfaceMuted,
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: TOKENS.hairline,
    },
    placeActive: SELECTED.surface,
    placePressed: {
        opacity: 0.8,
    },
    placeText: {
        flex: 1,
        minWidth: 0,
    },
    placeTitle: {
        fontSize: 16,
        lineHeight: 20,
        fontWeight: '600',
        color: TOKENS.text,
    },
    placeDetail: {
        fontSize: 14,
        lineHeight: 18,
        color: TOKENS.textMuted,
        fontVariant: ['tabular-nums'],
    },
    zoneInput: {
        minHeight: 50,
        borderRadius: 12,
        backgroundColor: TOKENS.surface,
        borderWidth: 1,
        borderColor: TOKENS.hairlineStrong,
        paddingHorizontal: 16,
        fontSize: 16,
        color: TOKENS.text,
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
        borderRadius: 12,
        backgroundColor: TOKENS.surfaceMuted,
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: TOKENS.hairline,
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 10,
        paddingHorizontal: 10,
    },
    durationOptionActive: SELECTED.surface,
    durationHead: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        marginBottom: 4,
    },
    durationTime: {
        fontSize: 16,
        fontWeight: '600',
        color: TOKENS.text,
        textAlign: 'center',
        fontVariant: ['tabular-nums'],
    },
    durationTimeActive: SELECTED.text,
    durationCost: {
        fontSize: 12,
        color: TOKENS.textMuted,
        fontWeight: '500',
        textAlign: 'center',
        fontVariant: ['tabular-nums'],
    },
    durationCostActive: {
        color: SELECTED.text.color,
    },

    // Rows under a hairline, not a grey box inside the card.
    summaryBox: {
        paddingTop: 16,
        marginBottom: 16,
        borderTopWidth: StyleSheet.hairlineWidth,
        borderTopColor: TOKENS.hairline,
    },
    summaryRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    summaryLabel: {
        fontSize: 14,
        color: TOKENS.textMuted,
        fontWeight: '500',
    },
    summaryValue: {
        fontSize: 16,
        fontWeight: '500',
        color: TOKENS.text,
        fontVariant: ['tabular-nums'],
    },
    summaryValueLarge: {
        fontSize: 20,
        fontWeight: '500',
        color: TOKENS.text,
        fontVariant: ['tabular-nums'],
    },
    summaryNote: {
        marginTop: 6,
        fontSize: 14,
        lineHeight: 18,
        color: TOKENS.textMuted,
    },
    summaryDivider: {
        height: StyleSheet.hairlineWidth,
        backgroundColor: TOKENS.divider,
        marginVertical: 10,
    },

    // Directly above Start: the timer pays for nothing.
    payLine: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 8,
        marginBottom: 12,
    },
    payLineText: {
        flex: 1,
        fontSize: 14,
        lineHeight: 20,
        fontWeight: '500',
        color: TOKENS.text,
    },

    primaryButton: {
        minHeight: 54,
        borderRadius: 14,
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
    secondaryButton: {
        minHeight: 50,
        marginTop: 12,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: TOKENS.primaryBorder,
        alignItems: 'center',
        justifyContent: 'center',
    },
    secondaryButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: TOKENS.primaryInk,
    },
    summaryRows: {
        marginBottom: 20,
    },
    primaryButtonDisabled: {
        backgroundColor: alpha(TOKENS.textMuted, 0.2),
        shadowOpacity: 0,
    },
    primaryButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#fff',
    },
    primaryButtonTextDisabled: {
        color: TOKENS.textMuted,
    },
    disabledHint: {
        marginTop: 8,
        fontSize: 14,
        color: TOKENS.textMuted,
        textAlign: 'center',
    },
    hintLink: {
        fontWeight: '600',
        color: TOKENS.primaryInk,
        textDecorationLine: 'underline',
    },
    setupHint: {
        marginTop: 8,
        fontSize: 14,
        lineHeight: 18,
        color: TOKENS.textMuted,
    },
});
