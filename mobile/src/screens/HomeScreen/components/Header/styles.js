import { StyleSheet } from 'react-native';
import { TOKENS } from '../../../../constants/theme';

export const styles = StyleSheet.create({
    header: {
        backgroundColor: TOKENS.surface,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: TOKENS.hairline,
    },
    mainHeader: {
        paddingHorizontal: 20,
        paddingTop: 14,
        paddingBottom: 10,
    },

    locationSection: {
        flexDirection: 'row',
        alignItems: 'center',
        minHeight: 56,
        paddingHorizontal: 16,
        paddingVertical: 14,
        marginBottom: 10,
        borderRadius: 14,
        backgroundColor: TOKENS.surfaceMuted,
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: TOKENS.hairline,
    },
    locationSectionPressed: {
        opacity: 0.6,
    },
    locationIcon: {
        marginRight: 10,
    },
    locationInfo: {
        flex: 1,
    },
    locationLabel: {
        fontSize: 11,
        color: TOKENS.textMuted,
        letterSpacing: 0.6,
        marginBottom: 2,
        fontWeight: '500',
        textTransform: 'uppercase',
    },
    locationText: {
        fontSize: 18,
        fontWeight: '600',
        color: TOKENS.text,
        letterSpacing: -0.3,
    },

    // One sentence, no slab: weight carries the numbers, not size.
    quickInfoLine: {
        fontSize: 14,
        lineHeight: 20,
        color: TOKENS.textMuted,
        marginBottom: 10,
    },
    quickInfoStrong: {
        fontWeight: '600',
        color: TOKENS.text,
        fontVariant: ['tabular-nums'],
    },

    // Type, then walk: no labels or boxes around them, the controls speak
    // for themselves.
    filterBar: {
        paddingHorizontal: 20,
        paddingTop: 6,
        paddingBottom: 8,
        gap: 6,
        backgroundColor: TOKENS.surface,
    },
    statusBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        paddingVertical: 8,
        marginBottom: 4,
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
        fontWeight: '400',
    },
    statusAction: {
        fontSize: 13,
        fontWeight: '600',
        color: TOKENS.primary,
    },
    statusActionPressed: {
        transform: [{ scale: 0.97 }],
        opacity: 0.9,
    },
});
