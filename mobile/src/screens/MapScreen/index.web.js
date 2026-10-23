// MapScreen (web) — react-native-maps has no web renderer here, so the web
// build shows a drawn street grid with the real markers, sheet and data. It is
// labelled as a preview; the live map runs on iOS and Android. Search works as
// on the phones (through the backend), and centres the grid on the place.

import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { DEFAULT_LOCATION } from '../../constants/config';
import PlacesSearchBar from '../../components/PlacesAutocomplete/PlacesSearchBar';
import { RADIUS, SPACING, TOKENS, alpha } from '../../constants/theme';
import { useLocationManager } from '../../hooks/useLocationManager';
import { useParkingSpots } from '../../hooks/useParkingSpots';
import { distanceMeters } from '../../utils/geo';
import { getCoordinates, getSpotName, pickTopSpot, rankSpots } from '../../utils/spotPresentation';
import ParkingBottomSheet from './components/ParkingBottomSheet';
import SpotPill, { getMarkerDescription } from './components/SpotPill';

const SEARCH_RADIUS = 250;
const METERS_PER_DEG_LAT = 110540;

// Downtown's grid, roughly: avenues run east-west, streets north-south.
const AVENUE_GAP = 74;
const STREET_GAP = 96;

export default function MapScreen({ route, navigation }) {
    const insets = useSafeAreaInsets();
    const tabBarHeight = useBottomTabBarHeight();
    const [size, setSize] = useState({ width: 0, height: 0 });
    const [peek, setPeek] = useState(200);
    const [selectedSpot, setSelectedSpot] = useState(null);

    // Around the driver, as on Home (downtown without a fix in Calgary), or
    // around a searched place.
    const { location, source } = useLocationManager();
    const [place, setPlace] = useState(null);
    const here = source === 'gps' || source === 'saved' ? location : null;
    // null until the first fix (or downtown); the grid is drawn around downtown meanwhile.
    const center = place ?? location;
    const origin = center ?? DEFAULT_LOCATION;

    // Home's search row opens Map with { focusSearch: true }.
    const [focusSignal, setFocusSignal] = useState(0);
    const focusSearch = route?.params?.focusSearch;
    useEffect(() => {
        if (!focusSearch) return;
        setFocusSignal((n) => n + 1);
        navigation?.setParams({ focusSearch: undefined });
    }, [focusSearch, navigation]);

    const handlePlaceSelected = useCallback(({ lat, lng, name }) => {
        setSelectedSpot(null);
        setPlace({ latitude: lat, longitude: lng, name });
    }, []);

    const { spots, loading, error, savedAt, stale, refetch } = useParkingSpots(center, SEARCH_RADIUS, 'all');

    // The sheet's order, as on Home: by walk, permit-only last.
    const rankedSpots = useMemo(() => rankSpots(spots), [spots]);
    const featuredSpot = useMemo(
        () => selectedSpot || pickTopSpot(rankedSpots),
        [selectedSpot, rankedSpots]
    );

    // Centre the search area in the space above the sheet's peek, below the
    // search bar and the preview note.
    const topInset = insets.top + 104;
    const cx = size.width / 2;
    const cy = topInset + Math.max(0, (size.height - peek - topInset) / 2);
    // Fit the search circle, or the farthest spot if one lies beyond it, so
    // every place in the sheet's count has its pin on screen.
    const reach = useMemo(() => Math.max(SEARCH_RADIUS, ...(spots || []).map((spot) => {
        const coords = getCoordinates(spot);
        return coords ? distanceMeters(origin, coords) : 0;
    })), [spots, origin]);
    const pxPerMeter = Math.max(0.1, (Math.min(size.width, size.height - peek - topInset) * 0.42) / reach);

    const project = useCallback((coords) => {
        const dy = (coords.latitude - origin.latitude) * METERS_PER_DEG_LAT;
        const dx = (coords.longitude - origin.longitude)
            * METERS_PER_DEG_LAT * Math.cos((origin.latitude * Math.PI) / 180);
        return { x: cx + dx * pxPerMeter, y: cy - dy * pxPerMeter };
    }, [cx, cy, pxPerMeter, origin]);
    const me = here && size.width > 0 ? project(here) : null;

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
                {/* You are here, when the phone said where */}
                {me ? <View style={[styles.me, { left: me.x - 9, top: me.y - 9 }]} accessibilityLabel="Your location" /> : null}
                {/* The searched place */}
                {place && size.width > 0 ? (
                    <View style={[styles.place, { left: cx - 10, top: cy - 10 }]} accessibilityLabel={place.name || 'Searched place'} />
                ) : null}

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
                            accessibilityLabel={`Select ${getSpotName(spot).title}, ${getMarkerDescription(spot)}`}
                        >
                            <SpotPill spot={spot} selected={selected} />
                        </Pressable>
                    );
                })}
            </View>

            <View style={[styles.notice, { top: insets.top + 68 }]}>
                <Text style={styles.noticeText}>Preview map. The live map runs on iOS and Android.</Text>
            </View>

            {/* After the note, so its suggestions draw over it */}
            <PlacesSearchBar
                onPlaceSelected={handlePlaceSelected}
                focusSignal={focusSignal}
                containerStyle={[styles.search, { top: insets.top + SPACING.md }]}
            />

            <ParkingBottomSheet
                spots={rankedSpots}
                // Waiting for a location counts as loading, not as "no spots".
                loading={loading || !center}
                error={error}
                savedAt={savedAt}
                stale={stale}
                onRetry={refetch}
                selectedSpot={selectedSpot}
                featuredSpot={featuredSpot}
                searchMode={place ? 'pinned' : 'current'}
                onClearPin={() => setPlace(null)}
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
    place: {
        position: 'absolute',
        width: 20,
        height: 20,
        borderRadius: 10,
        backgroundColor: TOKENS.inkSurface,
        borderWidth: 4,
        borderColor: TOKENS.surface,
    },
    // Centre the pill on its coordinate, in a 44 pt touch target.
    marker: {
        position: 'absolute',
        minWidth: 44,
        minHeight: 44,
        alignItems: 'center',
        justifyContent: 'center',
        transform: [{ translateX: '-50%' }, { translateY: '-50%' }],
    },
    search: {
        position: 'absolute',
        left: SPACING.lg,
        right: SPACING.lg,
        zIndex: 5,
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
