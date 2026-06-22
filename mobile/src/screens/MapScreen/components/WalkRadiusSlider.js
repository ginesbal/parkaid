import { MaterialCommunityIcons } from '@expo/vector-icons';
import { memo, useCallback, useRef, useState } from 'react';
import { PanResponder, StyleSheet, Text, View } from 'react-native';
import {
    RADIUS_MAX,
    RADIUS_MIN,
    formatMeters,
    metersToWalkMinutes,
} from '../../../constants/parking';
import { TOKENS, alpha } from '../../../constants/theme';

const THUMB = 22;
const TRACK_HEIGHT = 4;
const SNAP_METERS = 20; // round drags to a tidy 20 m step

/**
 * WalkRadiusSlider — the on-map radius control, framed in walk time.
 *
 * A self-contained slider (track + filled portion + thumb) driven by a
 * PanResponder, so it needs no native slider dependency. Changing the radius
 * only re-filters already-fetched spots client-side, so dragging is instant
 * and never hits the network.
 */
function WalkRadiusSlider({
    radius,
    onRadiusChange,
    count = 0,
    min = RADIUS_MIN,
    max = RADIUS_MAX,
}) {
    const [trackWidth, setTrackWidth] = useState(0);

    // Refs so the PanResponder (created once) always reads fresh values.
    const trackWidthRef = useRef(0);
    const rangeRef = useRef({ min, max });
    rangeRef.current = { min, max };
    const onChangeRef = useRef(onRadiusChange);
    onChangeRef.current = onRadiusChange;

    const clampRadius = (m) => Math.min(max, Math.max(min, m));
    const filled = max > min ? (clampRadius(radius) - min) / (max - min) : 0;

    const setFromX = useCallback((x) => {
        const w = trackWidthRef.current;
        if (w <= 0) return;
        const ratio = Math.min(1, Math.max(0, x / w));
        const { min: mn, max: mx } = rangeRef.current;
        const raw = mn + ratio * (mx - mn);
        const stepped = Math.round(raw / SNAP_METERS) * SNAP_METERS;
        onChangeRef.current?.(Math.min(mx, Math.max(mn, stepped)));
    }, []);

    const panResponder = useRef(
        PanResponder.create({
            onStartShouldSetPanResponder: () => true,
            onMoveShouldSetPanResponder: () => true,
            // Keep the gesture from bubbling to the map / parent panels.
            onPanResponderTerminationRequest: () => false,
            onStartShouldSetPanResponderCapture: () => true,
            onPanResponderGrant: (e) => setFromX(e.nativeEvent.locationX),
            onPanResponderMove: (e) => setFromX(e.nativeEvent.locationX),
        })
    ).current;

    const handleTrackLayout = useCallback((e) => {
        const w = e.nativeEvent.layout.width;
        trackWidthRef.current = w;
        setTrackWidth(w);
    }, []);

    const minutes = metersToWalkMinutes(radius);
    // Keep the thumb fully inside the track; fill ends at the thumb's center.
    const usableWidth = Math.max(0, trackWidth - THUMB);
    const thumbLeft = filled * usableWidth;
    const fillWidth = thumbLeft + THUMB / 2;

    const stepRadius = useCallback((deltaMeters) => {
        onChangeRef.current?.(clampRadius(Math.round(radius + deltaMeters)));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [radius, min, max]);

    return (
        <View style={styles.container}>
            <View style={styles.labelRow}>
                <View style={styles.walkLabel}>
                    <MaterialCommunityIcons name="walk" size={16} color={TOKENS.primary} />
                    <Text style={styles.minutesText}>{minutes} min</Text>
                    <Text style={styles.metersText}>· {formatMeters(radius)}</Text>
                </View>
                <Text style={styles.countText}>
                    {count} {count === 1 ? 'spot' : 'spots'}
                </Text>
            </View>

            <View
                style={styles.sliderRow}
                accessibilityRole="adjustable"
                accessibilityLabel="Search radius"
                accessibilityValue={{ text: `${minutes} minute walk, ${formatMeters(radius)}` }}
                accessibilityActions={[
                    { name: 'increment' },
                    { name: 'decrement' },
                ]}
                onAccessibilityAction={(event) => {
                    if (event.nativeEvent.actionName === 'increment') stepRadius(SNAP_METERS * 4);
                    if (event.nativeEvent.actionName === 'decrement') stepRadius(-SNAP_METERS * 4);
                }}
                {...panResponder.panHandlers}
            >
                {/* Track + thumb are non-interactive so the full-width row is
                    always the single touch target — keeps locationX relative to
                    the row regardless of where the finger lands. */}
                <View style={styles.track} onLayout={handleTrackLayout} pointerEvents="none">
                    <View style={[styles.trackFill, { width: fillWidth }]} />
                </View>
                <View style={[styles.thumb, { left: thumbLeft }]} pointerEvents="none" />
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        gap: 8,
    },
    labelRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    walkLabel: {
        flexDirection: 'row',
        alignItems: 'baseline',
        gap: 5,
    },
    minutesText: {
        fontSize: 15,
        fontWeight: '600',
        color: TOKENS.text,
        letterSpacing: -0.2,
    },
    metersText: {
        fontSize: 13,
        fontWeight: '400',
        color: TOKENS.textMuted,
    },
    countText: {
        fontSize: 13,
        fontWeight: '500',
        color: TOKENS.textMuted,
        fontVariant: ['tabular-nums'],
    },
    // Generous vertical hit area so the thin track is easy to grab.
    sliderRow: {
        height: THUMB + 12,
        justifyContent: 'center',
    },
    track: {
        height: TRACK_HEIGHT,
        borderRadius: TRACK_HEIGHT / 2,
        backgroundColor: alpha(TOKENS.primary, 0.14),
        overflow: 'hidden',
    },
    trackFill: {
        height: TRACK_HEIGHT,
        borderRadius: TRACK_HEIGHT / 2,
        backgroundColor: TOKENS.primary,
    },
    thumb: {
        position: 'absolute',
        // Vertically centered on the track within the (THUMB + 12) tall row.
        top: 6,
        width: THUMB,
        height: THUMB,
        borderRadius: THUMB / 2,
        backgroundColor: '#fff',
        borderWidth: 2,
        borderColor: TOKENS.primary,
        // Whisper of elevation so the thumb reads above the track.
        shadowColor: TOKENS.shadow,
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.12,
        shadowRadius: 3,
        elevation: 2,
    },
});

export default memo(WalkRadiusSlider);
