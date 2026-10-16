// BrandLoader — the ParkAid pin as a loading indicator.
// The pin crouches, hops and lands with a squash, after the idle beat in the
// Spline scene; its shadow shrinks as it rises. Under reduce motion it only
// breathes (opacity), with no movement. Until the setting is known it rests.
//
// `delay` keeps fast loads from flashing a loader: nothing shows until the
// wait has lasted that long.

import { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Platform, StyleSheet, Text, View } from 'react-native';
import { MOTION, SPACING, TOKENS, alpha } from '../../constants/theme';
import { useReduceMotion } from '../../hooks/useReduceMotion';
import { PIN } from '../BrandPin';

const LOOP_MS = 1400;

// react-native-web has no native animation module: a natively driven
// Animated.loop plays once there and stops. Drive it in JS on web.
const NATIVE = Platform.OS !== 'web';

// t: fraction of the loop. hop: height as a fraction of the pin size (negative is up).
const KEYFRAMES = [
    { t: 0.00, hop: 0, sx: 1, sy: 1 },
    { t: 0.12, hop: 0, sx: 1.08, sy: 0.9 },     // crouch
    { t: 0.20, hop: -0.1, sx: 0.96, sy: 1.06 }, // launch, stretched
    { t: 0.26, hop: -0.18, sx: 0.98, sy: 1.03 },
    { t: 0.32, hop: -0.23, sx: 1, sy: 1 },
    { t: 0.38, hop: -0.255, sx: 1, sy: 1 },
    { t: 0.44, hop: -0.26, sx: 1, sy: 1 },      // peak
    { t: 0.50, hop: -0.245, sx: 1, sy: 1 },
    { t: 0.56, hop: -0.2, sx: 0.99, sy: 1.02 },
    { t: 0.62, hop: -0.11, sx: 0.97, sy: 1.05 },
    { t: 0.66, hop: 0, sx: 0.97, sy: 1.04 },    // touch down
    { t: 0.72, hop: 0, sx: 1.1, sy: 0.88 },     // land squash
    { t: 0.82, hop: 0, sx: 0.98, sy: 1.02 },    // rebound
    { t: 0.90, hop: 0, sx: 1, sy: 1 },
    { t: 1.00, hop: 0, sx: 1, sy: 1 },          // rest before the next hop
];

// The tip sits at ~90% of the image height. Squash about the tip, not the centre.
const ANCHOR = 0.4;

function buildTransforms(progress, size) {
    const inputRange = KEYFRAMES.map((k) => k.t);
    const at = (fn) => progress.interpolate({ inputRange, outputRange: KEYFRAMES.map(fn) });
    return {
        pin: [
            { translateY: at((k) => k.hop * size + ANCHOR * size * (1 - k.sy)) },
            { scaleX: at((k) => k.sx) },
            { scaleY: at((k) => k.sy) },
        ],
        shadowScale: at((k) => (k.hop === 0 ? k.sx : 1 + 1.6 * k.hop)),
        shadowOpacity: at((k) => (k.hop === 0 ? 1 : 1 + 2 * k.hop)),
    };
}

export default function BrandLoader({ size = 72, label, sublabel, delay = 0, style }) {
    const reduceMotion = useReduceMotion();
    const [visible, setVisible] = useState(delay <= 0);
    const fade = useRef(new Animated.Value(0)).current;
    const progress = useRef(new Animated.Value(0)).current;
    const breathe = useRef(new Animated.Value(1)).current;
    const transforms = useRef(null);
    if (!transforms.current || transforms.current.size !== size) {
        transforms.current = { size, ...buildTransforms(progress, size) };
    }

    useEffect(() => {
        if (visible) return undefined;
        const timer = setTimeout(() => setVisible(true), delay);
        return () => clearTimeout(timer);
    }, [delay, visible]);

    useEffect(() => {
        if (!visible) return;
        Animated.timing(fade, {
            toValue: 1,
            duration: MOTION.duration.base,
            easing: MOTION.easing,
            useNativeDriver: NATIVE,
        }).start();
    }, [visible, fade]);

    useEffect(() => {
        if (!visible || reduceMotion === null) return undefined;

        const loop = reduceMotion
            ? Animated.loop(
                Animated.sequence([
                    Animated.timing(breathe, { toValue: 0.45, duration: 900, easing: Easing.inOut(Easing.ease), useNativeDriver: NATIVE }),
                    Animated.timing(breathe, { toValue: 1, duration: 900, easing: Easing.inOut(Easing.ease), useNativeDriver: NATIVE }),
                ])
            )
            : Animated.loop(
                Animated.timing(progress, { toValue: 1, duration: LOOP_MS, easing: Easing.linear, useNativeDriver: NATIVE })
            );

        // Rest pose for whichever value this mode leaves idle: progress 0 is an
        // identity transform, breathe 1 is full opacity.
        progress.setValue(0);
        breathe.setValue(1);
        loop.start();
        return () => loop.stop();
    }, [visible, reduceMotion, progress, breathe]);

    if (!visible) return null;

    // Same style shape in both modes. Swapping animated props in and out leaves
    // natively driven views stuck on their last frame, so the idle value rests.
    const { pin, shadowScale, shadowOpacity } = transforms.current;

    return (
        <Animated.View
            style={[styles.container, { opacity: fade }, style]}
            accessible
            accessibilityRole="progressbar"
            accessibilityLabel={label || 'Loading'}
            accessibilityLiveRegion="polite"
            aria-busy
        >
            {/* Headroom for the hop so it never collides with the label */}
            <View style={{ paddingTop: size * 0.28 }}>
                <Animated.Image
                    source={PIN}
                    resizeMode="contain"
                    style={{
                        width: size,
                        height: size,
                        opacity: breathe,
                        transform: pin,
                    }}
                />
                <Animated.View
                    style={[
                        styles.shadow,
                        {
                            width: size * 0.42,
                            height: Math.max(4, size * 0.07),
                            marginTop: -size * 0.12,
                            opacity: shadowOpacity,
                            transform: [{ scaleX: shadowScale }],
                        },
                    ]}
                />
            </View>
            {label ? <Text style={styles.label}>{label}</Text> : null}
            {sublabel ? <Text style={styles.sublabel}>{sublabel}</Text> : null}
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    container: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    shadow: {
        alignSelf: 'center',
        borderRadius: 999,
        backgroundColor: alpha(TOKENS.text, 0.12),
    },
    label: {
        marginTop: SPACING.lg,
        fontSize: 16,
        lineHeight: 22,
        fontWeight: '600',
        color: TOKENS.text,
        textAlign: 'center',
    },
    sublabel: {
        marginTop: SPACING.xs,
        fontSize: 14,
        lineHeight: 20,
        color: TOKENS.textMuted,
        textAlign: 'center',
    },
});
