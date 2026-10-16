import { StyleSheet } from 'react-native';
import { RADIUS, SPACING, TOKENS } from '../../../../constants/theme';

// Every tappable control here is at least 44pt tall.
const CONTROL = 48;

export const styles = StyleSheet.create({
    // Sits on TOKENS.bg, the same colour as the brand pin still behind it.
    header: {
        paddingTop: SPACING.lg,
        paddingBottom: SPACING.sm,
    },
    pressed: {
        opacity: 0.7,
    },

    greetingRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        gap: SPACING.md,
        paddingHorizontal: SPACING.xl,
    },
    greeting: {
        flex: 1,
        fontSize: 24,
        lineHeight: 30,
        fontWeight: '600',
        letterSpacing: -0.5,
        color: TOKENS.text,
    },
    greetingPin: {
        marginTop: -4,
    },

    statusBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING.sm,
        paddingHorizontal: SPACING.xl,
        paddingTop: SPACING.md,
    },
    statusBannerInfo: {
        backgroundColor: 'transparent',
    },
    statusBannerWarning: {
        backgroundColor: 'transparent',
    },
    statusBannerText: {
        flex: 1,
        fontSize: 13,
        lineHeight: 18,
        color: TOKENS.textMuted,
    },

    searchRow: {
        flexDirection: 'row',
        gap: SPACING.sm,
        paddingHorizontal: SPACING.xl,
        marginTop: SPACING.lg,
    },
    search: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING.md,
        minHeight: CONTROL,
        paddingHorizontal: SPACING.lg,
        borderRadius: RADIUS.lg,
        backgroundColor: TOKENS.surface,
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: TOKENS.hairlineStrong,
    },
    searchText: {
        flex: 1,
        fontSize: 15,
        color: TOKENS.textLight,
    },
    filterButton: {
        width: CONTROL,
        minHeight: CONTROL,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: RADIUS.lg,
        backgroundColor: TOKENS.surface,
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: TOKENS.hairlineStrong,
    },
    filterButtonOpen: {
        backgroundColor: TOKENS.primarySoft,
        borderColor: TOKENS.primaryBorder,
    },
    filterBadge: {
        position: 'absolute',
        top: -5,
        right: -5,
        minWidth: 18,
        height: 18,
        paddingHorizontal: 4,
        borderRadius: 9,
        borderWidth: 2,
        borderColor: TOKENS.bg,
        backgroundColor: TOKENS.primary,
        alignItems: 'center',
        justifyContent: 'center',
    },
    filterBadgeText: {
        fontSize: 10,
        lineHeight: 12,
        fontWeight: '600',
        color: TOKENS.surface,
        fontVariant: ['tabular-nums'],
    },

    // Filters panel
    filterPanel: {
        marginTop: SPACING.md,
        marginHorizontal: SPACING.xl,
        paddingVertical: SPACING.md,
        borderRadius: RADIUS.lg,
        backgroundColor: TOKENS.surface,
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: TOKENS.hairline,
        gap: SPACING.md,
    },
    filterGroup: {
        gap: SPACING.sm,
    },
    filterGroupLabel: {
        paddingHorizontal: SPACING.lg,
        fontSize: 13,
        fontWeight: '600',
        color: TOKENS.textMuted,
    },
    filterOptions: {
        flexDirection: 'row',
        gap: SPACING.sm,
        paddingHorizontal: SPACING.lg,
    },
    filterOption: {
        minHeight: 44,
        paddingHorizontal: SPACING.lg,
        borderRadius: RADIUS.md,
        backgroundColor: TOKENS.surfaceMuted,
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: TOKENS.hairline,
        justifyContent: 'center',
    },
    filterOptionSelected: {
        backgroundColor: TOKENS.primary,
        borderColor: TOKENS.primary,
    },
    filterOptionText: {
        fontSize: 14,
        fontWeight: '500',
        color: TOKENS.text,
    },
    filterOptionTextSelected: {
        color: TOKENS.surface,
        fontWeight: '600',
    },
    filterNote: {
        paddingHorizontal: SPACING.lg,
        marginTop: -SPACING.xs,
        fontSize: 12,
        lineHeight: 16,
        color: TOKENS.textMuted,
    },

    // View chips
    chipRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: SPACING.sm,
        paddingHorizontal: SPACING.xl,
        marginTop: SPACING.md,
    },
    chip: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING.xs,
        minHeight: 44,
        paddingHorizontal: SPACING.lg,
        borderRadius: RADIUS.pill,
        backgroundColor: TOKENS.surface,
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: TOKENS.hairlineStrong,
    },
    chipSelected: {
        paddingLeft: SPACING.md,
        backgroundColor: TOKENS.primaryFill,
        borderColor: 'transparent',
    },
    chipText: {
        fontSize: 14,
        fontWeight: '600',
        color: TOKENS.text,
    },
    chipTextSelected: {
        color: TOKENS.primaryInk,
    },

    sectionHead: {
        flexDirection: 'row',
        alignItems: 'baseline',
        justifyContent: 'space-between',
        paddingHorizontal: SPACING.xl,
        marginTop: SPACING['2xl'],
        marginBottom: SPACING.md,
    },
    sectionTitle: {
        fontSize: 18,
        lineHeight: 24,
        fontWeight: '600',
        letterSpacing: -0.2,
        color: TOKENS.text,
    },
    sectionNote: {
        fontSize: 13,
        color: TOKENS.textMuted,
    },
    moreLabel: {
        paddingHorizontal: SPACING.xl,
        marginTop: SPACING['2xl'],
        fontSize: 13,
        fontWeight: '600',
        color: TOKENS.textMuted,
    },
});
