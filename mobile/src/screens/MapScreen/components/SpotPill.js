// SpotPill — how a spot looks on the map, by what it is:
//   priced: the brand pin with its hourly rate
//   street: the pin alone (no known rate: check the signs)
//   lot:    a P and "Lot" (rates posted at the lot)
//   permit: muted, a permit card and "Permit" (permit holders only)
//   closed: muted, a crossed-out car (no parking now: rush hour)
// Selected, it turns ink and a size up; the pin then sits on a white disc so
// it stays visible. Shared by the iOS Marker and the web preview; Android
// uses SpotBadge below. Spots too close to tell apart at the map's scale
// share one GroupPill (utils/mapGroups).

import { MaterialCommunityIcons } from '@expo/vector-icons';
import { memo } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { PIN } from '../../../components/BrandPin';
import { RADIUS, TOKENS } from '../../../constants/theme';
import { getCaution, getHourlyRate, getRateDisplay, isRestrictedNow } from '../../../utils/spotPresentation';

export function getMarkerKind(spot, now = Date.now()) {
    if (spot?.spot_type === 'residential') return 'permit';
    if (isRestrictedNow(spot, now)) return 'closed';
    if (getHourlyRate(spot, now) !== null) return 'priced';
    if (spot?.spot_type === 'off_street') return 'lot';
    return 'street';
}

// "$2", "$2.25", or "Free".
const rateLabel = (rate) => (rate === 0 ? 'Free' : `$${rate % 1 === 0 ? rate : rate.toFixed(2)}`);

// "$2", "$2.25", or "Free" while the City isn't charging.
export function getPillLabel(spot, now = Date.now()) {
    const rate = getHourlyRate(spot, now);
    return rate === null ? null : rateLabel(rate);
}

// The lowest rate now among a group's spots where anyone may park now, or
// null when none has one.
function lowestRate(spots, now) {
    const rates = spots.filter((s) => getMarkerKind(s, now) === 'priced').map((s) => getHourlyRate(s, now));
    return rates.length ? Math.min(...rates) : null;
}

// A group's label: its lowest rate ("$1.75", "Free"), else what its lead is
// ("Lot", "Permit"), else nothing.
export function getGroupLabel(spots, now = Date.now()) {
    const low = lowestRate(spots, now);
    return low !== null ? rateLabel(low) : (WORDS[getMarkerKind(spots[0], now)] ?? null);
}

// What a screen reader says for a group, on the phones.
export function getGroupDescription(spots, now = Date.now()) {
    const low = lowestRate(spots, now);
    const from = low === null ? '' : low === 0 ? ', one free now' : `, from $${low.toFixed(2)} per hour`;
    return `${spots.length} spots close together${from}`;
}

// What a screen reader says after the spot's name.
export function getMarkerDescription(spot, now = Date.now()) {
    if (isRestrictedNow(spot, now)) return getCaution(spot, now).replace(/\u00A0/g, ' ');
    return getRateDisplay(spot, now).spoken;
}

const ICONS = { lot: 'parking', permit: 'card-account-details-outline', closed: 'car-off' };
// Quieter than anywhere a visitor can park now.
const MUTED = new Set(['permit', 'closed']);
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

function SpotPill({ spot, selected = false, onImageLoad, now = Date.now() }) {
    const kind = getMarkerKind(spot, now);
    const text = kind === 'priced' ? getPillLabel(spot, now) : WORDS[kind];
    const muted = MUTED.has(kind);
    return (
        <View
            style={[
                styles.pill,
                muted && styles.pillPermit,
                !text && styles.pillIconOnly,
                selected && styles.pillSelected,
                selected && !text && styles.pillIconOnlySelected,
            ]}
        >
            {ICONS[kind] ? (
                <MaterialCommunityIcons
                    name={ICONS[kind]}
                    size={selected ? 20 : 18}
                    color={selected ? TOKENS.surface : muted ? TOKENS.textMuted : TOKENS.primaryInk}
                />
            ) : (
                <Pin selected={selected} size={selected ? 20 : 22} onImageLoad={onImageLoad} />
            )}
            {text ? (
                <Text style={[styles.label, muted && styles.labelPermit, selected && styles.labelSelected]}>
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
        fontSize: 12,
        fontWeight: '600',
        color: TOKENS.text,
        fontVariant: ['tabular-nums'],
    },
    labelPermit: {
        fontSize: 12,
        color: TOKENS.textMuted,
    },
    labelSelected: {
        fontSize: 14,
        color: TOKENS.surface,
    },
    // A group's count, where a pin has its icon.
    count: {
        minWidth: 22,
        height: 22,
        paddingHorizontal: 5,
        borderRadius: 11,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: TOKENS.inkSurface,
    },
    countMuted: {
        backgroundColor: TOKENS.textMuted,
    },
    countText: {
        fontSize: 12,
        fontWeight: '700',
        color: TOKENS.surface,
        fontVariant: ['tabular-nums'],
    },
    groupMuted: {
        paddingLeft: 4,
    },
    groupCountOnly: {
        paddingRight: 4,
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
    badgeGroup: {
        backgroundColor: TOKENS.inkSurface,
        borderColor: TOKENS.surface,
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
export const SpotBadge = memo(function SpotBadge({ spot, selected = false, onImageLoad, now = Date.now() }) {
    const kind = getMarkerKind(spot, now);
    const rate = getHourlyRate(spot, now);
    const text = kind === 'priced' && rate > 0 && rate % 1 === 0 && rate < 10 ? `$${rate}` : null;
    const muted = MUTED.has(kind);
    let body;
    if (text) {
        body = <Text style={[styles.badgeText, selected && styles.badgeTextSelected]}>{text}</Text>;
    } else if (ICONS[kind]) {
        body = (
            <MaterialCommunityIcons
                name={ICONS[kind]}
                size={16}
                color={selected ? TOKENS.surface : muted ? TOKENS.textMuted : TOKENS.primaryInk}
            />
        );
    } else {
        const pin = <Image source={PIN} style={{ width: selected ? 14 : 18, height: selected ? 14 : 18 }} resizeMode="contain" onLoad={onImageLoad} />;
        body = selected ? <View style={styles.badgePinDisc}>{pin}</View> : pin;
    }
    return (
        <View style={[styles.badge, muted && styles.badgePermit, selected && styles.badgeSelected]}>
            {body}
        </View>
    );
});

// Several spots in one pin: how many, in an ink disc where a pin has its
// icon, then the group's label. Muted when no one may park at any of them now.
export const GroupPill = memo(function GroupPill({ spots, now = Date.now() }) {
    const text = getGroupLabel(spots, now);
    const muted = spots.every((s) => MUTED.has(getMarkerKind(s, now)));
    return (
        <View style={[styles.pill, muted && styles.pillPermit, muted && styles.groupMuted, !text && styles.groupCountOnly]}>
            <View style={[styles.count, muted && styles.countMuted]}>
                <Text style={styles.countText}>{spots.length}</Text>
            </View>
            {text ? <Text style={[styles.label, muted && styles.labelPermit]}>{text}</Text> : null}
        </View>
    );
});

// Android's group: the count alone, in the ink disc, within its 100 px bitmap.
export const GroupBadge = memo(function GroupBadge({ spots, now = Date.now() }) {
    const muted = spots.every((s) => MUTED.has(getMarkerKind(s, now)));
    return (
        <View style={[styles.badge, styles.badgeGroup, muted && styles.countMuted]}>
            <Text style={[styles.badgeText, styles.badgeTextSelected]}>{spots.length}</Text>
        </View>
    );
});

export default memo(SpotPill);
