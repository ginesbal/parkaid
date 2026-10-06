import { StyleSheet } from 'react-native';
import { RADIUS, TOKENS } from '../../../../constants/theme';

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
    loadingIcon: {
        width: 64,
        height: 64,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 16,
    },
    loadingText: {
        fontSize: 16,
        fontWeight: '600',
        color: TOKENS.text,
        marginBottom: 4,
        letterSpacing: -0.1,
    },
    loadingSubtext: {
        fontSize: 14,
        color: TOKENS.textMuted,
        marginBottom: 24,
    },
    loadingSkeletonStack: {
        width: '100%',
        gap: 0,
    },
    loadingSkeletonCard: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
        width: '100%',
        paddingHorizontal: 20,
        paddingVertical: 16,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: TOKENS.hairline,
    },
    loadingSkeletonBadge: {
        width: 44,
        height: 44,
        borderRadius: 6,
        backgroundColor: TOKENS.surfaceMuted,
    },
    loadingSkeletonContent: {
        flex: 1,
        gap: 8,
    },
    loadingSkeletonLineWide: {
        width: '78%',
        height: 10,
        borderRadius: 5,
        backgroundColor: TOKENS.surfaceMuted,
    },
    loadingSkeletonLine: {
        width: '56%',
        height: 8,
        borderRadius: 4,
        backgroundColor: TOKENS.surfaceMuted,
    },
    loadingSkeletonPrice: {
        width: 50,
        height: 16,
        borderRadius: 4,
        backgroundColor: TOKENS.surfaceMuted,
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
    emptyIconError: {},
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
        borderRadius: RADIUS.pill,
        gap: 8,
    },
    emptyButtonSecondary: {
        backgroundColor: 'transparent',
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: TOKENS.hairline,
    },
    emptyButtonPressed: {
        transform: [{ scale: 0.97 }],
        opacity: 0.9,
    },
    emptyButtonText: {
        fontSize: 14,
        fontWeight: '600',
        color: TOKENS.onPrimary,
    },
    emptyButtonTextSecondary: {
        color: TOKENS.text,
        fontWeight: '500',
    },
});
