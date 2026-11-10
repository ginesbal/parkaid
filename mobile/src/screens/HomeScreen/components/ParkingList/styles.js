import { StyleSheet } from 'react-native';
import { RADIUS, SPACING, TOKENS } from '../../../../constants/theme';

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
    // Left-aligned, like the list it stands in for.
    emptyContainer: {
        flex: 1,
        paddingTop: 32,
        paddingBottom: 60,
        paddingHorizontal: 20,
    },
    emptyIcon: {
        marginBottom: 12,
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
        marginBottom: 24,
        lineHeight: 21,
        fontWeight: '400',
    },
    emptyActions: {
        width: '100%',
        gap: 10,
    },
    // The app's primary and secondary buttons, as on Details and Park.
    emptyButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 48,
        paddingHorizontal: SPACING.xl,
        paddingVertical: SPACING.md,
        backgroundColor: TOKENS.primary,
        borderRadius: RADIUS.lg,
        gap: SPACING.sm,
    },
    emptyButtonSecondary: {
        backgroundColor: 'transparent',
        borderWidth: 1,
        borderColor: TOKENS.primaryBorder,
    },
    emptyButtonPressed: {
        opacity: 0.6,
    },
    emptyButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: TOKENS.surface,
    },
    emptyButtonTextSecondary: {
        color: TOKENS.primaryInk,
    },
});
