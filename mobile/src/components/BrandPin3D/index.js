// BrandPin3D — the live Spline pin, over its still.
// The still shows at once. The enclosing LiveStage plays the scene with the
// 3D pin on the same spot and at the same size, and once it has drawn the
// still fades out. The still stays under reduce motion, outside a
// LiveStage, and when the scene cannot play (offline, or no WebGPU for a
// WebGPU-only export), so there is always a pin.
//
// children:  the still, starting with a size x size pin at the top-left
//            (the 3D BrandPin by default; BrandLoader passes its hopping
//            pin). Either way the 3D still, which the scene lines up with.
// suspended: show the still for now, for example while its screen is
//            scrolled and the pin has moved off its spot.

import { useCallback, useEffect, useId, useRef, useState } from 'react';
import { Animated, Platform, StyleSheet, View } from 'react-native';
import { SPLINE_LIVE } from '../../constants/spline';
import { MOTION } from '../../constants/theme';
import { useReduceMotion } from '../../hooks/useReduceMotion';
import BrandPin, { PIN_3D_FRAME } from '../BrandPin';
import { useLiveStage } from '../LiveStage';

const NATIVE = Platform.OS !== 'web';

export default function BrandPin3D({ scene, size, suspended = false, children, style }) {
    const stage = useLiveStage();
    const reduceMotion = useReduceMotion();
    const id = useId();
    const self = useRef(null);
    // False once unregistered, so a late measurement cannot register again.
    const registered = useRef(false);
    const [failed, setFailed] = useState(false);
    const stillOpacity = useRef(new Animated.Value(1)).current;

    const live = SPLINE_LIVE && Boolean(stage) && Boolean(scene?.url) && reduceMotion === false && !failed;
    const host = stage?.host;
    const register = stage?.register;
    const unregister = stage?.unregister;
    const status = stage?.status[id];

    // Where the still's pin sits on the stage.
    const measure = useCallback(() => {
        if (!live || !self.current || !host?.current) return;
        self.current.measureLayout(
            host.current,
            (x, y) => registered.current && register(id, {
                scene,
                suspended,
                cx: x + size * PIN_3D_FRAME.centerX,
                cy: y + size * PIN_3D_FRAME.centerY,
                height: size * PIN_3D_FRAME.height,
            }),
            () => {}
        );
    }, [live, host, register, id, scene, suspended, size]);

    // Before the first measurement, which registers.
    useEffect(() => {
        if (!live) return undefined;
        registered.current = true;
        return () => {
            registered.current = false;
            unregister(id);
        };
    }, [live, unregister, id]);

    // After every render too: a parent can move the still (a label appearing
    // below it, a header above it changing) without the still's own layout
    // changing. The stage ignores repeats of the same spot.
    useEffect(() => {
        measure();
    });

    useEffect(() => {
        if (status === 'failed') setFailed(true);
    }, [status]);

    // Fade to the 3D pin once it is up; snap back to the still, so there is
    // never a moment with neither.
    const showing = live && status === 'ready' && !suspended && stage.active;
    useEffect(() => {
        if (!showing) {
            stillOpacity.setValue(1);
            return;
        }
        Animated.timing(stillOpacity, {
            toValue: 0,
            duration: MOTION.duration.slow,
            easing: MOTION.easing,
            useNativeDriver: NATIVE,
        }).start();
    }, [showing, stillOpacity]);

    return (
        <View ref={self} style={style} onLayout={measure} collapsable={false}>
            <Animated.View style={[styles.still, { opacity: stillOpacity }]}>
                {children ?? <BrandPin size={size} variant="3d" />}
            </Animated.View>
        </View>
    );
}

const styles = StyleSheet.create({
    still: {
        alignItems: 'center',
    },
});
