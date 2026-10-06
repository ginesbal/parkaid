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

    quickInfoBar: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 14,
        paddingHorizontal: 16,
        marginBottom: 10,
        borderRadius: 14,
        backgroundColor: TOKENS.surface,
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: TOKENS.hairline,
    },
    quickInfoItem: {
        flexDirection: 'row',
        alignItems: 'baseline',
        gap: 6,
        flexShrink: 1,
    },
    quickInfoValue: {
        fontSize: 26,
        fontWeight: '600',
        color: TOKENS.text,
        letterSpacing: -0.7,
        fontVariant: ['tabular-nums'],
    },
    quickInfoLabel: {
        fontSize: 13,
        color: TOKENS.textMuted,
        flexShrink: 1,
    },
    quickInfoMeta: {
        alignItems: 'flex-end',
        marginLeft: 12,
    },
    quickInfoMetaLabel: {
        fontSize: 11,
        color: TOKENS.textMuted,
        fontWeight: '600',
    },
    quickInfoMetaValue: {
        fontSize: 13,
        color: TOKENS.primary,
        fontWeight: '600',
    },
    statsRow: {
        display: 'none',
    },

    filterBar: {
        paddingHorizontal: 20,
        paddingTop: 4,
        paddingBottom: 14,
        backgroundColor: TOKENS.surface,
    },
    filterRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 6,
        flexWrap: 'wrap',
    },
    filterChip: {
        minHeight: 44,
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 999,
        backgroundColor: TOKENS.surfaceMuted,
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: TOKENS.hairline,
        justifyContent: 'center',
    },
    filterChipActive: {
        backgroundColor: TOKENS.primary,
        borderColor: TOKENS.primary,
    },
    filterChipPressed: {
        transform: [{ scale: 0.97 }],
        opacity: 0.9,
    },
    filterChipText: {
        fontSize: 13,
        fontWeight: '500',
        color: TOKENS.text,
    },
    filterChipTextActive: {
        color: TOKENS.onPrimary,
        fontWeight: '600',
    },
    distanceRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        marginTop: 2,
        flexWrap: 'wrap',
    },
    distanceLabel: {
        fontSize: 12,
        fontWeight: '600',
        color: TOKENS.textMuted,
        letterSpacing: 0.2,
    },
    distanceOptions: {
        flex: 1,
        flexDirection: 'row',
        gap: 6,
        flexWrap: 'wrap',
    },
    distanceOption: {
        minHeight: 44,
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 999,
        backgroundColor: TOKENS.surfaceMuted,
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: TOKENS.hairline,
        justifyContent: 'center',
    },
    distanceOptionActive: {
        backgroundColor: TOKENS.primary,
        borderColor: TOKENS.primary,
    },
    distanceOptionPressed: {
        transform: [{ scale: 0.97 }],
        opacity: 0.9,
    },
    distanceOptionText: {
        fontSize: 12,
        fontWeight: '500',
        color: TOKENS.text,
    },
    distanceOptionTextActive: {
        color: TOKENS.onPrimary,
        fontWeight: '600',
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
});
