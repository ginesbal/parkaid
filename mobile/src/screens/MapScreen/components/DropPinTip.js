import { memo, useEffect, useRef, useState } from 'react';
import { Animated, Easing, Pressable, StyleSheet, Text, View } from 'react-native';
import { RADIUS, SPACING, TOKENS } from '../../../constants/theme';

// Remembered on the phone once shown; bump the suffix to show it again.
export const DROP_PIN_TIP_KEY = 'tip_drop_pin_seen_v1';

// A beat after the map appears, so the tip isn't lost in the first load.
const SHOW_AFTER_MS = 900;

/**
 * DropPinTip — a one-time hint that sits just above the Drop pin button,
 * at the point of use. It fades in rather than sliding: it should be
 * noticed, not perform, and a fade is already the reduced-motion form.
 *
 * Renders nothing until it's actually on screen, so it can't be tapped
 * while invisible; `onShown` fires then, so it's only recorded as seen
 * once someone could have seen it.
 */
function DropPinTip({ onShown, onDismiss }) {
    const [shown, setShown] = useState(false);
    const opacity = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        const timer = setTimeout(() => setShown(true), SHOW_AFTER_MS);
        return () => clearTimeout(timer);
    }, []);

    useEffect(() => {
        if (!shown) return;
        onShown?.();
        Animated.timing(opacity, {
            toValue: 1,
            duration: 200,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
        }).start();
    }, [shown, onShown, opacity]);

    if (!shown) return null;

    return (
        <Animated.View style={[styles.wrap, { opacity }]} pointerEvents="box-none">
            <View style={styles.bubble}>
                <Text style={styles.text} maxFontSizeMultiplier={2}>
                    Going somewhere else? Drop a pin to find parking there.
                </Text>
                <Pressable
                    onPress={onDismiss}
                    hitSlop={14}
                    style={({ pressed }) => pressed && styles.pressed}
                    accessibilityRole="button"
                    accessibilityLabel="Got it, dismiss tip"
                >
                    <Text style={styles.action} maxFontSizeMultiplier={2}>Got it</Text>
                </Pressable>
            </View>
            {/* Points down at the Drop pin button. */}
            <View style={styles.caret} />
        </Animated.View>
    );
}

export default memo(DropPinTip);

const styles = StyleSheet.create({
    wrap: {
        maxWidth: 280, // two lines at default text size, still clear of a 320pt screen's edge
        alignItems: 'flex-end',
    },
    bubble: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING.md,
        paddingVertical: SPACING.md,
        paddingHorizontal: SPACING.lg,
        borderRadius: RADIUS.lg,
        backgroundColor: TOKENS.text,
        shadowColor: TOKENS.shadow,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.04,
        shadowRadius: 12,
        elevation: 3,
    },
    // flexShrink, not flex: 1 — the bubble hugs its content, and a zero
    // flex basis would let the text collapse to nothing.
    text: {
        flexShrink: 1,
        fontSize: 13,
        lineHeight: 18,
        color: TOKENS.onPrimary,
    },
    action: {
        fontSize: 13,
        fontWeight: '700',
        color: TOKENS.onPrimary,
    },
    caret: {
        width: 12,
        height: 12,
        marginTop: -6,
        marginRight: 32,
        backgroundColor: TOKENS.text,
        transform: [{ rotate: '45deg' }],
        // Android stacks by elevation; match the bubble so it isn't drawn under it.
        elevation: 3,
    },
    pressed: {
        transform: [{ scale: 0.97 }],
        opacity: 0.9,
    },
});
