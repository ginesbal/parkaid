// src/components/ParkingList/ParkingListItem.js

import { useRef } from 'react';
import {
    Animated,
    Pressable,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import { TOKENS, TYPOGRAPHY, alpha } from '../../constants/theme';
import { logger } from '../../utils/loggers';
import { getRateDisplay, getSpotKind, getSpotName } from '../../utils/spotPresentation';

// One row in the Map sheet: walk time, name and kind, rate.
export default function ParkingListItem({
    spot,
    onPress,
    isSelected = false,
}) {
    const scaleAnim = useRef(new Animated.Value(1)).current;

    const { title } = getSpotName(spot);
    const kind = getSpotKind(spot);
    const rate = getRateDisplay(spot);
    const walk = Number(spot?.walkingTime);
    const rateSpoken = rate.amount ? `${rate.amount} per hour` : rate.note;

    const handlePressIn = () => {
        Animated.timing(scaleAnim, {
            toValue: 0.98,
            duration: 120,
            useNativeDriver: true,
        }).start();
    };
    const handlePressOut = () => {
        Animated.timing(scaleAnim, {
            toValue: 1,
            duration: 200,
            useNativeDriver: true,
        }).start();
    };

    const handleRowPress = () => {
        logger.log(
            'list item tap',
            {
                spotId: spot?.id,
                address: spot?.address,
                distance: spot?.distance,
                walkingTime: spot?.walkingTime,
                rate: rate.amount || rate.short,
            },
            'UI_EVENT'
        );
        onPress?.(spot);
    };

    return (
        <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
            {/* Selected stripe — a 3px primary ink rail on the leading edge. */}
            {isSelected && <View style={styles.selectedStripe} pointerEvents="none" />}
            <Pressable
                onPress={handleRowPress}
                onPressIn={handlePressIn}
                onPressOut={handlePressOut}
                android_ripple={{ color: alpha(TOKENS.text, 0.04), borderless: false }}
                style={[styles.row, isSelected && styles.rowSelected]}
                accessibilityRole="button"
                accessibilityLabel={`${title}. ${kind}. ${Number.isFinite(walk) ? `${walk} minute walk. ` : ''}${rateSpoken}.`}
                aria-selected={isSelected}
                hitSlop={4}
            >
                {/* Walking time */}
                <View style={styles.walkBlock}>
                    <Text style={styles.walkValue}>{Number.isFinite(walk) ? walk : '\u2013'}</Text>
                    <Text style={styles.walkUnit}>min</Text>
                </View>

                <View style={styles.sectionDivider} />

                {/* Primary content */}
                <View style={styles.content}>
                    <Text style={styles.address} numberOfLines={1}>
                        {title}
                    </Text>
                    <View style={styles.metaRow}>
                        <Text style={styles.metaText}>{kind}</Text>
                        {Number.isFinite(spot?.distance) ? (
                            <>
                                <Text style={styles.metaDivider}>{'\u00B7'}</Text>
                                <Text style={styles.metaTextNum}>{spot.distance} m</Text>
                            </>
                        ) : null}
                    </View>
                </View>

                <View style={styles.sectionDivider} />

                {/* Rate */}
                <View style={styles.priceBlock}>
                    {rate.amount ? (
                        <Text style={styles.priceValue} numberOfLines={1}>
                            {rate.amount}
                            <Text style={styles.priceUnit}> /hr</Text>
                        </Text>
                    ) : (
                        <Text style={styles.priceNote} numberOfLines={1}>
                            {rate.short}
                        </Text>
                    )}
                </View>
            </Pressable>
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        minHeight: 64,
        paddingHorizontal: 20,
        paddingVertical: 12,
        // Tighter gap since the vertical rules now carry some of the separation.
        gap: 10,
        backgroundColor: TOKENS.surface,
    },
    // Selection bg tint bumped 0.05 → 0.08 so it reads at a glance without shouting.
    rowSelected: {
        backgroundColor: alpha(TOKENS.primary, 0.08),
    },
    // 3px primary rail on the leading edge — the real selection signal.
    selectedStripe: {
        position: 'absolute',
        left: 0,
        top: 0,
        bottom: 0,
        width: 3,
        backgroundColor: TOKENS.primary,
        zIndex: 1,
    },
    // Vertical hairline between info regions. Not full row height —
    // never touches the horizontal separators above/below.
    sectionDivider: {
        width: StyleSheet.hairlineWidth,
        height: 28,
        backgroundColor: TOKENS.divider,
        alignSelf: 'center',
    },

    walkBlock: {
        alignItems: 'center',
        justifyContent: 'center',
        width: 44,
    },
    // Equalized with priceValue at 18px so neither side dominates.
    walkValue: {
        ...TYPOGRAPHY.numMedium,
        fontSize: 18,
        lineHeight: 20,
        color: TOKENS.text,
    },
    walkUnit: {
        fontSize: 11,
        fontWeight: '500',
        color: TOKENS.textMuted,
        marginTop: 1,
    },

    content: {
        flex: 1,
        gap: 4,
    },
    address: {
        fontSize: 15,
        fontWeight: '600',
        color: TOKENS.text,
        letterSpacing: -0.1,
    },
    metaRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        flexWrap: 'wrap',
    },
    metaText: {
        fontSize: 13,
        fontWeight: '400',
        color: TOKENS.textMuted,
    },
    // Distance needs tabular alignment so values don't jitter as users scroll.
    metaTextNum: {
        fontSize: 13,
        fontWeight: '400',
        color: TOKENS.textMuted,
        fontVariant: ['tabular-nums'],
    },
    metaDivider: {
        fontSize: 13,
        color: TOKENS.textFaint,
    },


    priceBlock: {
        alignItems: 'flex-end',
        justifyContent: 'center',
        minWidth: 60,
    },
    priceValue: {
        fontSize: 18,
        fontWeight: '600',
        color: TOKENS.text,
        letterSpacing: -0.2,
        fontVariant: ['tabular-nums'],
    },
    priceUnit: {
        fontSize: 12,
        fontWeight: '400',
        color: TOKENS.textMuted,
    },
    priceNote: {
        fontSize: 12,
        fontWeight: '500',
        color: TOKENS.textMuted,
    },
});
