// MapScreen (web) — react-native-maps has no web renderer here, so the web
// build shows a drawn street grid with the real markers, sheet and data. It is
// labelled as a preview; the live map runs on iOS and Android.

import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { useCallback, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { DEFAULT_LOCATION } from '../../constants/config';
import { RADIUS, SPACING, TOKENS, alpha } from '../../constants/theme';
import { useParkingSpots } from '../../hooks/useParkingSpots';
import { getCoordinates, pickTopSpot, sortByDistance } from '../../utils/spotPresentation';
import ParkingBottomSheet from './components/ParkingBottomSheet';
import SpotPill from './components/SpotPill';

const SEARCH_RADIUS = 250;
const METERS_PER_DEG_LAT = 110540;

// Downtown's grid, roughly: avenues run east-west, streets north-south.
const AVENUE_GAP = 74;
const STREET_GAP = 96;

export default function MapScreen({ navigation }) {
    const insets = useSafeAreaInsets();
    const tabBarHeight = useBottomTabBarHeight();
    const [size, setSize] = useState({ width: 0, height: 0 });
    const [peek, setPeek] = useState(200);
    const [selectedSpot, setSelectedSpot] = useState(null);

    const { spots, loading } = useParkingSpots(DEFAULT_LOCATION, SEARCH_RADIUS, 'all');

    const featuredSpot = useMemo(
        () => selectedSpot || pickTopSpot(sortByDistance(spots || [])),
        [selectedSpot, spots]
    );

    // Centre the search area in the space above the sheet's peek.
    const topInset = insets.top + 48;
    const cx = size.width / 2;
    const cy = topInset + Math.max(0, (size.height - peek - topInset) / 2);
    const pxPerMeter = Math.max(0.1, (Math.min(size.width, size.height - peek - topInset) * 0.42) / SEARCH_RADIUS);

    const project = useCallback((coords) => {
        const dy = (coords.latitude - DEFAULT_LOCATION.latitude) * METERS_PER_DEG_LAT;
        const dx = (coords.longitude - DEFAULT_LOCATION.longitude)
            * METERS_PER_DEG_LAT * Math.cos((DEFAULT_LOCATION.latitude * Math.PI) / 180);
        return { x: cx + dx * pxPerMeter, y: cy - dy * pxPerMeter };
    }, [cx, cy, pxPerMeter]);

    const handleViewSpot = useCallback((spot) => {
        if (spot) navigation?.navigate('Details', { spot });
    }, [navigation]);

    const radiusPx = SEARCH_RADIUS * pxPerMeter;

    return (
        <View
            style={styles.container}
            onLayout={(e) => setSize({ width: e.nativeEvent.layout.width, height: e.nativeEvent.layout.height })}
        >
            {/* Drawn backdrop: tap to clear the selection, as on the real map */}
            <Pressable style={StyleSheet.absoluteFill} onPress={() => setSelectedSpot(null)} accessible={false}>
                <View style={styles.water} />
                {Array.from({ length: Math.ceil(size.height / AVENUE_GAP) + 1 }, (_, i) => (
                    <View key={`a${i}`} style={[styles.avenue, { top: i * AVENUE_GAP + 20 }]} />
                ))}
                {Array.from({ length: Math.ceil(size.width / STREET_GAP) + 1 }, (_, i) => (
                    <View key={`s${i}`} style={[styles.street, { left: i * STREET_GAP + 30 }]} />
                ))}
                <View style={[styles.park, { left: cx + 40, top: cy + 60 }]} />
                {size.width > 0 ? (
                    <View
                        style={[
                            styles.radius,
                            { width: radiusPx * 2, height: radiusPx * 2, borderRadius: radiusPx, left: cx - radiusPx, top: cy - radiusPx },
                        ]}
                    />
                ) : null}
            </Pressable>

            {/* Marker layer: one stacking context, so the sheet always covers it */}
            <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
                {/* You are here */}
                {size.width > 0 ? <View style={[styles.me, { left: cx - 9, top: cy - 9 }]} accessibilityLabel="Your location" /> : null}

                {size.width > 0 && spots.map((spot) => {
                    const coords = getCoordinates(spot);
                    if (!coords) return null;
                    const { x, y } = project(coords);
                    const selected = selectedSpot?.id === spot.id;
                    return (
                        <Pressable
                            key={spot.id}
                            onPress={() => setSelectedSpot(spot)}
                            style={[styles.marker, { left: x, top: y, zIndex: selected ? 2 : 1 }]}
                            accessibilityRole="button"
                            accessibilityLabel={`Select ${spot.address}`}
                        >
                            <SpotPill spot={spot} selected={selected} />
                        </Pressable>
                    );
                })}
            </View>

            <View style={[styles.notice, { top: insets.top + SPACING.md }]}>
                <Text style={styles.noticeText}>Preview map. The live map runs on iOS and Android.</Text>
            </View>

            <ParkingBottomSheet
                spots={spots}
                loading={loading}
                selectedSpot={selectedSpot}
                featuredSpot={featuredSpot}
                searchMode="current"
                searchRadius={SEARCH_RADIUS}
                onPeekHeightChange={setPeek}
                tabBarHeight={tabBarHeight}
                topInset={topInset}
                containerHeight={size.height || null}
                onItemPress={setSelectedSpot}
                onViewSpot={handleViewSpot}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        overflow: 'hidden',
        backgroundColor: TOKENS.mapLand,
    },
    water: {
        position: 'absolute',
        left: -40,
        right: -40,
        top: 4,
        height: 44,
        backgroundColor: TOKENS.mapWater,
        transform: [{ rotate: '-4deg' }],
    },
    avenue: {
        position: 'absolute',
        left: 0,
        right: 0,
        height: 8,
        backgroundColor: TOKENS.surface,
    },
    street: {
        position: 'absolute',
        top: 0,
        bottom: 0,
        width: 7,
        backgroundColor: TOKENS.surface,
    },
    park: {
        position: 'absolute',
        width: 80,
        height: 56,
        borderRadius: 6,
        backgroundColor: TOKENS.mapPark,
    },
    radius: {
        position: 'absolute',
        backgroundColor: alpha(TOKENS.primary, 0.06),
        borderWidth: 2,
        borderColor: alpha(TOKENS.primary, 0.22),
    },
    me: {
        position: 'absolute',
        width: 18,
        height: 18,
        borderRadius: 9,
        backgroundColor: '#2F7DF6',
        borderWidth: 3,
        borderColor: TOKENS.surface,
    },
    // Centre the pill on its coordinate.
    marker: {
        position: 'absolute',
        transform: [{ translateX: '-50%' }, { translateY: '-50%' }],
    },
    notice: {
        position: 'absolute',
        alignSelf: 'center',
        paddingHorizontal: SPACING.md,
        paddingVertical: SPACING.xs,
        borderRadius: RADIUS.pill,
        backgroundColor: alpha(TOKENS.inkSurface, 0.82),
    },
    noticeText: {
        fontSize: 12,
        fontWeight: '600',
        color: TOKENS.surface,
    },
});
