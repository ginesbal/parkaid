// SplineScene (web) — one live Spline scene in a sandboxed iframe, built from
// the same page as the WebView on iOS and Android. Decorative: hidden from
// screen readers and out of the tab order, and clicks pass through.

import { createElement, useEffect, useMemo, useRef, useState } from 'react';
import { View } from 'react-native';
import { buildSplineHtml, parseSplineMessage } from './buildHtml';

const FRAME_STYLE = {
    display: 'block',
    width: '100%',
    height: '100%',
    border: 0,
    background: 'transparent',
    pointerEvents: 'none',
};

export default function SplineScene({ scene, target, onReady, onError, style }) {
    const frame = useRef(null);
    // The page starts on the first target; later ones are sent to it.
    const [initialTarget] = useState(target);
    const html = useMemo(() => buildSplineHtml(scene, initialTarget), [scene, initialTarget]);

    useEffect(() => {
        const handleMessage = (event) => {
            if (event.source !== frame.current?.contentWindow) return;
            const message = parseSplineMessage(event.data);
            if (message?.type === 'ready') onReady?.();
            else if (message?.type === 'error') onError?.(message.detail);
        };
        window.addEventListener('message', handleMessage);
        return () => window.removeEventListener('message', handleMessage);
    }, [onReady, onError]);

    // Compared by value: the host builds a fresh target object each render.
    const targetKey = JSON.stringify(target);
    useEffect(() => {
        frame.current?.contentWindow?.postMessage(`{"type":"place","target":${targetKey}}`, '*');
    }, [targetKey]);

    return (
        <View style={style} pointerEvents="none" aria-hidden>
            {createElement('iframe', {
                ref: frame,
                srcDoc: html,
                sandbox: 'allow-scripts',
                title: 'ParkAid pin',
                tabIndex: -1,
                'aria-hidden': true,
                style: FRAME_STYLE,
            })}
        </View>
    );
}
