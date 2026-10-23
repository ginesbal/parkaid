import { StyleSheet } from 'react-native';
import { RADIUS, SPACING, TOKENS, TYPOGRAPHY } from '../../constants/theme';

export const styles = StyleSheet.create({
    screen: {
        flex: 1,
        backgroundColor: TOKENS.inkSurface,
    },
    scroll: {
        flexGrow: 1,
    },
    // Phone-width column, centred on tablets and desktop web.
    column: {
        width: '100%',
        maxWidth: 520,
        alignSelf: 'center',
        paddingHorizontal: SPACING.xl,
    },
    pressed: {
        opacity: 0.75,
    },

    nav: {
        flexDirection: 'row',
        alignItems: 'center',
        minHeight: 52,
        marginLeft: -SPACING.md,
    },
    back: {
        width: 44,
        height: 44,
        alignItems: 'center',
        justifyContent: 'center',
    },
    navTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: TOKENS.surface,
    },
    title: {
        marginTop: SPACING.md,
        fontSize: 28,
        lineHeight: 34,
        fontWeight: '600',
        letterSpacing: -0.6,
        color: TOKENS.surface,
    },
    subtitle: {
        marginTop: SPACING.xs,
        fontSize: 15,
        lineHeight: 21,
        color: TOKENS.inkMuted,
    },
    thumb: {
        marginTop: SPACING.xl,
        marginBottom: SPACING['2xl'],
    },

    // White sheet that holds everything actionable.
    sheet: {
        flexGrow: 1,
        paddingTop: SPACING['2xl'],
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        backgroundColor: TOKENS.surface,
    },
    priceRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: SPACING.md,
    },
    price: {
        ...TYPOGRAPHY.numLarge,
        fontWeight: '600',
    },
    priceUnit: {
        fontSize: 14,
        fontWeight: '400',
        letterSpacing: 0,
        color: TOKENS.textMuted,
    },
    rateNote: {
        flex: 1,
        fontSize: 20,
        lineHeight: 26,
        fontWeight: '600',
        color: TOKENS.text,
    },
    kind: {
        paddingHorizontal: SPACING.md,
        paddingVertical: SPACING.xs,
        borderRadius: RADIUS.pill,
        backgroundColor: TOKENS.primarySoft,
    },
    kindText: {
        fontSize: 13,
        fontWeight: '600',
        color: TOKENS.primaryInk,
    },
    freeNow: {
        marginTop: SPACING.xs,
        fontSize: 15,
        lineHeight: 21,
        fontWeight: '600',
        color: TOKENS.success,
        fontVariant: ['tabular-nums'],
    },
    rateBasis: {
        marginTop: SPACING.xs,
        fontSize: 13,
        lineHeight: 18,
        color: TOKENS.textMuted,
    },

    lines: {
        marginTop: SPACING.xl,
        gap: SPACING.lg,
    },
    line: {
        flexDirection: 'row',
        gap: SPACING.md,
    },
    // A plain glyph beside the line, not a tinted tile.
    lineIcon: {
        width: 22,
        paddingTop: 1,
        alignItems: 'center',
    },
    lineText: {
        flex: 1,
        paddingTop: 1,
    },
    lineTitle: {
        fontSize: 16,
        lineHeight: 21,
        fontWeight: '600',
        color: TOKENS.text,
    },
    lineBody: {
        marginTop: 2,
        fontSize: 14,
        lineHeight: 20,
        color: TOKENS.textMuted,
    },
    lineActions: {
        marginTop: SPACING.md,
    },

    actions: {
        marginTop: SPACING['3xl'],
        gap: SPACING.md,
    },
    primary: {
        minHeight: 52,
        paddingVertical: SPACING.md,
        borderRadius: RADIUS.lg,
        backgroundColor: TOKENS.primary,
        alignItems: 'center',
        justifyContent: 'center',
    },
    primaryText: {
        fontSize: 16,
        fontWeight: '600',
        color: TOKENS.surface,
        textAlign: 'center',
    },
    secondary: {
        flexDirection: 'row',
        gap: SPACING.sm,
        minHeight: 48,
        paddingVertical: SPACING.md,
        paddingHorizontal: SPACING.lg,
        borderRadius: RADIUS.lg,
        borderWidth: 1,
        borderColor: TOKENS.primaryBorder,
        alignItems: 'center',
        justifyContent: 'center',
    },
    secondaryText: {
        fontSize: 15,
        fontWeight: '600',
        color: TOKENS.primaryInk,
    },

    missing: {
        justifyContent: 'center',
        gap: SPACING.lg,
        paddingHorizontal: SPACING.xl,
    },
    missingText: {
        fontSize: 16,
        color: TOKENS.surface,
    },
});
