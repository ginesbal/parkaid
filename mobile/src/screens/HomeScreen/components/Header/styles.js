import { StyleSheet } from 'react-native';
import { RADIUS, SELECTED, SELECTED_BORDER, SPACING, TOKENS } from '../../../../constants/theme';

// What the selected border adds over the hairline, taken out of the padding.
const SELECTED_INSET = SELECTED_BORDER - StyleSheet.hairlineWidth;

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
    // A quiet hello: smaller than the spot names it sits above.
    greeting: {
        flex: 1,
        fontSize: 16,
        lineHeight: 22,
        fontWeight: '600',
        letterSpacing: -0.2,
        color: TOKENS.text,
    },
    greetingPin: {
        marginTop: -2,
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
    statusAction: {
        fontWeight: '600',
        color: TOKENS.primaryInk,
        textDecorationLine: 'underline',
    },
    statusBannerText: {
        flex: 1,
        fontSize: 14,
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
        fontSize: 16,
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
    filterButtonOpen: SELECTED.surface,
    filterBadge: {
        position: 'absolute',
        top: -6,
        right: -6,
        minWidth: 20,
        height: 20,
        paddingHorizontal: 4,
        borderRadius: 10,
        borderWidth: 2,
        borderColor: TOKENS.bg,
        backgroundColor: TOKENS.primary,
        alignItems: 'center',
        justifyContent: 'center',
    },
    filterBadgeText: {
        fontSize: 12,
        lineHeight: 14,
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
        fontSize: 14,
        fontWeight: '600',
        color: TOKENS.textMuted,
    },
    // Wraps, so every option is in view on a narrow phone.
    filterOptions: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: SPACING.sm,
        paddingHorizontal: SPACING.lg,
    },
    filterOption: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING.xs,
        minHeight: 44,
        paddingHorizontal: SPACING.lg,
        borderRadius: RADIUS.md,
        backgroundColor: TOKENS.surfaceMuted,
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: TOKENS.hairline,
        justifyContent: 'center',
    },
    filterOptionSelected: {
        ...SELECTED.surface,
        paddingHorizontal: SPACING.lg - SELECTED_INSET,
    },
    filterOptionText: {
        fontSize: 14,
        fontWeight: '500',
        color: TOKENS.text,
    },
    filterOptionTextSelected: SELECTED.text,

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
        ...SELECTED.surface,
        paddingHorizontal: SPACING.lg - SELECTED_INSET,
    },
    chipText: {
        fontSize: 14,
        fontWeight: '600',
        color: TOKENS.text,
    },
    chipTextSelected: SELECTED.text,

    // The heading, with how old the list is on its own line under it, so
    // neither squeezes the other.
    sectionHead: {
        paddingHorizontal: SPACING.xl,
        marginTop: SPACING['2xl'],
        marginBottom: SPACING.md,
    },
    sectionTitle: {
        fontSize: 20,
        lineHeight: 24,
        fontWeight: '600',
        letterSpacing: -0.2,
        color: TOKENS.text,
    },
    sectionNote: {
        marginTop: 2,
        fontSize: 12,
        lineHeight: 16,
        color: TOKENS.textMuted,
        fontVariant: ['tabular-nums'],
    },
    moreLabel: {
        paddingHorizontal: SPACING.xl,
        marginTop: SPACING['2xl'],
        marginBottom: SPACING.sm,
        fontSize: 14,
        fontWeight: '600',
        color: TOKENS.textMuted,
    },
});
