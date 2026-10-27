// MapScreen (web) — a real map on the web: MapLibre with OpenFreeMap's
// OpenStreetMap tiles (components/WebMap), with the same pins, sheet and
// data as the phones, which use Google Maps. Drag the map and "Search this
// area" looks there; search an address and the map moves to it.

import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import PlacesSearchBar from '../../components/PlacesAutocomplete/PlacesSearchBar';
import WebMap, { boundsAround } from '../../components/WebMap';
import { DEFAULT_LOCATION } from '../../constants/config';
import { LAYOUT, SPACING, TOKENS } from '../../constants/theme';
import { useFilters } from '../../context/FilterContext';
import { useLocationManager } from '../../hooks/useLocationManager';
import { useParkingSpots } from '../../hooks/useParkingSpots';
import { useReduceMotion } from '../../hooks/useReduceMotion';
import { apiTypeFor, applyType } from '../../utils/filters';
import { distanceMeters } from '../../utils/geo';
import { getCoordinates, getSpotName, pickTopSpot, rankSpots } from '../../utils/spotPresentation';
import ParkingBottomSheet from './components/ParkingBottomSheet';
import SpotPill, { getMarkerDescription } from './components/SpotPill';
import { styles as mapStyles } from './styles';

// Room for the search bar above the map's content.
const SEARCH_BAR_SPACE = 68;

export default function MapScreen({ route, navigation }) {
    const insets = useSafeAreaInsets();
    const tabBarHeight = useBottomTabBarHeight();
    const reduceMotion = useReduceMotion();
    const mapRef = useRef(null);
    const [size, setSize] = useState({ width: 0, height: 0 });
    const [peek, setPeek] = useState(200);
    const [mapReady, setMapReady] = useState(false);
    const [selectedSpot, setSelectedSpot] = useState(null);

    // Around the driver, as on Home (downtown without a fix in Calgary), or
    // around a searched place or a searched area of the map.
    const { location, source } = useLocationManager();
    const [place, setPlace] = useState(null);
    const here = source === 'gps' || source === 'saved' ? location : null;
    const center = place ?? location;

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

    // Type and distance, as set on Home (the web map has no filter row).
    const { type, radius } = useFilters();
    const { spots: found, loading, error, savedAt, stale, refetch } = useParkingSpots(center, radius, apiTypeFor(type));
    const spots = useMemo(() => applyType(found, type), [found, type]);

    // The sheet's order, as on Home: by walk, permit-only last.
    const rankedSpots = useMemo(() => rankSpots(spots, type), [spots, type]);
    const featuredSpot = useMemo(
        () => selectedSpot || pickTopSpot(rankedSpots),
        [selectedSpot, rankedSpots]
    );

    const topInset = insets.top + SEARCH_BAR_SPACE;
    const wide = size.width >= LAYOUT.wide;

    // Show the search circle, or the farthest spot if one lies beyond it, so
    // every place in the sheet's count has its pin on screen.
    const reach = useMemo(() => (center ? Math.max(radius, ...(spots || []).map((spot) => {
        const coords = getCoordinates(spot);
        return coords ? distanceMeters(center, coords) : 0;
    })) : radius), [spots, center, radius]);

    // The driver has dragged the map well off the searched area: offer to
    // search there instead. Our own camera moves do not count.
    const [mapCenter, setMapCenter] = useState(null);
    const movedAway = Boolean(center && mapCenter)
        && distanceMeters(mapCenter, center) > Math.max(150, radius * 0.6);

    const fitSearch = useCallback(() => {
        if (!center) return;
        setMapCenter(null);
        mapRef.current?.fitBounds(
            boundsAround(center, reach),
            { top: topInset + 16, bottom: peek + 16, left: 24, right: 24 },
            !reduceMotion
        );
    }, [center, reach, topInset, peek, reduceMotion]);

    // Show the whole search area each time it changes: a new place, area,
    // distance or set of spots.
    const centerLat = center?.latitude;
    const centerLng = center?.longitude;
    // Only when the search itself changes, not when the sheet moves.
    useEffect(() => {
        if (mapReady) fitSearch();
    }, [mapReady, centerLat, centerLng, reach]);

    const searchThisArea = useCallback(() => {
        if (!mapCenter) return;
        setSelectedSpot(null);
        setPlace({ ...mapCenter, name: null });
    }, [mapCenter]);

    const handleViewSpot = useCallback((spot) => {
        if (spot) navigation?.navigate('Details', { spot });
    }, [navigation]);

    const markers = useMemo(() => {
        const list = [];
        spots.forEach((spot) => {
            const coordinate = getCoordinates(spot);
            if (!coordinate) return;
            const selected = selectedSpot?.id === spot.id;
            list.push({
                id: `spot-${spot.id}`,
                coordinate,
                zIndex: selected ? 3 : 1,
                node: (
                    <Pressable
                        onPress={() => setSelectedSpot(spot)}
                        style={styles.marker}
                        accessibilityRole="button"
                        accessibilityLabel={`Select ${getSpotName(spot).title}, ${getMarkerDescription(spot)}`}
                    >
                        <SpotPill spot={spot} selected={selected} />
                    </Pressable>
                ),
            });
        });
        // You are here, when the phone said where
        if (here) {
            list.push({ id: 'me', coordinate: here, zIndex: 2, node: <View style={styles.me} accessibilityLabel="Your location" /> });
        }
        // The searched place or area
        if (place) {
            list.push({ id: 'place', coordinate: place, zIndex: 2, node: <View style={styles.place} accessibilityLabel={place.name || 'Searched area'} /> });
        }
        return list;
    }, [spots, selectedSpot, here, place]);

    const start = center ?? DEFAULT_LOCATION;

    return (
        <View
            style={styles.container}
            onLayout={(e) => setSize({ width: e.nativeEvent.layout.width, height: e.nativeEvent.layout.height })}
        >
            <WebMap
                ref={mapRef}
                style={StyleSheet.absoluteFill}
                center={start}
                zoom={15}
                markers={markers}
                area={center ? { center, radius } : null}
                credit="top-right"
                creditInset={topInset - 4}
                onLoad={() => setMapReady(true)}
                onPress={() => setSelectedSpot(null)}
                onUserMove={setMapCenter}
            />

            <PlacesSearchBar
                onPlaceSelected={handlePlaceSelected}
                focusSignal={focusSignal}
                containerStyle={[styles.search, wide && styles.searchPanel, { top: insets.top + SPACING.md }]}
            />

            {/* Search this area: once the map has moved off the search area */}
            {movedAway ? (
                <View style={[mapStyles.searchArea, { top: topInset + 8 }]} pointerEvents="box-none">
                    <Pressable
                        onPress={searchThisArea}
                        style={({ pressed }) => [mapStyles.searchAreaButton, pressed && mapStyles.fabPressed]}
                        accessibilityRole="button"
                        accessibilityHint="Lists parking around the middle of the map"
                    >
                        <MaterialCommunityIcons name="magnify" size={18} color={TOKENS.primaryInk} />
                        <Text style={mapStyles.searchAreaText}>Search this area</Text>
                    </Pressable>
                </View>
            ) : null}

            {/* Back to the search area, as on the phones */}
            <View style={[mapStyles.fabContainer, { bottom: peek + 12 }]} pointerEvents="box-none">
                <Pressable
                    onPress={() => {
                        setSelectedSpot(null);
                        fitSearch();
                    }}
                    style={({ pressed }) => [mapStyles.fab, mapStyles.fabPrimary, pressed && mapStyles.fabPressed]}
                    accessibilityRole="button"
                    accessibilityLabel={place ? 'Back to your pin' : 'Back to your location'}
                >
                    <MaterialCommunityIcons name={place ? 'map-marker' : 'crosshairs-gps'} size={22} color={TOKENS.surface} />
                </Pressable>
            </View>

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
                fromDowntown={source === 'default' || source === 'outside'}
                onClearPin={() => setPlace(null)}
                searchRadius={radius}
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
    me: {
        width: 18,
        height: 18,
        borderRadius: 9,
        backgroundColor: TOKENS.locationDot,
        borderWidth: 3,
        borderColor: TOKENS.surface,
    },
    place: {
        width: 20,
        height: 20,
        borderRadius: 10,
        backgroundColor: TOKENS.inkSurface,
        borderWidth: 4,
        borderColor: TOKENS.surface,
    },
    // The pill centred on its coordinate, in a 44 pt touch target.
    marker: {
        minWidth: 44,
        minHeight: 44,
        alignItems: 'center',
        justifyContent: 'center',
    },
    search: {
        position: 'absolute',
        left: SPACING.lg,
        right: SPACING.lg,
        zIndex: 5,
    },
    // On a wide window, as wide as the sheet's panel and above it.
    searchPanel: {
        right: undefined,
        width: LAYOUT.panel,
    },
});
