import { StyleSheet } from 'react-native';
import { RADIUS, TOKENS, alpha } from '../../../../constants/theme';

export const styles = StyleSheet.create({
    scrollContent: {
        paddingBottom: 184,
    },

    header: {
        paddingHorizontal: 20,
        paddingVertical: 16,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: TOKENS.hairline,
        backgroundColor: TOKENS.surface,
    },
    statusBar: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 12,
    },
    locationText: {
        flex: 1,
        fontSize: 13,
        color: TOKENS.textMuted,
        fontWeight: '400',
        textAlign: 'right',
    },

    timerCard: {
        backgroundColor: TOKENS.surface,
        marginHorizontal: 20,
        marginTop: 20,
        borderRadius: 18,
        padding: 28,
        alignItems: 'center',
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: TOKENS.hairline,
        shadowColor: TOKENS.shadow,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.04,
        shadowRadius: 12,
        elevation: 1,
    },
    timerCardWarning: {
        backgroundColor: alpha(TOKENS.warning, 0.10),
        borderColor: alpha(TOKENS.warning, 0.32),
    },
    timerCardDanger: {
        backgroundColor: alpha(TOKENS.danger, 0.10),
        borderColor: alpha(TOKENS.danger, 0.32),
    },
    timerLabel: {
        fontSize: 11,
        fontWeight: '600',
        color: TOKENS.textMuted,
        letterSpacing: 0.8,
        textTransform: 'uppercase',
        marginBottom: 8,
    },
    timerValue: {
        fontSize: 48,
        fontWeight: '600',
        color: TOKENS.text,
        letterSpacing: -1,
        marginBottom: 20,
        fontVariant: ['tabular-nums'],
    },
    timerValueWarning: {
        color: TOKENS.warning,
    },
    timerValueDanger: {
        color: TOKENS.danger,
    },
    progressContainer: {
        width: '100%',
        height: 5,
        borderRadius: 3,
        backgroundColor: alpha(TOKENS.primary, 0.14),
        overflow: 'hidden',
        marginBottom: 20,
    },
    progressBackground: {
        position: 'absolute',
        left: 0,
        right: 0,
        top: 0,
        bottom: 0,
    },
    progressBar: {
        position: 'absolute',
        left: 0,
        top: 0,
        bottom: 0,
        backgroundColor: TOKENS.primary,
        borderRadius: 2,
    },
    progressBarWarning: {
        backgroundColor: TOKENS.warning,
    },
    progressBarDanger: {
        backgroundColor: TOKENS.danger,
    },
    timerMeta: {
        flexDirection: 'row',
        gap: 16,
        flexWrap: 'wrap',
        justifyContent: 'center',
    },
    timerMetaItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    timerMetaText: {
        fontSize: 13,
        color: TOKENS.textMuted,
        fontWeight: '500',
        fontVariant: ['tabular-nums'],
    },

    // Quick extend
    quickActions: {
        marginHorizontal: 20,
        marginTop: 24,
    },
    quickActionsTitle: {
        fontSize: 13,
        fontWeight: '600',
        color: TOKENS.text,
        marginBottom: 12,
    },
    extendGrid: {
        flexDirection: 'row',
        gap: 8,
    },
    extendButton: {
        flex: 1,
        backgroundColor: TOKENS.surfaceMuted,
        borderRadius: RADIUS.xl, // two-line tile
        padding: 14,
        alignItems: 'center',
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: TOKENS.hairline,
    },
    extendButtonHighlight: {
        backgroundColor: TOKENS.primaryWash,
        borderColor: TOKENS.primary,
    },
    extendButtonDisabled: {
        opacity: 0.4,
    },
    extendTopRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    extendButtonText: {
        fontSize: 13,
        fontWeight: '600',
        color: TOKENS.primary,
        marginTop: 0,
    },
    extendButtonTextDisabled: {
        color: TOKENS.textMuted,
    },
    extendButtonCost: {
        fontSize: 11,
        color: TOKENS.textMuted,
        marginTop: 2,
        fontWeight: '500',
        fontVariant: ['tabular-nums'],
    },
    extendButtonCostDisabled: {
        color: alpha(TOKENS.textMuted, 0.5),
    },

    detailsCard: {
        marginHorizontal: 20,
        marginTop: 24,
        gap: 0,
    },
    detailsTitle: {
        fontSize: 13,
        fontWeight: '600',
        color: TOKENS.textMuted,
        marginBottom: 10,
        letterSpacing: 0.3,
        textTransform: 'uppercase',
    },
    detailRow: {
        flexDirection: 'row',
        paddingVertical: 14,
        paddingHorizontal: 0,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: TOKENS.divider,
    },
    detailIcon: {
        width: 34,
        height: 34,
        borderRadius: 17, // icon badge reads as a circle
        backgroundColor: TOKENS.surfaceMuted,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    detailContent: {
        flex: 1,
    },
    detailLabel: {
        fontSize: 11,
        color: TOKENS.textMuted,
        marginBottom: 4,
        letterSpacing: 0.3,
        fontWeight: '500',
        textTransform: 'uppercase',
    },
    detailValue: {
        fontSize: 15,
        fontWeight: '600',
        color: TOKENS.text,
    },
    detailSubvalue: {
        fontSize: 13,
        color: TOKENS.textMuted,
        marginTop: 2,
        fontVariant: ['tabular-nums'],
        fontWeight: '500',
    },

    // Bottom actions
    bottomActions: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: TOKENS.surface,
        borderTopWidth: StyleSheet.hairlineWidth,
        borderTopColor: TOKENS.hairline,
        paddingHorizontal: 20,
        paddingTop: 16,
        paddingBottom: 8,
    },
    endButton: {
        minHeight: 54,
        borderRadius: RADIUS.pill,
        backgroundColor: TOKENS.danger,
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
    endButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: TOKENS.onPrimary,
    },
    bottomHint: {
        fontSize: 12,
        color: TOKENS.textMuted,
        textAlign: 'center',
        marginTop: 8,
        fontWeight: '400',
        lineHeight: 18,
    },
});
