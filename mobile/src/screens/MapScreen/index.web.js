// MapScreen (web) — a real map on the web: MapLibre with OpenFreeMap's
// OpenStreetMap tiles (components/WebMap), with the same pins, sheet and
// data as the phones, which use Google Maps. Drag the map and "Search this
// area" looks there; search an address and the map moves to it.

import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import PlacesSearchBar from '../../components/PlacesAutocomplete/PlacesSearchBar';
import WebMap, { boundsAround } from '../../components/WebMap';
import { DEFAULT_LOCATION } from '../../constants/config';
import { LAYOUT, SPACING, TOKENS } from '../../constants/theme';
import { useFilters } from '../../context/FilterContext';
import { useLocationManager } from '../../hooks/useLocationManager';
import { useMinute } from '../../hooks/useMinute';
import { useParkingSpots } from '../../hooks/useParkingSpots';
import { useReduceMotion } from '../../hooks/useReduceMotion';
import { apiTypeFor, applyType, getTypeNote } from '../../utils/filters';
import { distanceMeters } from '../../utils/geo';
import { canPart, groupBounds, groupPins } from '../../utils/mapGroups';
import { getBlockSide, getCoordinates, getSpotName, pickTopSpot, rankSpots } from '../../utils/spotPresentation';
import ParkingBottomSheet from './components/ParkingBottomSheet';
import SpotPill, { GroupPill, getGroupDescription, getMarkerDescription } from './components/SpotPill';
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

    // The sheet's order, as on Home: by walk, permit-only last. Re-ranked
    // each minute: a restriction may start while the map is open.
    const now = useMinute();
    const rankedSpots = useMemo(() => rankSpots(spots, type, now), [spots, type, now]);
    const featuredSpot = useMemo(
        () => selectedSpot || pickTopSpot(rankedSpots, type, now),
        [selectedSpot, rankedSpots, type, now]
    );

    const topInset = insets.top + SEARCH_BAR_SPACE;
    const wide = size.width >= LAYOUT.wide;
    // Known from the first render, before the map is made (see creditCollapsed).
    const narrowWindow = useWindowDimensions().width < LAYOUT.wide;

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

    // What covers the map: the search and the sheet's peek on a phone; on a
    // wide window, the search and list panel down the left side.
    const cover = useMemo(() => (wide
        ? { top: SPACING.lg, bottom: SPACING.lg, left: LAYOUT.panel + SPACING.lg * 2, right: SPACING.lg }
        : { top: topInset, bottom: peek, left: 0, right: 0 }), [wide, topInset, peek]);

    const fitSearch = useCallback(() => {
        if (!center) return;
        setMapCenter(null);
        mapRef.current?.fitBounds(
            boundsAround(center, reach),
            { top: cover.top + 16, bottom: cover.bottom + 16, left: cover.left + 24, right: cover.right + 24 },
            !reduceMotion
        );
    }, [center, reach, cover, reduceMotion]);

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

    // Pins too close to tell apart at the map's zoom share one, led by the
    // best (utils/mapGroups). The world's width in pixels stands for the zoom.
    const [worldSize, setWorldSize] = useState(512 * 2 ** 15);
    const groups = useMemo(
        () => groupPins(rankedSpots, worldSize, selectedSpot),
        [rankedSpots, worldSize, selectedSpot]
    );

    // A group zooms in until its spots part, closer than a search ever does,
    // since the two sides of a street can be a few metres apart; one whose
    // spots can't part picks its lead.
    const openGroup = useCallback((group) => {
        if (!canPart(group)) {
            setSelectedSpot(group.lead);
            return;
        }
        const { north, south, east, west } = groupBounds(group);
        mapRef.current?.fitBounds(
            [[west, south], [east, north]],
            { top: cover.top + 48, bottom: cover.bottom + 48, left: cover.left + 64, right: cover.right + 64 },
            !reduceMotion,
            19
        );
    }, [cover, reduceMotion]);

    const markers = useMemo(() => {
        const list = [];
        groups.forEach((group) => {
            const { key, lead: spot, spots: members, coordinate } = group;
            // Pins are a pointer's way to pick, out of the tab order (see
            // WebMap); the list has the same spots.
            if (members.length > 1) {
                list.push({
                    id: key,
                    coordinate,
                    zIndex: 1,
                    node: (
                        <Pressable
                            onPress={() => openGroup(group)}
                            style={styles.marker}
                            tabIndex={-1}
                            accessibilityRole="button"
                            accessibilityLabel={getGroupDescription(members, now)}
                        >
                            <GroupPill spots={members} now={now} />
                        </Pressable>
                    ),
                });
                return;
            }
            const selected = selectedSpot?.id === spot.id;
            list.push({
                id: `spot-${spot.id}`,
                coordinate,
                zIndex: selected ? 3 : 1,
                node: (
                    <Pressable
                        onPress={() => setSelectedSpot(spot)}
                        style={styles.marker}
                        tabIndex={-1}
                        accessibilityRole="button"
                        accessibilityLabel={`Select ${[getSpotName(spot).title, getBlockSide(spot), getMarkerDescription(spot, now)].filter(Boolean).join(', ')}`}
                    >
                        <SpotPill spot={spot} selected={selected} now={now} />
                    </Pressable>
                ),
            });
        });
        // You are here, when the phone said where, and the searched place or
        // area: under the pins, as on the phones' maps, and passive, so a tap
        // on a pin over them reaches the pin.
        if (here) {
            list.push({ id: 'me', coordinate: here, zIndex: 0, passive: true, node: <View style={styles.me} accessibilityLabel="Your location" /> });
        }
        if (place) {
            list.push({ id: 'place', coordinate: place, zIndex: 0, passive: true, node: <View style={styles.place} accessibilityLabel={place.name || 'Searched area'} /> });
        }
        return list;
    }, [groups, openGroup, selectedSpot, here, place, now]);

    const start = center ?? DEFAULT_LOCATION;

    return (
        <View
            style={styles.container}
            onLayout={(e) => setSize({ width: e.nativeEvent.layout.width, height: e.nativeEvent.layout.height })}
        >
            {/* First in the page, so the keyboard starts at search; it sits
                over the map by its zIndex */}
            <PlacesSearchBar
                onPlaceSelected={handlePlaceSelected}
                focusSignal={focusSignal}
                containerStyle={[styles.search, wide && styles.searchPanel, { top: insets.top + SPACING.md }]}
            />

            <WebMap
                ref={mapRef}
                style={StyleSheet.absoluteFill}
                center={start}
                zoom={15}
                markers={markers}
                area={center ? { center, radius } : null}
                credit="top-right"
                creditInset={topInset - 4}
                // On a phone it would wrap under the search bar, where the
                // open list reaches: it starts as its "i", a tap away.
                creditCollapsed={narrowWindow}
                onLoad={() => setMapReady(true)}
                onPress={() => setSelectedSpot(null)}
                onUserMove={setMapCenter}
                onZoom={setWorldSize}
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

            {/* Back to the search area, as on the phones. Under the sheet, so
                the open list covers it rather than the other way round. */}
            <View style={[mapStyles.fabContainer, styles.underSheet, { bottom: peek + 12 }]} pointerEvents="box-none">
                <Pressable
                    onPress={() => {
                        setSelectedSpot(null);
                        fitSearch();
                    }}
                    style={({ pressed }) => [mapStyles.fab, mapStyles.fabPrimary, pressed && mapStyles.fabPressed]}
                    accessibilityRole="button"
                    accessibilityLabel={place ? 'Back to the search area' : 'Back to your location'}
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
                onStartSession={() => navigation?.navigate('Park')}
                selectedSpot={selectedSpot}
                featuredSpot={featuredSpot}
                now={now}
                searchMode={place ? 'pinned' : 'current'}
                pinName={place?.name || null}
                fromDowntown={source === 'default' || source === 'outside'}
                typeNote={getTypeNote(type)}
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
    underSheet: {
        zIndex: 0,
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
