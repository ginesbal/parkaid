// BrandPin3D — the live Spline pin, over its still.
// The still shows at once. When the scene has drawn, the still fades out and
// the 3D pin carries on at the same size and place. The still stays under
// reduce motion, and when the scene cannot play (offline, or no WebGPU for a
// WebGPU-only export), so there is always a pin.
//
// children:   the still, starting with a size x size pin at the top-left
//             (BrandPin by default; BrandLoader passes its hopping pin).
// stageWidth: room for the scene beside the pin; nothing live mounts until
//             it is known.

import { useCallback, useEffect, useRef, useState } from 'react';
import { Animated, Platform, StyleSheet, View } from 'react-native';
import { SPLINE_LIVE } from '../../constants/spline';
import { MOTION } from '../../constants/theme';
import { useReduceMotion } from '../../hooks/useReduceMotion';
import { getLiveBox } from '../../utils/splineLayout';
import BrandPin, { PIN_FRAME } from '../BrandPin';
import SplineScene from '../SplineScene';

const NATIVE = Platform.OS !== 'web';

export default function BrandPin3D({ scene, size, stageWidth, children, style }) {
    const reduceMotion = useReduceMotion();
    const [failed, setFailed] = useState(false);
    const stillOpacity = useRef(new Animated.Value(1)).current;

    const live = SPLINE_LIVE && Boolean(scene?.url) && reduceMotion === false && !failed && stageWidth > 0;

    const handleReady = useCallback(() => {
        Animated.timing(stillOpacity, {
            toValue: 0,
            duration: MOTION.duration.slow,
            easing: MOTION.easing,
            useNativeDriver: NATIVE,
        }).start();
    }, [stillOpacity]);

    const handleError = useCallback(() => setFailed(true), []);

    // Whenever the scene is not playing, the still is fully back.
    useEffect(() => {
        if (!live) stillOpacity.setValue(1);
    }, [live, stillOpacity]);

    return (
        <View style={style}>
            {live ? (
                <SplineScene
                    scene={scene}
                    onReady={handleReady}
                    onError={handleError}
                    style={getLiveBox({ size, width: stageWidth, frame: scene.frame, still: PIN_FRAME })}
                />
            ) : null}
            <Animated.View style={[styles.still, { opacity: stillOpacity }]}>
                {children ?? <BrandPin size={size} />}
            </Animated.View>
        </View>
    );
}

const styles = StyleSheet.create({
    still: {
        alignItems: 'center',
    },
});
