// SplineScene (web) — one live Spline scene in a sandboxed iframe, built from
// the same page as the WebView on iOS and Android. Decorative: hidden from
// screen readers and out of the tab order, and clicks pass through.

import { createElement, useEffect, useMemo, useRef } from 'react';
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

export default function SplineScene({ scene, onReady, onError, style }) {
    const frame = useRef(null);
    const html = useMemo(() => buildSplineHtml(scene), [scene]);

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
