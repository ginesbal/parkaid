// LiveStage — plays the live Spline pins of one screen, layered above its
// content. Each BrandPin3D inside registers where its still sits; the stage
// draws that pin's scene in a canvas running from the pin to the stage's
// bottom-right corner. The runtime's badge sits in that corner, so a screen
// shows one badge, in the corner, over the content rather than under it.
// Touches pass straight through.
//
// Scenes play only while the screen is focused; a tab in the background
// keeps its stills, and its scenes load again when it comes back.
//
// insetBottom: keep the corner clear of the home indicator on screens that
//              reach the bottom edge.

import { NavigationContext } from '@react-navigation/native';
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { SPLINE_BADGE } from '../../constants/spline';
import { getCanvasLayout } from '../../utils/splineLayout';
import SplineScene from '../SplineScene';

const LiveStageContext = createContext(null);

export const useLiveStage = () => useContext(LiveStageContext);

// Focus of the enclosing screen; always focused outside navigation.
function useScreenFocus() {
    const navigation = useContext(NavigationContext);
    const [focused, setFocused] = useState(() => navigation?.isFocused() ?? true);

    useEffect(() => {
        if (!navigation) return undefined;
        setFocused(navigation.isFocused());
        const offFocus = navigation.addListener('focus', () => setFocused(true));
        const offBlur = navigation.addListener('blur', () => setFocused(false));
        return () => {
            offFocus();
            offBlur();
        };
    }, [navigation]);

    return focused;
}

const samePin = (a, b) => Boolean(a) && a.scene === b.scene && a.suspended === b.suspended
    && Math.abs(a.cx - b.cx) < 0.5 && Math.abs(a.cy - b.cy) < 0.5 && Math.abs(a.height - b.height) < 0.5;

const without = (map, id) => {
    if (!(id in map)) return map;
    const next = { ...map };
    delete next[id];
    return next;
};

export default function LiveStage({ children, insetBottom = 0, style }) {
    const host = useRef(null);
    const active = useScreenFocus();
    const [size, setSize] = useState(null);
    // id -> { scene, cx, cy, height, suspended }, in stage points
    const [pins, setPins] = useState({});
    // id -> 'ready' | 'failed'
    const [status, setStatus] = useState({});

    const register = useCallback((id, pin) => {
        setPins((all) => (samePin(all[id], pin) ? all : { ...all, [id]: pin }));
    }, []);
    const unregister = useCallback((id) => {
        setPins((all) => without(all, id));
        setStatus((all) => without(all, id));
    }, []);

    // Scenes unmount with focus; their pins wait for a fresh 'ready'.
    useEffect(() => {
        if (!active) setStatus({});
    }, [active]);

    const value = useMemo(
        () => ({ host, size, active, status, register, unregister }),
        [size, active, status, register, unregister]
    );

    const stage = size ? { width: size.width, height: size.height - insetBottom } : null;

    return (
        <LiveStageContext.Provider value={value}>
            <View
                ref={host}
                style={[styles.stage, style]}
                collapsable={false}
                onLayout={(e) => setSize({ width: e.nativeEvent.layout.width, height: e.nativeEvent.layout.height })}
            >
                {children}
                {active && stage ? (
                    <View style={StyleSheet.absoluteFill} pointerEvents="none">
                        {Object.entries(pins).map(([id, pin]) => {
                            const { box, target } = getCanvasLayout({
                                pin,
                                stage,
                                badge: SPLINE_BADGE,
                                room: pin.scene.room,
                            });
                            return (
                                <SplineScene
                                    key={id}
                                    scene={pin.scene}
                                    target={target}
                                    onReady={() => setStatus((all) => ({ ...all, [id]: 'ready' }))}
                                    onError={() => setStatus((all) => ({ ...all, [id]: 'failed' }))}
                                    style={[box, pin.suspended && styles.hidden]}
                                />
                            );
                        })}
                    </View>
                ) : null}
            </View>
        </LiveStageContext.Provider>
    );
}

const styles = StyleSheet.create({
    stage: {
        flex: 1,
    },
    // Out of sight while its still is showing: scrolled away, for example.
    hidden: {
        opacity: 0,
    },
});
