// src/components/ParkingList/ParkingListItem.js
//
// The list row. Hierarchy is deliberate and reads in three tiers:
//   1. Walk time (the hero) + price        — the two numbers a driver decides on
//   2. Address                             — where it is
//   3. type · distance · max stay          — quiet supporting detail
//
// Leading every row with "minutes to walk" is the app's signature. Map apps
// lead with a pin and a name; parking is really a question of "how far will I
// walk and what will it cost", so those two numbers anchor the row instead.

import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRef } from 'react';
import {
    Animated,
    Pressable,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import { TOKENS, alpha } from '../../constants/theme';
import { logger } from '../../utils/loggers';
import { getAccess, getMaxStay, getPriceInfo, getSpotType } from '../../utils/spotInfo';

const PRICE_TONE = {
    text: TOKENS.text,
    success: TOKENS.success,
    warning: TOKENS.warning,
    danger: TOKENS.danger,
    muted: TOKENS.textMuted,
};

// Short, plain-language labels for spots that aren't public parking.
const ACCESS_LABEL = { residents: 'Residents', no_parking: 'No stopping' };

export default function ParkingListItem({
    spot,
    onPress,
    isSelected = false,
}) {
    const scaleAnim = useRef(new Animated.Value(1)).current;

    const type = getSpotType(spot);
    const access = getAccess(spot);
    const isPublic = access.kind === 'public';
    const price = getPriceInfo(spot);
    const maxStay = getMaxStay(spot);
    const walk = Number.isFinite(spot?.walkingTime) ? spot.walkingTime : null;

    const handlePressIn = () => {
        Animated.timing(scaleAnim, {
            toValue: 0.985,
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
                price: price.value,
            },
            'UI_EVENT'
        );
        onPress?.(spot, { stayInList: true });
    };

    const a11yPrice =
        !isPublic ? access.detail || access.label
        : price.kind === 'paid' ? `${price.value} per hour`
        : price.kind === 'free' ? 'free'
        : 'rate not listed';

    return (
        <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
            {/* Selected: a 3px primary rail on the leading edge. Selection should
                register at a glance without tinting the whole row. */}
            {isSelected && <View style={styles.selectedStripe} pointerEvents="none" />}
            <Pressable
                onPress={handleRowPress}
                onPressIn={handlePressIn}
                onPressOut={handlePressOut}
                android_ripple={{ color: alpha(TOKENS.text, 0.04), borderless: false }}
                style={[styles.row, isSelected && styles.rowSelected]}
                accessibilityRole="button"
                accessibilityLabel={`Parking at ${spot.address}, ${walk ?? '—'} minute walk, ${spot.distance} meters away, ${a11yPrice}`}
                hitSlop={4}
            >
                {/* Tier 1a — walk time, the hero metric */}
                <View style={styles.walkBlock}>
                    <Text style={styles.walkValue}>{walk ?? '—'}</Text>
                    {walk != null && (
                        <Text style={styles.walkUnit}>{walk === 1 ? 'minute' : 'minutes'}</Text>
                    )}
                </View>

                {/* Quiet vertical rule — relates the columns without boxing them in.
                    28px tall, never touches the row separators above/below. */}
                <View style={styles.sectionDivider} />

                {/* Tier 2 + 3 — address, then supporting meta */}
                <View style={styles.content}>
                    <Text style={styles.address} numberOfLines={1}>
                        {spot.address}
                    </Text>

                    <View style={styles.metaRow}>
                        <MaterialCommunityIcons
                            name={type.icon}
                            size={13}
                            color={TOKENS.textMuted}
                            style={styles.metaIcon}
                        />
                        <Text style={styles.metaText}>{type.label}</Text>

                        {maxStay && (
                            <>
                                <Text style={styles.metaDivider}>·</Text>
                                <Text style={styles.metaText}>{maxStay.text} max</Text>
                            </>
                        )}
                    </View>
                </View>

                <View style={styles.sectionDivider} />

                {/* Tier 1b — price, or plain-language access when it isn't public. */}
                <View style={styles.priceBlock}>
                    {!isPublic ? (
                        <Text
                            style={[styles.priceTag, { color: PRICE_TONE[access.tone] || TOKENS.textMuted }]}
                            numberOfLines={1}
                        >
                            {ACCESS_LABEL[access.kind] || access.label}
                        </Text>
                    ) : price.kind === 'paid' ? (
                        <>
                            <Text style={styles.priceValue} numberOfLines={1}>{price.value}</Text>
                            {price.unit ? <Text style={styles.priceUnit}>{price.unit}</Text> : null}
                        </>
                    ) : (
                        <Text
                            style={[styles.priceTag, { color: PRICE_TONE[price.tone] || TOKENS.textMuted }]}
                            numberOfLines={1}
                        >
                            {price.value}
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
        minHeight: 76,
        paddingHorizontal: 20,
        paddingVertical: 14,
        gap: 10,
        backgroundColor: TOKENS.surface,
    },
    rowSelected: {
        backgroundColor: alpha(TOKENS.primary, 0.08),
    },
    selectedStripe: {
        position: 'absolute',
        left: 0,
        top: 0,
        bottom: 0,
        width: 3,
        backgroundColor: TOKENS.primary,
        zIndex: 1,
    },
    sectionDivider: {
        width: StyleSheet.hairlineWidth,
        height: 30,
        backgroundColor: TOKENS.divider,
        alignSelf: 'center',
    },

    // Hero metric. Width is 56 so the full word "minutes" fits beneath the
    // number; the row separators inset by 86 (padding 20 + walkBlock 56 + gap 10)
    // to align with the address.
    walkBlock: {
        alignItems: 'center',
        justifyContent: 'center',
        width: 56,
    },
    walkValue: {
        fontSize: 26,
        lineHeight: 28,
        fontWeight: '600',
        letterSpacing: -0.8,
        color: TOKENS.text,
        fontVariant: ['tabular-nums'],
    },
    walkUnit: {
        fontSize: 11,
        fontWeight: '500',
        color: TOKENS.textMuted,
        marginTop: 1,
        letterSpacing: 0.1,
    },

    content: {
        flex: 1,
        gap: 5,
    },
    address: {
        fontSize: 16,
        lineHeight: 20,
        fontWeight: '600',
        color: TOKENS.text,
        letterSpacing: -0.2,
    },
    metaRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        flexWrap: 'wrap',
    },
    metaIcon: {
        marginRight: -2,
    },
    metaText: {
        fontSize: 13,
        fontWeight: '400',
        color: TOKENS.textMuted,
    },
    metaDivider: {
        fontSize: 13,
        color: TOKENS.textFaint,
    },

    priceBlock: {
        alignItems: 'flex-end',
        justifyContent: 'center',
        minWidth: 64,
    },
    priceValue: {
        fontSize: 20,
        lineHeight: 24,
        fontWeight: '600',
        color: TOKENS.text,
        letterSpacing: -0.3,
        fontVariant: ['tabular-nums'],
    },
    // Stacked beneath the rate, right-aligned with it.
    priceUnit: {
        fontSize: 11,
        lineHeight: 13,
        fontWeight: '400',
        color: TOKENS.textMuted,
        marginTop: 1,
    },
    // Free / Permit / Check signs — a word, not a number. Sized below the dollar
    // figure so a real price always wins the eye.
    priceTag: {
        fontSize: 14,
        fontWeight: '600',
        letterSpacing: 0.1,
    },
});
