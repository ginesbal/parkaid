import { StyleSheet } from 'react-native';
import { TOKENS } from '../../constants/theme';
import { SHEET_MIN_HEIGHT } from './constants';

export const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: TOKENS.bg,
    },

    map: {
        flex: 1,
    },

    // ===== Floating header — search, then type chips =====
    topNavigation: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        backgroundColor: 'transparent',
        paddingHorizontal: 14,
        paddingBottom: 8,
        zIndex: 1000,
        // Android: without elevation, taps on the header (search + chips)
        // can fall through to the underlying MapView SurfaceView.
        // Must be >= any child's elevation so the whole header is a single
        // touch target from Android's compositor perspective.
        elevation: 10,
    },

    // No containing slab — the search pill and the chips each float
    // directly over the map with their own quiet surface.
    headerBar: {
        gap: 8,
    },

    searchContainer: {
        width: '100%',
    },

    // Parking-type chips: always in view, left-aligned under the search
    // text so the two read as one column.
    typeChips: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },

    // Faded, not removed, so the header never reflows.
    typeChipsMuted: {
        opacity: 0,
    },

    miniChip: {
        paddingHorizontal: 14,
        paddingVertical: 7,
        borderRadius: 999,
        backgroundColor: TOKENS.surfaceOverlay,
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: TOKENS.hairline,
        shadowColor: TOKENS.shadow,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.04,
        shadowRadius: 12,
        elevation: 3,
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
        color: TOKENS.onPrimary,
        fontWeight: '600',
    },

    filterChipPressed: {
        transform: [{ scale: 0.97 }],
        opacity: 0.9,
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
        borderColor: TOKENS.surface,
    },

    markerDotSelected: {
        width: 18,
        height: 18,
        borderRadius: 9,
        backgroundColor: TOKENS.primary,
        borderWidth: 2,
        borderColor: TOKENS.surface,
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
        borderColor: TOKENS.surface,
        alignItems: 'center',
        justifyContent: 'center',
    },

    pinInner: {
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: TOKENS.surface,
    },

    pinStem: {
        width: 2,
        height: 14,
        backgroundColor: TOKENS.primary,
        marginTop: -2,
    },

    // ===== Floating controls — bottom-right, in thumb reach =====
    fabContainer: {
        position: 'absolute',
        right: 16,
        bottom: SHEET_MIN_HEIGHT + 16,
        alignItems: 'flex-end',
        gap: 10,
        zIndex: 500,
    },

    // "Drop pin": a labeled pill, quieter than the solid recenter button.
    pinPill: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        minHeight: 44,
        paddingHorizontal: 16,
        borderRadius: 999,
        backgroundColor: TOKENS.surface,
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: TOKENS.hairline,
        shadowColor: TOKENS.shadow,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.04,
        shadowRadius: 12,
        elevation: 3,
    },

    pinPillText: {
        fontSize: 14,
        fontWeight: '600',
        color: TOKENS.primary,
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
        transform: [{ scale: 0.97 }],
        opacity: 0.9,
    },

    // ===== Placement controls — shown while setting the search pin =====
    // No containing panel: a floating hint capsule and two pill buttons that
    // hug their content, centered over the map.
    placementDock: {
        position: 'absolute',
        left: 14,
        right: 14,
        alignItems: 'center',
        gap: 12,
        zIndex: 700,
    },

    placementHintPill: {
        backgroundColor: TOKENS.surfaceOverlay,
        borderRadius: 999,
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: TOKENS.hairline,
        paddingHorizontal: 16,
        paddingVertical: 8,
        shadowColor: TOKENS.shadow,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.04,
        shadowRadius: 12,
        elevation: 3,
    },

    placementHintText: {
        fontSize: 13,
        fontWeight: '500',
        color: TOKENS.textMuted,
    },

    placementActions: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 8,
    },

    // minHeight, not height — the label must be free to grow with the
    // user's text size instead of clipping inside a fixed 48pt pill.
    placementBtn: {
        minHeight: 48,
        paddingVertical: 12,
        borderRadius: 999,
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'row',
        gap: 6,
        paddingHorizontal: 24,
        shadowColor: TOKENS.shadow,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.04,
        shadowRadius: 12,
        elevation: 3,
    },

    placementBtnGhost: {
        backgroundColor: TOKENS.surface,
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: TOKENS.hairline,
    },

    placementBtnPrimary: {
        backgroundColor: TOKENS.primary,
    },

    placementBtnPressed: {
        transform: [{ scale: 0.97 }],
        opacity: 0.9,
    },

    placementBtnGhostText: {
        fontSize: 15,
        fontWeight: '500',
        color: TOKENS.text,
    },

    placementBtnPrimaryText: {
        fontSize: 15,
        fontWeight: '600',
        color: TOKENS.onPrimary,
    },
});
