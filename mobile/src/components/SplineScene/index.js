// SplineScene (iOS, Android) — one live Spline scene in a WebView.
// Decorative and untouchable: hidden from screen readers, and touches pass
// through to whatever is underneath.

import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { WebView } from 'react-native-webview';
import { buildSplineHtml, parseSplineMessage } from './buildHtml';

// Served from the scene's own origin: a secure context, which WebGPU needs.
const BASE_URL = 'https://prod.spline.design/';

export default function SplineScene({ scene, onReady, onError, style }) {
    const html = useMemo(() => buildSplineHtml(scene), [scene]);

    const handleMessage = (event) => {
        const message = parseSplineMessage(event.nativeEvent.data);
        if (message?.type === 'ready') onReady?.();
        else if (message?.type === 'error') onError?.(message.detail);
    };
    const handleFailure = () => onError?.('webview');

    return (
        <View
            style={style}
            pointerEvents="none"
            accessible={false}
            accessibilityElementsHidden
            importantForAccessibility="no-hide-descendants"
        >
            <WebView
                source={{ html, baseUrl: BASE_URL }}
                originWhitelist={['*']}
                onMessage={handleMessage}
                onError={handleFailure}
                onHttpError={handleFailure}
                onContentProcessDidTerminate={handleFailure}
                onRenderProcessGone={handleFailure}
                style={styles.webView}
                scrollEnabled={false}
                bounces={false}
                overScrollMode="never"
                showsHorizontalScrollIndicator={false}
                showsVerticalScrollIndicator={false}
                automaticallyAdjustContentInsets={false}
                contentInsetAdjustmentBehavior="never"
                setSupportMultipleWindows={false}
                javaScriptCanOpenWindowsAutomatically={false}
                allowsLinkPreview={false}
                textInteractionEnabled={false}
                mediaPlaybackRequiresUserAction
            />
        </View>
    );
}

const styles = StyleSheet.create({
    webView: {
        flex: 1,
        backgroundColor: 'transparent',
    },
});
