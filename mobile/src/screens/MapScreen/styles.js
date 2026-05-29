import { StyleSheet } from 'react-native';
import { TOKENS, alpha } from '../../constants/theme';
import { SHEET_MIN_HEIGHT } from './constants';

export const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: TOKENS.bg,
    },

    map: {
        flex: 1,
    },

    // ===== Floating header — single compact bar =====
    topNavigation: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        backgroundColor: 'transparent',
        paddingHorizontal: 14,
        paddingBottom: 8,
        zIndex: 1000,
        // Android: without elevation, taps on the header (search + quick
        // actions) can fall through to the underlying MapView SurfaceView.
        // Must be >= any child's elevation so the whole header is a single
        // touch target from Android's compositor perspective.
        elevation: 10,
    },

    headerBar: {
        backgroundColor: TOKENS.surfaceOverlay,
        borderRadius: 16,
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: TOKENS.hairline,
        paddingHorizontal: 12,
        paddingVertical: 10,
        gap: 8,
        shadowColor: TOKENS.shadow,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.04,
        shadowRadius: 12,
        elevation: 3,
    },

    searchContainer: {
        width: '100%',
    },

    quickActions: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        gap: 6,
    },

    // Used to fade out the quick actions while keeping them mounted, so we
    // never reflow the header layout mid-animation.
    quickActionsHidden: {
        opacity: 0,
    },

    quickAction: {
        width: 44,
        height: 44,
        borderRadius: 12,
        backgroundColor: TOKENS.surface,
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: TOKENS.hairline,
        justifyContent: 'center',
        alignItems: 'center',
    },

    quickActionActive: {
        backgroundColor: TOKENS.primary,
        borderColor: TOKENS.primary,
    },

    quickActionPressed: {
        opacity: 0.6,
    },

    // Small count badge on the filter button
    filterBadge: {
        position: 'absolute',
        top: 2,
        right: 2,
        minWidth: 16,
        height: 16,
        paddingHorizontal: 4,
        borderRadius: 8,
        backgroundColor: TOKENS.primary,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1.5,
        borderColor: TOKENS.surface,
    },

    filterBadgeText: {
        fontSize: 10,
        fontWeight: '600',
        color: '#fff',
        letterSpacing: -0.2,
    },

    // Inline filter chips row (expandable)
    filtersInline: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        flexWrap: 'wrap',
        paddingTop: 8,
        marginTop: 2,
        borderTopWidth: StyleSheet.hairlineWidth,
        borderTopColor: TOKENS.hairline,
    },

    miniChip: {
        paddingHorizontal: 12,
        paddingVertical: 7,
        borderRadius: 10,
        backgroundColor: TOKENS.surface,
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: TOKENS.hairline,
    },

    miniChipActive: {
        backgroundColor: TOKENS.primary,
        borderColor: TOKENS.primary,
    },

    miniChipText: {
        fontSize: 12,
        fontWeight: '500',
        color: TOKENS.text,
    },

    miniChipTextActive: {
        color: '#fff',
        fontWeight: '600',
    },

    chipDivider: {
        width: 3,
        height: 3,
        borderRadius: 2,
        backgroundColor: TOKENS.hairline,
    },

    filterChipPressed: {
        opacity: 0.6,
    },

    // ===== Tooltip =====
    tooltip: {
        position: 'absolute',
        left: 16,
        backgroundColor: alpha(TOKENS.text, 0.96),
        borderRadius: 10,
        paddingHorizontal: 14,
        paddingVertical: 10,
        zIndex: 999,
    },

    tooltipArrow: {
        position: 'absolute',
        top: -6,
        left: 20,
        width: 12,
        height: 12,
        backgroundColor: alpha(TOKENS.text, 0.96),
        transform: [{ rotate: '45deg' }],
    },

    tooltipText: {
        fontSize: 12,
        color: '#fff',
        lineHeight: 16,
    },

    // ===== Markers =====
    marker: {
        width: 20,
        height: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },

    markerDot: {
        width: 14,
        height: 14,
        borderRadius: 7,
        backgroundColor: TOKENS.primary,
        borderWidth: 2,
        borderColor: '#fff',
    },

    markerDotSelected: {
        width: 18,
        height: 18,
        borderRadius: 9,
        backgroundColor: TOKENS.primary,
        borderWidth: 2,
        borderColor: '#fff',
    },

    markerSelected: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
    },

    markerPulse: {
        position: 'absolute',
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: alpha(TOKENS.primary, 0.12),
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: alpha(TOKENS.primary, 0.22),
    },

    // ===== Pin marker =====
    pinMarker: {
        alignItems: 'center',
        justifyContent: 'flex-end',
        height: 50,
    },

    pinHead: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: TOKENS.primary,
        borderWidth: 2,
        borderColor: '#fff',
        alignItems: 'center',
        justifyContent: 'center',
    },

    pinInner: {
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: '#fff',
    },

    pinStem: {
        width: 2,
        height: 14,
        backgroundColor: TOKENS.primary,
        marginTop: -2,
    },

    // ===== FABs =====
    fabContainer: {
        position: 'absolute',
        right: 16,
        bottom: SHEET_MIN_HEIGHT + 16,
        gap: 10,
        zIndex: 500,
    },

    fab: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: TOKENS.surface,
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: TOKENS.hairline,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8,
    },

    fabPrimary: {
        backgroundColor: TOKENS.primary,
        borderColor: TOKENS.primary,
        shadowColor: TOKENS.shadow,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.04,
        shadowRadius: 10,
        elevation: 3,
    },

    fabPressed: {
        opacity: 0.6,
    },

    // ===== Bottom sheet =====
    bottomSheet: {
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: TOKENS.surface,
        borderTopLeftRadius: 10,
        borderTopRightRadius: 10,
        borderTopWidth: StyleSheet.hairlineWidth,
        borderTopColor: TOKENS.hairline,
        zIndex: 100,
    },

    sheetHandle: {
        alignItems: 'center',
        paddingTop: 10,
        paddingBottom: 6,
    },

    handleBar: {
        width: 36,
        height: 3,
        backgroundColor: alpha(TOKENS.text, 0.12),
        borderRadius: 2,
    },

    sheetHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingBottom: 12,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: TOKENS.hairline,
    },

    sheetStats: {
        flexDirection: 'row',
        alignItems: 'baseline',
        gap: 4,
    },

    sheetTitle: {
        fontSize: 20,
        fontWeight: '600',
        letterSpacing: -0.3,
        color: TOKENS.text,
    },

    sheetSubtitle: {
        fontSize: 14,
        color: TOKENS.textMuted,
    },

    modeBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 10,
        paddingVertical: 5,
        gap: 4,
        borderRadius: 999,
        backgroundColor: TOKENS.surfaceMuted,
    },

    modeBadgeText: {
        fontSize: 12,
        fontWeight: '600',
        color: TOKENS.textMuted,
    },

    // ===== Map/List toggle =====
    topToggleBar: {
        flexDirection: 'row',
        gap: 8,
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: TOKENS.hairline,
        backgroundColor: TOKENS.surface,
        zIndex: 1,
    },

    topToggleButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 10,
        backgroundColor: TOKENS.surfaceMuted,
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: TOKENS.hairline,
    },

    topToggleActive: {
        backgroundColor: TOKENS.primary,
        borderColor: TOKENS.primary,
    },

    topTogglePressed: {
        opacity: 0.6,
    },

    topToggleText: {
        fontSize: 12,
        fontWeight: '500',
        color: TOKENS.text,
    },

    topToggleTextActive: {
        color: '#fff',
        fontWeight: '600',
    },

    sheetContent: {
        flex: 1,
    },

    listView: {
        paddingBottom: 20,
    },

    emptyState: {
        alignItems: 'center',
        paddingTop: 60,
        paddingHorizontal: 40,
    },

    emptyTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: TOKENS.text,
        marginTop: 12,
    },

    emptyText: {
        fontSize: 13,
        color: TOKENS.textMuted,
        textAlign: 'center',
        marginTop: 4,
    },
});
