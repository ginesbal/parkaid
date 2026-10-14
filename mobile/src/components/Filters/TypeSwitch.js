// src/components/Filters/TypeSwitch.js
//
// Which kind of parking to show, as one segmented control: a single quiet
// track with one thumb that slides to the choice, instead of a row of
// separate pills. The segments are equal widths, so the thumb only ever
// moves sideways (a transform), and Reduce Motion skips the slide.
//
//   stretch   spread the segments across the full width (Home)
//   floating  give the track its own surface, for sitting on the map

import { memo, useEffect, useRef, useState } from 'react';
import { Animated, Easing, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { NATIVE_DRIVER, TOKENS } from '../../constants/theme';
import { useReducedMotion } from '../../hooks/useReducedMotion';

export const PARKING_TYPES = [
    { key: 'all', label: 'All', hint: 'Shows all parking' },
    { key: 'on_street', label: 'Street', hint: 'Shows street parking only' },
    { key: 'off_street', label: 'Lot', hint: 'Shows parking lots only' },
    { key: 'residential', label: 'Permit', hint: 'Shows permit parking only' },
];

const PAD = 3;
const SEGMENT = 64; // width of each segment when not stretched
const SEGMENT_HEIGHT = 34;
// Phones extend each segment's touch area to 44 tall; browsers ignore
// hitSlop, so public/index.html adds the same 5 above and below.
const HIT_SLOP = { top: 5, bottom: 5 };
const WEB_HIT = Platform.OS === 'web' ? { dataSet: { hit: 'segment' } } : null;
// Keyboards treat the group as one stop, as browsers do for radio buttons:
// Tab lands on the current choice and the arrows move it.
const ARROW_STEPS = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 };

function TypeSwitch({ value, onChange, stretch = false, floating = false, style }) {
    const reduceMotion = useReducedMotion();
    const [trackWidth, setTrackWidth] = useState(0);
    const segmentWidth = stretch
        ? Math.max(0, (trackWidth - PAD * 2) / PARKING_TYPES.length)
        : SEGMENT;
    const index = Math.max(0, PARKING_TYPES.findIndex((t) => t.key === value));

    const x = useRef(new Animated.Value(index * segmentWidth)).current;
    const placedWidth = useRef(segmentWidth);
    useEffect(() => {
        const to = index * segmentWidth;
        // First measure (or a resize): jump. A new choice: slide.
        if (reduceMotion || placedWidth.current !== segmentWidth) {
            placedWidth.current = segmentWidth;
            x.setValue(to);
            return;
        }
        Animated.timing(x, {
            toValue: to,
            duration: 200,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: NATIVE_DRIVER,
        }).start();
    }, [index, segmentWidth, reduceMotion, x]);

    const segments = useRef([]);
    const onKeyDown = (event) => {
        const step = ARROW_STEPS[event.key];
        if (!step) return;
        event.preventDefault();
        const next = (index + step + PARKING_TYPES.length) % PARKING_TYPES.length;
        onChange?.(PARKING_TYPES[next].key);
        segments.current[next]?.focus?.();
    };

    return (
        <View
            style={[styles.track, floating && styles.trackFloating, !stretch && styles.trackCompact, style]}
            onLayout={stretch ? (event) => setTrackWidth(event.nativeEvent.layout.width) : undefined}
            accessibilityRole="radiogroup"
            accessibilityLabel="Parking type"
            onKeyDown={Platform.OS === 'web' ? onKeyDown : undefined}
        >
            {segmentWidth > 0 ? (
                <Animated.View
                    pointerEvents="none"
                    style={[
                        styles.thumb,
                        floating && styles.thumbFloating,
                        { width: segmentWidth, transform: [{ translateX: x }] },
                    ]}
                />
            ) : null}
            {PARKING_TYPES.map((type, i) => {
                const active = type.key === value;
                return (
                    <Pressable
                        key={type.key}
                        ref={(node) => { segments.current[i] = node; }}
                        onPress={() => onChange?.(type.key)}
                        style={[styles.segment, stretch ? styles.segmentStretch : { width: SEGMENT }]}
                        hitSlop={HIT_SLOP}
                        {...WEB_HIT}
                        {...(Platform.OS === 'web' ? { tabIndex: i === index ? 0 : -1 } : null)}
                        accessibilityRole="radio"
                        accessibilityState={{ checked: active }}
                        // React Native Web reads aria-checked, not accessibilityState.
                        aria-checked={active}
                        accessibilityLabel={type.label}
                        accessibilityHint={type.hint}
                    >
                        <Text
                            style={[
                                styles.label,
                                active && (floating ? styles.labelActiveFloating : styles.labelActive),
                            ]}
                            numberOfLines={1}
                        >
                            {type.label}
                        </Text>
                    </Pressable>
                );
            })}
        </View>
    );
}

export default memo(TypeSwitch);

const styles = StyleSheet.create({
    track: {
        flexDirection: 'row',
        padding: PAD,
        borderRadius: 12,
        backgroundColor: TOKENS.surfaceMuted,
    },
    trackCompact: {
        alignSelf: 'flex-start',
    },
    // On the map: its own surface, lifted just enough to read over streets.
    trackFloating: {
        backgroundColor: TOKENS.surfaceOverlay,
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: TOKENS.hairline,
        shadowColor: TOKENS.shadow,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.06,
        shadowRadius: 12,
        elevation: 3,
    },
    thumb: {
        position: 'absolute',
        top: PAD,
        left: PAD,
        height: SEGMENT_HEIGHT,
        borderRadius: 9,
        backgroundColor: TOKENS.surface,
        shadowColor: TOKENS.shadow,
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.08,
        shadowRadius: 2,
        elevation: 1,
    },
    // White on white wouldn't show: a cerulean wash instead.
    thumbFloating: {
        backgroundColor: TOKENS.primarySoft,
        shadowOpacity: 0,
        elevation: 0,
    },
    segment: {
        height: SEGMENT_HEIGHT,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 9,
    },
    segmentStretch: {
        flex: 1,
    },
    label: {
        fontSize: 14,
        fontWeight: '500',
        color: TOKENS.textMuted,
    },
    labelActive: {
        color: TOKENS.text,
        fontWeight: '600',
    },
    labelActiveFloating: {
        color: TOKENS.primaryInk,
        fontWeight: '600',
    },
});
