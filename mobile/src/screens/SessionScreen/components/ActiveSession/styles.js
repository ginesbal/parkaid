import { StyleSheet } from 'react-native';
import { RADIUS, TOKENS, alpha } from '../../../../constants/theme';

export const styles = StyleSheet.create({
    scrollContent: {
        paddingBottom: 32,
    },

    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 12,
        paddingHorizontal: 20,
        paddingVertical: 16,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: TOKENS.hairline,
        backgroundColor: TOKENS.surface,
    },
    headerSpot: {
        flex: 1,
        fontSize: 13,
        color: TOKENS.textMuted,
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
    // Inks, not the raw hues: amber on its own tint is under 3:1 even at 48pt.
    timerValueWarning: {
        color: TOKENS.warningInk,
    },
    timerValueDanger: {
        color: TOKENS.dangerInk,
    },
    progressContainer: {
        width: '100%',
        height: 5,
        borderRadius: 3,
        backgroundColor: alpha(TOKENS.primary, 0.14),
        overflow: 'hidden',
        marginBottom: 20,
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

    reminderNoteWrap: {
        marginHorizontal: 20,
        marginTop: 16,
    },

    // Switch prompt — a "Park here" spot arrived while this timer runs.
    switchCard: {
        marginHorizontal: 20,
        marginTop: 20,
        padding: 16,
        borderRadius: 18,
        backgroundColor: TOKENS.primaryWash,
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: TOKENS.primaryBorder,
    },
    switchTitle: {
        fontSize: 15,
        fontWeight: '600',
        color: TOKENS.text,
    },
    switchBody: {
        fontSize: 13,
        lineHeight: 18,
        color: TOKENS.textMuted,
        marginTop: 4,
    },
    switchActions: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        marginTop: 12,
    },
    switchPrimary: {
        minHeight: 44,
        paddingHorizontal: 20,
        borderRadius: RADIUS.pill,
        backgroundColor: TOKENS.primary,
        alignItems: 'center',
        justifyContent: 'center',
    },
    switchPrimaryText: {
        fontSize: 15,
        fontWeight: '600',
        color: TOKENS.onPrimary,
    },
    switchSecondary: {
        minHeight: 44,
        paddingHorizontal: 20,
        borderRadius: RADIUS.pill,
        backgroundColor: TOKENS.surface,
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: TOKENS.hairline,
        alignItems: 'center',
        justifyContent: 'center',
    },
    switchSecondaryText: {
        fontSize: 15,
        fontWeight: '600',
        color: TOKENS.text,
    },

    sectionTitle: {
        fontSize: 13,
        fontWeight: '600',
        color: TOKENS.textMuted,
        marginBottom: 10,
    },

    // Add time — one tap, inline undo.
    extendSection: {
        marginHorizontal: 20,
        marginTop: 24,
    },
    extendRow: {
        flexDirection: 'row',
        gap: 8,
    },
    extendButton: {
        flex: 1,
        minHeight: 44,
        borderRadius: RADIUS.pill,
        backgroundColor: TOKENS.surface,
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: TOKENS.primaryBorder,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 8,
    },
    extendButtonDisabled: {
        backgroundColor: TOKENS.surfaceMuted,
        borderColor: TOKENS.hairline,
        opacity: 0.6,
    },
    extendButtonText: {
        fontSize: 15,
        fontWeight: '600',
        color: TOKENS.primary,
        fontVariant: ['tabular-nums'],
    },
    extendButtonTextDisabled: {
        color: TOKENS.textMuted,
    },
    undoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        marginTop: 12,
    },
    undoText: {
        flex: 1,
        fontSize: 13,
        lineHeight: 18,
        color: TOKENS.text,
        fontVariant: ['tabular-nums'],
    },
    undoAction: {
        fontSize: 14,
        fontWeight: '600',
        color: TOKENS.primary,
    },
    extendNote: {
        fontSize: 13,
        lineHeight: 18,
        color: TOKENS.textMuted,
        marginTop: 12,
    },

    // Time's up — one clear next step.
    expiredSection: {
        marginHorizontal: 20,
        marginTop: 24,
        gap: 14,
    },
    expiredText: {
        fontSize: 15,
        lineHeight: 21,
        color: TOKENS.text,
        textAlign: 'center',
    },
    primaryButton: {
        minHeight: 54,
        borderRadius: RADIUS.pill,
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

    // Details — plain label/value rows.
    detailsCard: {
        marginHorizontal: 20,
        marginTop: 28,
    },
    detailRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 16,
        paddingVertical: 12,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: TOKENS.divider,
    },
    detailRowLast: {
        borderBottomWidth: 0,
    },
    detailLabel: {
        fontSize: 14,
        color: TOKENS.textMuted,
    },
    detailValueWrap: {
        flex: 1,
        alignItems: 'flex-end',
    },
    detailValue: {
        fontSize: 14,
        fontWeight: '600',
        color: TOKENS.text,
        textAlign: 'right',
        fontVariant: ['tabular-nums'],
    },
    detailSubvalue: {
        fontSize: 13,
        color: TOKENS.textMuted,
        marginTop: 2,
        textAlign: 'right',
    },

    // Ending early is a secondary action: quiet, not a red slab.
    endButton: {
        marginHorizontal: 20,
        marginTop: 24,
        minHeight: 48,
        borderRadius: RADIUS.pill,
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: alpha(TOKENS.danger, 0.32),
        backgroundColor: TOKENS.dangerSoft,
        alignItems: 'center',
        justifyContent: 'center',
    },
    endButtonText: {
        fontSize: 15,
        fontWeight: '600',
        color: TOKENS.dangerInk,
    },
    footnote: {
        fontSize: 12,
        lineHeight: 18,
        color: TOKENS.textMuted,
        textAlign: 'center',
        marginTop: 12,
        marginHorizontal: 20,
    },

    pressed: {
        transform: [{ scale: 0.97 }],
        opacity: 0.9,
    },
});
