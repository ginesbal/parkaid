// src/components/Filters/WalkSlider.js
//
// How far you'll walk, as one continuous control: 1 to 25 minutes, a minute
// at a time, instead of preset distances. The minutes lead (the unit every
// list row shows); the track is a thin line with the one accent as its fill.
//
// Drag the thumb or tap anywhere along the track. Screen readers get an
// adjustable control (swipe up or down); on the web it's a slider for the
// arrow keys, Page Up/Down, Home and End. `onChange` fires as the minute
// changes, so lists and the map ring follow the finger; `onChangeEnd` fires
// once on release, for work that shouldn't run on every step.

import { MaterialCommunityIcons } from '@expo/vector-icons';
import { memo, useEffect, useMemo, useRef, useState } from 'react';
import { PanResponder, Platform, StyleSheet, Text, View } from 'react-native';
import { WALK_MINUTES, minutesToMeters, walkPhrase } from '../../constants/parking';
import { TOKENS } from '../../constants/theme';
import { getDistanceLabel } from '../../utils/parkingHelpers';
import { THUMB, minutesAt, thumbLeft } from './walkScale';

const { min: MIN, max: MAX } = WALK_MINUTES;
const KEY_STEPS = { ArrowRight: 1, ArrowUp: 1, ArrowLeft: -1, ArrowDown: -1, PageUp: 5, PageDown: -5 };
const clamp = (n) => Math.min(MAX, Math.max(MIN, n));
// Browsers would scroll the page on a touch drag; on the web the slider takes it.
const WEB_TRACK = Platform.OS === 'web' ? { touchAction: 'none', cursor: 'pointer' } : null;

function WalkSlider({ minutes, onChange, onChangeEnd, style }) {
    const [width, setWidth] = useState(0);
    const [dragging, setDragging] = useState(false);
    // Follows the finger while dragging; otherwise mirrors `minutes`.
    const [value, setValue] = useState(minutes);

    // The responder is made once, so it reads the latest values from here.
    const live = useRef({ width: 0, startX: 0, value: minutes });
    live.current.width = width;
    live.current.onChange = onChange;
    live.current.onChangeEnd = onChangeEnd;

    useEffect(() => {
        if (dragging) return;
        live.current.value = minutes;
        setValue(minutes);
    }, [minutes, dragging]);

    const update = (next) => {
        if (next === live.current.value) return;
        live.current.value = next;
        setValue(next);
        live.current.onChange?.(next);
    };

    // One step from the keyboard or a screen reader: change and commit.
    const step = (delta, absolute) => {
        const next = clamp(absolute ?? live.current.value + delta);
        update(next);
        live.current.onChangeEnd?.(next);
    };

    const responder = useMemo(() => PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        // Keep the gesture: the list or sheet around it mustn't take it over.
        onPanResponderTerminationRequest: () => false,
        onPanResponderGrant: (event) => {
            live.current.startX = event.nativeEvent.locationX;
            setDragging(true);
            update(minutesAt(live.current.startX, live.current.width));
        },
        onPanResponderMove: (_, gesture) => {
            update(minutesAt(live.current.startX + gesture.dx, live.current.width));
        },
        onPanResponderRelease: () => {
            setDragging(false);
            live.current.onChangeEnd?.(live.current.value);
        },
        onPanResponderTerminate: () => {
            setDragging(false);
            live.current.onChangeEnd?.(live.current.value);
        },
    }), []); // eslint-disable-line react-hooks/exhaustive-deps

    const handleKeyDown = (event) => {
        const { key } = event.nativeEvent;
        if (key in KEY_STEPS) step(KEY_STEPS[key]);
        else if (key === 'Home') step(0, MIN);
        else if (key === 'End') step(0, MAX);
        else return;
        event.preventDefault?.();
    };

    const left = thumbLeft(value, width);
    const spoken = `${walkPhrase(value)}, about ${getDistanceLabel(minutesToMeters(value))}`;

    return (
        <View style={[styles.row, style]}>
            {/* The slider says its own value to screen readers, so this
                visible copy of it is hidden from them. */}
            <View
                style={styles.reading}
                accessibilityElementsHidden
                importantForAccessibility="no-hide-descendants"
                aria-hidden
            >
                <MaterialCommunityIcons name="walk" size={17} color={TOKENS.textMuted} />
                <Text style={styles.minutes}>{value}</Text>
                <Text style={styles.unit}>min</Text>
            </View>

            <View
                style={[styles.track, WEB_TRACK]}
                onLayout={(event) => setWidth(event.nativeEvent.layout.width)}
                {...responder.panHandlers}
                accessible
                accessibilityRole="adjustable"
                accessibilityLabel="Walking distance"
                // Both spellings: React Native Web reads only the aria-* ones.
                accessibilityValue={{ min: MIN, max: MAX, now: value, text: spoken }}
                aria-valuemin={MIN}
                aria-valuemax={MAX}
                aria-valuenow={value}
                aria-valuetext={spoken}
                accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
                onAccessibilityAction={(event) => step(event.nativeEvent.actionName === 'increment' ? 1 : -1)}
                {...(Platform.OS === 'web' ? { tabIndex: 0, onKeyDown: handleKeyDown, dataSet: { slider: 'walk' } } : null)}
            >
                <View pointerEvents="none" style={styles.rail}>
                    <View style={[styles.fill, { width: left }]} />
                </View>
                <View
                    pointerEvents="none"
                    style={[styles.thumb, dragging && styles.thumbDragging, { left }]}
                />
            </View>
        </View>
    );
}

export default memo(WalkSlider);

const styles = StyleSheet.create({
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    // Wide enough for "25 min", so the track never shifts as digits change.
    reading: {
        flexDirection: 'row',
        alignItems: 'baseline',
        gap: 3,
        width: 74,
    },
    minutes: {
        marginLeft: 3,
        fontSize: 17,
        fontWeight: '600',
        color: TOKENS.text,
        fontVariant: ['tabular-nums'],
        letterSpacing: -0.2,
    },
    unit: {
        fontSize: 13,
        fontWeight: '500',
        color: TOKENS.textMuted,
    },
    // The whole 44-tall strip takes the touch, not just the thin line.
    track: {
        flex: 1,
        height: 44,
        justifyContent: 'center',
    },
    rail: {
        height: 4,
        borderRadius: 2,
        marginHorizontal: THUMB / 2,
        backgroundColor: TOKENS.hairlineStrong,
        overflow: 'hidden',
    },
    // The rail starts half a thumb in, so the fill ends under the thumb's centre.
    fill: {
        height: 4,
        backgroundColor: TOKENS.primary,
    },
    thumb: {
        position: 'absolute',
        top: (44 - THUMB) / 2,
        width: THUMB,
        height: THUMB,
        borderRadius: THUMB / 2,
        backgroundColor: TOKENS.surface,
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: TOKENS.hairlineStrong,
        shadowColor: TOKENS.shadow,
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.16,
        shadowRadius: 3,
        elevation: 2,
    },
    thumbDragging: {
        borderColor: TOKENS.primary,
        borderWidth: 2,
    },
});
