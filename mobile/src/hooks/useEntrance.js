import { useEffect, useRef } from 'react';
import { Animated, Platform } from 'react-native';
import { MOTION } from '../constants/theme';
import { useReduceMotion } from './useReduceMotion';

const NATIVE = Platform.OS !== 'web';

/**
 * One-time entrance: `count` items fade in and rise MOTION.rise points,
 * staggered by MOTION.stagger. Under reduce motion they appear at once.
 * `ready` holds it until the content is actually on screen.
 * Returns one style per item; spread it onto an Animated.View or Animated.Text.
 */
export function useEntrance(count = 1, ready = true) {
    const reduceMotion = useReduceMotion();
    const values = useRef(Array.from({ length: count }, () => new Animated.Value(0))).current;
    const played = useRef(false);

    useEffect(() => {
        // Wait for the OS answer; then play once, or show everything at once.
        if (!ready || reduceMotion === null || played.current) return;
        played.current = true;
        if (reduceMotion) {
            values.forEach((v) => v.setValue(1));
            return;
        }
        Animated.stagger(
            MOTION.stagger,
            values.map((v) =>
                Animated.timing(v, {
                    toValue: 1,
                    duration: MOTION.duration.slow,
                    easing: MOTION.easing,
                    useNativeDriver: NATIVE,
                })
            )
        ).start();
    }, [ready, reduceMotion, values]);

    return values.map((v) => ({
        opacity: v,
        transform: [{ translateY: v.interpolate({ inputRange: [0, 1], outputRange: [MOTION.rise, 0] }) }],
    }));
}
