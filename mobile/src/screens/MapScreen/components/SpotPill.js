// SpotPill — how a spot looks on the map, by what it is:
//   priced: the brand pin with its hourly rate
//   street: the pin alone (no known rate: check the signs)
//   lot:    a P and "Lot" (rates posted at the lot)
//   permit: muted, a permit card and "Permit" (permit holders only)
// Selected, it turns ink and a size up; the pin then sits on a white disc so
// it stays visible. Shared by the iOS Marker and the web preview; Android
// uses SpotBadge below.

import { MaterialCommunityIcons } from '@expo/vector-icons';
import { memo } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { PIN } from '../../../components/BrandPin';
import { RADIUS, TOKENS } from '../../../constants/theme';
import { getHourlyRate, getRateDisplay } from '../../../utils/spotPresentation';

export function getMarkerKind(spot) {
    if (spot?.spot_type === 'residential') return 'permit';
    if (getHourlyRate(spot) !== null) return 'priced';
    if (spot?.spot_type === 'off_street') return 'lot';
    return 'street';
}

export function getPillLabel(spot) {
    const rate = getHourlyRate(spot);
    if (rate === null) return null;
    return `$${rate % 1 === 0 ? rate : rate.toFixed(2)}`;
}

// What a screen reader says after the spot's name.
export function getMarkerDescription(spot) {
    const rate = getRateDisplay(spot);
    return rate.amount ? `${rate.amount} per hour` : rate.note;
}

const ICONS = { lot: 'parking', permit: 'card-account-details-outline' };
const WORDS = { lot: 'Lot', permit: 'Permit' };

function Pin({ selected, size, onImageLoad }) {
    const image = (
        <Image
            source={PIN}
            style={{ width: size, height: size }}
            resizeMode="contain"
            onLoad={onImageLoad}
        />
    );
    return selected ? <View style={styles.pinDisc}>{image}</View> : image;
}

function SpotPill({ spot, selected = false, onImageLoad }) {
    const kind = getMarkerKind(spot);
    const text = kind === 'priced' ? getPillLabel(spot) : WORDS[kind];
    const permit = kind === 'permit';
    return (
        <View
            style={[
                styles.pill,
                !text && styles.pillIconOnly,
                permit && styles.pillPermit,
                selected && styles.pillSelected,
                selected && !text && styles.pillIconOnlySelected,
            ]}
        >
            {ICONS[kind] ? (
                <MaterialCommunityIcons
                    name={ICONS[kind]}
                    size={selected ? 20 : 18}
                    color={selected ? TOKENS.surface : permit ? TOKENS.textMuted : TOKENS.primaryInk}
                />
            ) : (
                <Pin selected={selected} size={selected ? 20 : 22} onImageLoad={onImageLoad} />
            )}
            {text ? (
                <Text style={[styles.label, permit && styles.labelPermit, selected && styles.labelSelected]}>
                    {text}
                </Text>
            ) : null}
        </View>
    );
}

const styles = StyleSheet.create({
    pill: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 3,
        height: 30,
        paddingLeft: 4,
        paddingRight: 10,
        borderRadius: RADIUS.pill,
        backgroundColor: TOKENS.surface,
        borderWidth: 1,
        borderColor: TOKENS.hairlineStrong,
        // Lift off the map tiles; native markers are bitmaps, so keep shadows small.
        shadowColor: TOKENS.shadow,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.12,
        shadowRadius: 4,
        elevation: 3,
    },
    pillIconOnly: {
        width: 30,
        paddingLeft: 0,
        paddingRight: 0,
        justifyContent: 'center',
    },
    // Permit-only: present, but quieter than anywhere a visitor can park.
    pillPermit: {
        paddingLeft: 7,
        backgroundColor: TOKENS.surfaceMuted,
        borderColor: TOKENS.hairline,
        shadowOpacity: 0,
        elevation: 0,
    },
    // Selected: ink and a size up, like the Details screen it leads to.
    pillSelected: {
        height: 36,
        backgroundColor: TOKENS.inkSurface,
        borderColor: TOKENS.surface,
        borderWidth: 2,
    },
    pillIconOnlySelected: {
        width: 36,
    },
    pinDisc: {
        width: 26,
        height: 26,
        borderRadius: 13,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: TOKENS.surface,
    },
    label: {
        fontSize: 13,
        fontWeight: '600',
        color: TOKENS.text,
        fontVariant: ['tabular-nums'],
    },
    labelPermit: {
        fontSize: 12,
        color: TOKENS.textMuted,
    },
    labelSelected: {
        fontSize: 15,
        color: TOKENS.surface,
    },

    badge: {
        width: 28,
        height: 28,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: TOKENS.surface,
        borderWidth: 1,
        borderColor: TOKENS.hairlineStrong,
    },
    badgePermit: {
        backgroundColor: TOKENS.surfaceMuted,
        borderColor: TOKENS.hairline,
    },
    badgeSelected: {
        backgroundColor: TOKENS.inkSurface,
        borderColor: TOKENS.surface,
        borderWidth: 2,
    },
    badgePinDisc: {
        width: 20,
        height: 20,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: TOKENS.surface,
    },
    badgeText: {
        fontSize: 12,
        fontWeight: '700',
        color: TOKENS.text,
        fontVariant: ['tabular-nums'],
    },
    badgeTextSelected: {
        color: TOKENS.surface,
    },
});

// Android (react-native-maps 1.20.1 on the new architecture) draws custom
// markers into a 100x100 px bitmap, whatever the view's size. A 28dp badge
// fits that at up to 3.5x density; a price pill would be cropped. Whole-dollar
// rates fit as text ("$5"); other rates show the pin, and the rate is in the
// sheet's featured card once selected. Lots and permit zones show their icon.
export const SpotBadge = memo(function SpotBadge({ spot, selected = false, onImageLoad }) {
    const kind = getMarkerKind(spot);
    const rate = getHourlyRate(spot);
    const text = kind === 'priced' && rate % 1 === 0 && rate < 10 ? `$${rate}` : null;
    const permit = kind === 'permit';
    let body;
    if (text) {
        body = <Text style={[styles.badgeText, selected && styles.badgeTextSelected]}>{text}</Text>;
    } else if (ICONS[kind]) {
        body = (
            <MaterialCommunityIcons
                name={ICONS[kind]}
                size={16}
                color={selected ? TOKENS.surface : permit ? TOKENS.textMuted : TOKENS.primaryInk}
            />
        );
    } else {
        const pin = <Image source={PIN} style={{ width: selected ? 14 : 18, height: selected ? 14 : 18 }} resizeMode="contain" onLoad={onImageLoad} />;
        body = selected ? <View style={styles.badgePinDisc}>{pin}</View> : pin;
    }
    return (
        <View style={[styles.badge, permit && styles.badgePermit, selected && styles.badgeSelected]}>
            {body}
        </View>
    );
});

export default memo(SpotPill);
