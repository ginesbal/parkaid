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
    statusBadgeWarning: {},
    statusBadgeDanger: {},
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
        color: TOKENS.danger,
    },
});
