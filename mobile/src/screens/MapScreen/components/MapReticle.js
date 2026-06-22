import { memo } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { TOKENS, alpha } from '../../../constants/theme';

const HEAD = 34;
const STEM = 16;
const PIN_HEIGHT = HEAD + STEM;
const HALF = HEAD / 2;

/**
 * MapReticle — a screen-fixed pin used for the "set search location" flow.
 *
 * It is a plain RN overlay (not a native map marker), so it animates on the
 * native driver at 60fps and sidesteps the react-native-maps
 * `tracksViewChanges` snapshot limitation that froze the old drop animation.
 *
 * `x`/`y` are the screen coordinates the pin tip points at. The pin lifts off
 * that point while the map is moving (`lift` -> 1) and drops back when it
 * settles (`lift` -> 0); the shadow stays pinned to the ground point.
 */
function MapReticle({ lift, x, y }) {
    const translateY = lift.interpolate({ inputRange: [0, 1], outputRange: [0, -16] });
    const shadowScale = lift.interpolate({ inputRange: [0, 1], outputRange: [1, 0.55] });
    const shadowOpacity = lift.interpolate({ inputRange: [0, 1], outputRange: [0.22, 0.08] });

    return (
        <View pointerEvents="none" style={styles.layer}>
            <View style={[styles.anchor, { left: x - HALF, top: y - PIN_HEIGHT }]}>
                <Animated.View
                    style={[styles.pin, { transform: [{ translateY }] }]}
                >
                    <View style={styles.head}>
                        <View style={styles.inner} />
                    </View>
                    <View style={styles.stem} />
                </Animated.View>

                {/* Ground shadow sits at the tip (y), independent of the lift. */}
                <Animated.View
                    style={[
                        styles.shadow,
                        { opacity: shadowOpacity, transform: [{ scale: shadowScale }] },
                    ]}
                />
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    layer: {
        ...StyleSheet.absoluteFillObject,
        zIndex: 600,
    },
    anchor: {
        position: 'absolute',
        width: HEAD,
        height: PIN_HEIGHT,
        alignItems: 'center',
        justifyContent: 'flex-start',
    },
    pin: {
        alignItems: 'center',
    },
    head: {
        width: HEAD,
        height: HEAD,
        borderRadius: HEAD / 2,
        backgroundColor: TOKENS.primary,
        borderWidth: 3,
        borderColor: '#fff',
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: TOKENS.shadow,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.18,
        shadowRadius: 4,
        elevation: 4,
    },
    inner: {
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: '#fff',
    },
    stem: {
        width: 3,
        height: STEM,
        backgroundColor: TOKENS.primary,
        marginTop: -2,
        borderRadius: 2,
    },
    // Centered on the tip point: the anchor is PIN_HEIGHT tall, so bottom == y.
    shadow: {
        position: 'absolute',
        bottom: -3,
        width: 14,
        height: 5,
        borderRadius: 7,
        backgroundColor: alpha(TOKENS.shadow, 1),
    },
});

export default memo(MapReticle);
