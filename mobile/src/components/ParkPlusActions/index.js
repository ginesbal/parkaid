// ParkPlusActions — the hand-off to the City's app, under a pay line: copy
// the zone number, then open MyParking (ParkPlus) to pay with it. On white
// surfaces (the Details sheet and the session card).

import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { RADIUS, SPACING, TOKENS } from '../../constants/theme';
import { logger } from '../../utils/loggers';
import { PARKPLUS_APP_URL, getZoneNumber } from '../../utils/parkPlus';

const COPIED_FOR = 2000;

export default function ParkPlusActions({ zone, style }) {
    const number = getZoneNumber(zone);
    const [copied, setCopied] = useState(false);
    const timer = useRef(null);
    useEffect(() => () => clearTimeout(timer.current), []);

    const copy = async () => {
        // Web reports a blocked copy as false rather than throwing.
        let copiedOk = false;
        try {
            copiedOk = await Clipboard.setStringAsync(number);
        } catch (error) {
            console.warn('Failed to copy the zone:', error);
        }
        if (copiedOk === false) return;
        logger.log('parkplus_copy_zone', { zone: number }, 'UI_EVENT');
        AccessibilityInfo.announceForAccessibility?.(`Zone ${number} copied`);
        setCopied(true);
        clearTimeout(timer.current);
        timer.current = setTimeout(() => setCopied(false), COPIED_FOR);
    };

    const open = () => {
        logger.log('parkplus_open', { zone: number }, 'UI_EVENT');
        Linking.openURL(PARKPLUS_APP_URL).catch((error) => console.warn('Failed to open MyParking:', error));
    };

    return (
        <View style={[styles.row, style]}>
            <Pressable
                onPress={copy}
                style={({ pressed }) => [styles.button, pressed && styles.pressed]}
                accessibilityRole="button"
                accessibilityLabel={copied ? `Zone ${number} copied` : `Copy zone ${number}`}
            >
                <MaterialCommunityIcons name={copied ? 'check' : 'content-copy'} size={16} color={TOKENS.primaryInk} />
                <Text style={styles.text}>{copied ? 'Copied' : `Copy ${number}`}</Text>
            </Pressable>
            <Pressable
                onPress={open}
                style={({ pressed }) => [styles.button, pressed && styles.pressed]}
                accessibilityRole="link"
                accessibilityLabel="Open MyParking, the City’s ParkPlus app"
            >
                <MaterialCommunityIcons name="open-in-new" size={16} color={TOKENS.primaryInk} />
                <Text style={styles.text}>Open MyParking</Text>
            </Pressable>
        </View>
    );
}

const styles = StyleSheet.create({
    row: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: SPACING.sm,
    },
    // Each fills its share of the row, so when a narrow phone stacks them
    // they stack at the same width.
    button: {
        flexGrow: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        minHeight: 44,
        paddingHorizontal: SPACING.md,
        borderRadius: RADIUS.md,
        borderWidth: 1,
        borderColor: TOKENS.primaryBorder,
    },
    pressed: {
        opacity: 0.7,
    },
    text: {
        fontSize: 14,
        fontWeight: '600',
        color: TOKENS.primaryInk,
        fontVariant: ['tabular-nums'],
    },
});
