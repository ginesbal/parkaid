import { StyleSheet } from 'react-native';
import { TOKENS } from '../../../../constants/theme';

export const styles = StyleSheet.create({
    // Loading State
    fullScreenBg: {
        flex: 1,
        backgroundColor: TOKENS.bg,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 24,
    },

    // Empty State
    emptyContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 60,
        paddingHorizontal: 28,
    },
    emptyIcon: {
        width: 80,
        height: 80,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 20,
    },
    emptyText: {
        fontSize: 16,
        fontWeight: '600',
        color: TOKENS.text,
        marginBottom: 8,
        letterSpacing: -0.1,
    },
    emptySubtext: {
        fontSize: 14,
        color: TOKENS.textMuted,
        textAlign: 'center',
        marginBottom: 24,
        lineHeight: 21,
        fontWeight: '400',
    },
    emptyActions: {
        width: '100%',
        gap: 10,
    },
    emptyButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 48,
        paddingHorizontal: 20,
        paddingVertical: 12,
        backgroundColor: TOKENS.primary,
        borderRadius: 10,
        gap: 8,
    },
    emptyButtonSecondary: {
        backgroundColor: 'transparent',
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: TOKENS.hairline,
    },
    emptyButtonPressed: {
        opacity: 0.6,
    },
    emptyButtonText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#fff',
    },
    emptyButtonTextSecondary: {
        color: TOKENS.text,
        fontWeight: '500',
    },
});
