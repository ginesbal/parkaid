import { StyleSheet } from 'react-native';
import { RADIUS, SPACING, TOKENS, TYPOGRAPHY } from '../../../../constants/theme';

export const styles = StyleSheet.create({
    card: {
        marginHorizontal: SPACING.xl,
        padding: SPACING.lg,
        borderRadius: RADIUS.xl,
        backgroundColor: TOKENS.surface,
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: TOKENS.hairlineStrong,
    },
    cardPressed: {
        borderColor: TOKENS.primaryBorder,
    },
    top: {
        flexDirection: 'row',
        gap: SPACING.lg,
    },
    info: {
        flex: 1,
        minWidth: 0,
    },
    reason: {
        alignSelf: 'flex-start',
        paddingHorizontal: 10,
        paddingVertical: 3,
        borderRadius: RADIUS.pill,
        backgroundColor: TOKENS.primarySoft,
        marginBottom: SPACING.sm,
    },
    reasonText: {
        fontSize: 12,
        lineHeight: 16,
        fontWeight: '600',
        color: TOKENS.primaryInk,
    },
    title: {
        fontSize: 18,
        lineHeight: 23,
        fontWeight: '600',
        letterSpacing: -0.2,
        color: TOKENS.text,
    },
    detail: {
        fontSize: 13,
        lineHeight: 18,
        color: TOKENS.textMuted,
        marginTop: 2,
    },
    meta: {
        fontSize: 13,
        lineHeight: 18,
        color: TOKENS.textMuted,
        marginTop: 2,
    },
    price: {
        ...TYPOGRAPHY.numMedium,
        fontSize: 24,
        lineHeight: 28,
        fontWeight: '600',
        marginTop: SPACING.sm,
    },
    priceUnit: {
        fontSize: 13,
        fontWeight: '400',
        letterSpacing: 0,
        color: TOKENS.textMuted,
    },
    rateNote: {
        fontSize: 15,
        lineHeight: 20,
        fontWeight: '600',
        color: TOKENS.text,
        marginTop: SPACING.sm,
    },

    button: {
        minHeight: 48,
        marginTop: SPACING.lg,
        paddingVertical: SPACING.md,
        borderRadius: RADIUS.lg,
        backgroundColor: TOKENS.primarySoft,
        alignItems: 'center',
        justifyContent: 'center',
    },
    buttonPressed: {
        backgroundColor: TOKENS.primaryFill,
    },
    buttonText: {
        fontSize: 15,
        fontWeight: '600',
        color: TOKENS.primaryInk,
        textAlign: 'center',
    },
});
