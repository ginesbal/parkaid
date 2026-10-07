import { StyleSheet } from 'react-native';
import { TOKENS } from '../../../../constants/theme';

export const styles = StyleSheet.create({
    // StatusBadge → dot + text, no pill bg
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        paddingVertical: 4,
    },
    statusDot: {
        width: 7,
        height: 7,
        borderRadius: 4,
        backgroundColor: TOKENS.primary,
    },
    statusDotWarning: {
        backgroundColor: TOKENS.warning,
    },
    statusDotDanger: {
        backgroundColor: TOKENS.danger,
    },
    statusText: {
        fontSize: 12,
        fontWeight: '600',
        color: TOKENS.primary,
        letterSpacing: 0.2,
    },
    statusTextWarning: {
        color: TOKENS.warningInk,
    },
    statusTextDanger: {
        color: TOKENS.dangerInk,
    },

    // ReminderNote → one quiet row with an inline fix
    reminderNote: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        paddingVertical: 12,
        paddingHorizontal: 14,
        borderRadius: 14,
        backgroundColor: TOKENS.surfaceMuted,
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: TOKENS.hairline,
    },
    reminderNoteText: {
        flex: 1,
        fontSize: 13,
        lineHeight: 18,
        color: TOKENS.textMuted,
    },
    reminderNoteAction: {
        fontSize: 14,
        fontWeight: '600',
        color: TOKENS.primary,
    },
    reminderNotePressed: {
        transform: [{ scale: 0.97 }],
        opacity: 0.9,
    },

    // InfoCard → hairline divider rows, no bg
    infoCard: {
        marginTop: 18,
        flexDirection: 'row',
        gap: 10,
        paddingVertical: 14,
        borderTopWidth: StyleSheet.hairlineWidth,
        borderTopColor: TOKENS.hairline,
    },
    infoCardWarning: {},
    infoCardError: {},
    infoIcon: {
        color: TOKENS.textMuted,
    },
    infoIconWarning: {
        color: TOKENS.warning,
    },
    infoIconError: {
        color: TOKENS.danger,
    },
    infoText: {
        flex: 1,
        fontSize: 13,
        lineHeight: 18,
        color: TOKENS.textMuted,
        fontWeight: '400',
    },
});
