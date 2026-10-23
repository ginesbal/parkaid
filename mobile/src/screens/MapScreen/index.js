import { MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import * as Location from 'expo-location';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
    Animated,
    Keyboard,
    PixelRatio,
    Platform,
    Pressable,
    Text,
    View,
    useWindowDimensions,
} from 'react-native';
import MapView, { PROVIDER_GOOGLE } from 'react-native-maps';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// app constants/services
import ScreenStatusBar from '../../components/ScreenStatusBar';
import { DEFAULT_LOCATION } from '../../constants/config';
import { MOTION, TOKENS } from '../../constants/theme';

// logs
import { useFilters } from '../../context/FilterContext';
import { apiTypeFor, applyType } from '../../utils/filters';
import { distanceMeters, nearestSpot } from '../../utils/geo';
import { logger } from '../../utils/loggers';
import { pickTopSpot, rankSpots } from '../../utils/spotPresentation';

// files specific to this screen
import { useParkingSpots } from '../../hooks/useParkingSpots';
import { useReduceMotion } from '../../hooks/useReduceMotion';
import MapHeader from './components/MapHeader';
import MapOverlays from './components/MapOverlays';
import ParkingBottomSheet from './components/ParkingBottomSheet';
import { styles } from './styles';
import { centerCamera } from './utils/camera';

// Half a 44 pt touch target: how far from a pin a tap may land and still pick it.
const TAP_SLOP = 22;

function MapScreen({ route, navigation }) {
    const insets = useSafeAreaInsets();
    const { width: windowWidth } = useWindowDimensions();
    // Compact header: ~70px content + safe area inset (collapsed filters)
    const [navigationHeight, setNavigationHeight] = useState(70 + insets.top);
    const [sheetPeekHeight, setSheetPeekHeight] = useState(108);

    // Get ACTUAL tab bar height from React Navigation (includes padding + safe areas)
    const tabBarHeight = useBottomTabBarHeight();
    // The Map scene ends at the top of the tab bar, so only the sheet's peek
    // (sitting 10pt above that edge) and a small gap sit below the map's view.
    const BOTTOM_UI_OFFSET = sheetPeekHeight + 16;
    const [containerHeight, setContainerHeight] = useState(null);
    // Never pad the map so much that no visible strip is left to centre on.
    const mapBottomPadding = containerHeight
        ? Math.max(0, Math.min(BOTTOM_UI_OFFSET, containerHeight - navigationHeight - 120))
        : BOTTOM_UI_OFFSET;

    // refs
    const mapRef = useRef(null);
    const bottomSheetRef = useRef(null);
    // Tracks the last time the search input became focused. Used to suppress
    // the spurious MapView.onPress that Google Maps' native gesture recognizer
    // fires on iOS when the user taps the search bar (the native recognizer
    // fires in parallel with RN's touch delivery to the TextInput).
    const searchFocusAtRef = useRef(0);

    // animations
    const pinDropAnim = useRef(new Animated.Value(0)).current;

    // data state
    const [region, setRegion] = useState(DEFAULT_LOCATION);
    const [userLocation, setUserLocation] = useState(null);
    // Type and distance, shared with Home (context/FilterContext).
    const { type: filterType, setType: setFilterType, radius: searchRadius, setRadius: setSearchRadius } = useFilters();
    const [selectedSpot, setSelectedSpot] = useState(null);
    const [isSearchFocused, setIsSearchFocused] = useState(false);
    const [searchFocusSignal, setSearchFocusSignal] = useState(0);

    // Home's search row opens Map with { focusSearch: true }. Consume the param
    // so returning to this tab later does not refocus the input.
    const focusSearchParam = route?.params?.focusSearch;
    useEffect(() => {
        if (!focusSearchParam) return;
        setSearchFocusSignal((n) => n + 1);
        navigation?.setParams({ focusSearch: undefined });
    }, [focusSearchParam, navigation]);

    // pin state
    const [pinnedLocation, setPinnedLocation] = useState(null);
    const [searchMode, setSearchMode] = useState('current'); // 'current' | 'pinned'
    const [showPinInstructions, setShowPinInstructions] = useState(false);

    // calculate search spots
    const searchLocation = (searchMode === 'pinned' && pinnedLocation) ? pinnedLocation : userLocation;

    const { spots: found, loading: spotsLoading, error: spotsError, savedAt, stale, refetch } = useParkingSpots(
        searchLocation,
        searchRadius,
        apiTypeFor(filterType)
    );
    const spots = useMemo(() => applyType(found, filterType), [found, filterType]);
    // get initial location and record permission outcome
    useEffect(() => {
        (async () => {
            try {
                const { status } = await Location.requestForegroundPermissionsAsync();
                // important: permission result explains empty data scenarios
                logger.log('location_permission', { status }, 'INFO');

                if (status !== 'granted') {
                    setUserLocation(DEFAULT_LOCATION);
                    setRegion(DEFAULT_LOCATION);
                    // important: fallback location to keep app usable
                    logger.log('location_fallback_default', DEFAULT_LOCATION, 'WARN');
                    return;
                }

                const loc = await Location.getCurrentPositionAsync({
                    accuracy: Location.Accuracy.Balanced,
                });
                const coords = {
                    latitude: loc.coords.latitude,
                    longitude: loc.coords.longitude,
                    latitudeDelta: 0.01,
                    longitudeDelta: 0.01,
                };
                setUserLocation(coords);
                setRegion(coords);
                await AsyncStorage.setItem('userLocation', JSON.stringify(coords));
                // important: capture starting coordinates for debugging
                logger.log('location_acquired', { lat: coords.latitude, lng: coords.longitude }, 'INFO');
            } catch {
                setUserLocation(DEFAULT_LOCATION);
                setRegion(DEFAULT_LOCATION);
                // important: catch-all failure path with fallback
                logger.log('location_error_fallback_default', DEFAULT_LOCATION, 'ERROR');
            }
        })();
    }, []);


    const reduceMotion = useReduceMotion();

    // Camera moves are big motion; under reduce motion they jump instead.
    const cameraMs = useCallback((ms) => (reduceMotion ? 0 : ms), [reduceMotion]);

    // long press to drop pin and switch mode
    const handleMapLongPress = (event) => {
        const { coordinate } = event.nativeEvent;
        setPinnedLocation({
            latitude: coordinate.latitude,
            longitude: coordinate.longitude,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
        });

        // A playful drop, looser than MOTION.spring on purpose; none under reduce motion.
        if (reduceMotion) {
            pinDropAnim.setValue(1);
        } else {
            pinDropAnim.setValue(0);
            Animated.spring(pinDropAnim, {
                toValue: 1,
                tension: 40,
                friction: 6,
                useNativeDriver: true,
            }).start();
        }

        setSearchMode('pinned');
        setShowPinInstructions(false);
        // important: record pin placement and mode shift
        logger.log('Pin dropped', coordinate, 'UI_EVENT');
        logger.log('search_mode_changed', { to: 'pinned' }, 'INFO');
    };

    // Select a spot: highlight its marker, centre it, and show it as the
    // featured card in the sheet's peek. "View spot" there opens Details.
    const selectSpot = useCallback((spot, fromList = false) => {
        // important: deep snapshot of the chosen spot for diagnostics
        logger.logSpotData(spot, `Selected from ${fromList ? 'LIST' : 'MAP'}`);
        setSelectedSpot(spot);
        bottomSheetRef.current?.dismiss();

        const coords = spot?.coordinates?.coordinates;
        if (Array.isArray(coords)) {
            centerCamera(mapRef, region, coords[1], coords[0], cameraMs(MOTION.duration.fast));
            // important: confirm camera move for traceability
            logger.log('camera_centered_on_spot', { id: spot?.id, lat: coords[1], lng: coords[0] }, 'INFO');
        }
    }, [region, cameraMs]);

    const handleViewSpot = useCallback((spot) => {
        if (!spot) return;
        logger.log('map_view_spot', { spotId: spot.id }, 'UI_EVENT');
        navigation?.navigate('Details', { spot });
    }, [navigation]);

    // The sheet's order, as on Home: by walk, the cheaper first for the same
    // walk, permit-only last.
    const rankedSpots = useMemo(() => rankSpots(spots, filterType), [spots, filterType]);

    // Selected spot, else the closest worthwhile suggestion.
    const featuredSpot = useMemo(
        () => selectedSpot || pickTopSpot(rankedSpots, filterType),
        [selectedSpot, rankedSpots, filterType]
    );

    const searchCenter = useMemo(() => (
        (searchMode === 'pinned' && pinnedLocation) ? pinnedLocation : userLocation
    ), [pinnedLocation, searchMode, userLocation]);

    const dynamicStyles = useMemo(() => ({
        topNavigation: { ...styles.topNavigation, paddingTop: insets.top + 4 },
        tooltip: { ...styles.tooltip, top: navigationHeight + 8 }
    }), [insets.top, navigationHeight]);

    const handleNavigationLayout = useCallback((event) => {
        const measuredHeight = Math.ceil(event.nativeEvent.layout.height);
        setNavigationHeight((currentHeight) => (
            Math.abs(currentHeight - measuredHeight) > 1 ? measuredHeight : currentHeight
        ));
    }, []);

    // Wrap setIsSearchFocused so we stamp the focus time whenever focus is
    // gained. The stamp is read by handleMapPress to ignore the spurious
    // onPress that fires from Google Maps' native tap recognizer on iOS.
    const handleSearchFocusChange = useCallback((focused) => {
        if (focused) searchFocusAtRef.current = Date.now();
        setIsSearchFocused(focused);
    }, []);

    const handleMapPress = useCallback((event) => {
        // Google Maps iOS SDK fires its native tap recognizer in parallel with
        // RN's touch delivery, so tapping the search bar also triggers this
        // onPress. If the search was focused within the last 400ms, assume the
        // onPress is that echo and ignore it — otherwise the keyboard would
        // dismiss the instant it appears.
        const dtSinceFocus = Date.now() - searchFocusAtRef.current;
        if (dtSinceFocus < 400) return;
        if (isSearchFocused) {
            Keyboard.dismiss();
            setSelectedSpot(null);
            return;
        }
        // Pins are smaller than a fingertip (and Android cannot draw them any
        // bigger), so a tap within half a 44 pt target of one still picks it.
        const point = event?.nativeEvent?.coordinate;
        const metersPerPoint = (region.longitudeDelta * 111320
            * Math.cos((region.latitude * Math.PI) / 180)) / windowWidth;
        const near = point && Number.isFinite(metersPerPoint)
            ? nearestSpot(spots, point, TAP_SLOP * metersPerPoint)
            : null;
        if (near) selectSpot(near);
        else setSelectedSpot(null);
    }, [isSearchFocused, region, windowWidth, spots, selectSpot]);

    // Stable setSearchMode wrapper for MapHeader — keeps memo(MapHeader) intact.
    const handleSearchModeChange = useCallback((mode) => {
        logger.log('search_mode_changed', { to: mode }, 'INFO');
        setSearchMode(mode);
    }, []);

    // Stable place-selected handler for MapHeader.
    const handlePlaceSelected = useCallback((place) => {
        if (place?.lat && place?.lng) {
            const newRegion = {
                latitude: place.lat,
                longitude: place.lng,
                latitudeDelta: 0.005,
                longitudeDelta: 0.005,
            };
            // The camera follows the new search area (see the fit below).
            setRegion(newRegion);
            setPinnedLocation(newRegion);
            setSearchMode('pinned');
            logger.log('search_mode_changed', { to: 'pinned' }, 'INFO');
        }
    }, []);

    // The driver has dragged the map well off the searched area: offer to
    // search there instead. (Camera moves of our own, like centring on a
    // selected pin, do not count.)
    const [panned, setPanned] = useState(false);
    const movedAway = panned && Boolean(searchLocation) && Number.isFinite(region?.latitude)
        && distanceMeters(region, searchLocation) > Math.max(150, searchRadius * 0.6);
    const searchThisArea = useCallback(() => {
        const center = { latitude: region.latitude, longitude: region.longitude };
        logger.log('search_this_area', center, 'UI_EVENT');
        setSelectedSpot(null);
        setPinnedLocation({ ...region });
        setSearchMode('pinned');
    }, [region]);

    // Show the whole search area each time it changes (a new place, pin or
    // radius), so every place in the sheet's count has its pin on screen.
    // mapPadding already keeps it clear of the header and the sheet.
    const [mapReady, setMapReady] = useState(false);
    const searchLat = searchLocation?.latitude;
    const searchLng = searchLocation?.longitude;
    useEffect(() => {
        if (!mapReady || !Number.isFinite(searchLat) || !Number.isFinite(searchLng)) return;
        setPanned(false);
        const dLat = searchRadius / 111320;
        const dLng = searchRadius / (111320 * Math.cos((searchLat * Math.PI) / 180));
        // Android reads edgePadding in pixels.
        const margin = Platform.OS === 'android' ? 24 * PixelRatio.get() : 24;
        mapRef.current?.fitToCoordinates(
            [
                { latitude: searchLat + dLat, longitude: searchLng },
                { latitude: searchLat - dLat, longitude: searchLng },
                { latitude: searchLat, longitude: searchLng + dLng },
                { latitude: searchLat, longitude: searchLng - dLng },
            ],
            { edgePadding: { top: margin, bottom: margin, left: margin, right: margin }, animated: !reduceMotion }
        );
    }, [mapReady, searchLat, searchLng, searchRadius, reduceMotion]);

    return (
        <View
            style={styles.container}
            onLayout={(e) => {
                const h = Math.round(e.nativeEvent.layout.height);
                setContainerHeight((cur) => (cur === h ? cur : h));
            }}
        >
            <ScreenStatusBar style="dark" />

            {/* map — rendered FIRST so iOS hitTest routes taps on later siblings
                (header, FAB, bottom sheet) to those overlays instead of leaking
                through to the map's onPress. */}
            <MapView
                ref={mapRef}
                style={styles.map}
                provider={PROVIDER_GOOGLE}
                initialRegion={region}
                onMapReady={() => setMapReady(true)}
                onPanDrag={() => setPanned(true)}
                onRegionChangeComplete={setRegion}
                onPress={handleMapPress}
                onLongPress={handleMapLongPress}
                showsUserLocation
                showsMyLocationButton={false}
                showsCompass={false}
                paddingAdjustmentBehavior="always"
                mapPadding={{
                    left: 0,
                    right: 0,
                    top: navigationHeight,
                    bottom: mapBottomPadding,
                }}
            >
                <MapOverlays
                    searchCenter={searchCenter}
                    searchRadius={searchRadius}
                    searchMode={searchMode}
                    pinnedLocation={pinnedLocation}
                    pinDropAnim={pinDropAnim}
                    spots={spots}
                    selectedSpot={selectedSpot}
                    onSelectSpot={selectSpot}
                />
            </MapView>

            {/* header — rendered AFTER the map so it sits on top for both
                painting and iOS touch routing. */}
            <View style={dynamicStyles.topNavigation} onLayout={handleNavigationLayout}>
                <MapHeader
                    isSearchFocused={isSearchFocused}
                    setIsSearchFocused={handleSearchFocusChange}
                    pinnedLocation={pinnedLocation}
                    setPinnedLocation={setPinnedLocation}
                    showPinInstructions={showPinInstructions}
                    setShowPinInstructions={setShowPinInstructions}
                    searchMode={searchMode}
                    // important: track mode changes from the header controls
                    setSearchMode={handleSearchModeChange}
                    filterType={filterType}
                    setFilterType={setFilterType}
                    searchRadius={searchRadius}
                    setSearchRadius={setSearchRadius}
                    onPlaceSelected={handlePlaceSelected}
                    searchFocusSignal={searchFocusSignal}
                />
            </View>

            {/* pin instruction tooltip */}
            {showPinInstructions && !pinnedLocation && (
                <Animated.View style={dynamicStyles.tooltip}>
                    <View style={styles.tooltipArrow} />
                    <Text style={styles.tooltipText}>
                        Press and hold anywhere on the map to search that location
                    </Text>
                </Animated.View>
            )}

            {/* Search this area: shown once the map has moved off the search area */}
            {movedAway ? (
                <View style={[styles.searchArea, { top: navigationHeight + 12 }]} pointerEvents="box-none">
                    <Pressable
                        onPress={searchThisArea}
                        style={({ pressed }) => [styles.searchAreaButton, pressed && styles.fabPressed]}
                        accessibilityRole="button"
                        accessibilityHint="Lists parking around the middle of the map"
                    >
                        <MaterialCommunityIcons name="magnify" size={18} color={TOKENS.primaryInk} />
                        <Text style={styles.searchAreaText}>Search this area</Text>
                    </Pressable>
                </View>
            ) : null}

            {/* Recenter: always shown, unlike the controls that fade */}
            <View style={[styles.fabContainer, { bottom: BOTTOM_UI_OFFSET - 4 }]} pointerEvents="box-none">
                <Pressable
                    style={({ pressed }) => [styles.fab, styles.fabPrimary, pressed && styles.fabPressed]}
                    accessibilityRole="button"
                    accessibilityLabel={searchMode === 'pinned' ? 'Back to your pin' : 'Back to your location'}
                    onPress={() => {
                        logger.log('ui_recenter_pressed', { mode: searchMode }, 'UI_EVENT');
                        setPanned(false);

                        const targetLocation =
                            (searchMode === 'pinned' && pinnedLocation) ? pinnedLocation : userLocation;

                        if (targetLocation) {
                            mapRef.current?.animateCamera(
                                { center: { latitude: targetLocation.latitude, longitude: targetLocation.longitude } },
                                { duration: cameraMs(MOTION.duration.fast) }
                            );
                            setSelectedSpot(null);
                        }
                    }}
                >
                    <MaterialCommunityIcons
                        name={searchMode === 'pinned' ? 'map-marker' : 'crosshairs-gps'}
                        size={22}
                        color="#fff"
                    />
                </Pressable>
            </View>

            {/* parking bottom sheet */}
            <ParkingBottomSheet
                ref={bottomSheetRef}
                spots={rankedSpots}
                // Waiting for a location counts as loading, not as "no spots".
                loading={spotsLoading || !searchLocation}
                error={spotsError}
                savedAt={savedAt}
                stale={stale}
                onRetry={refetch}
                selectedSpot={selectedSpot}
                featuredSpot={featuredSpot}
                searchMode={searchMode}
                searchRadius={searchRadius}
                onPeekHeightChange={setSheetPeekHeight}
                tabBarHeight={tabBarHeight}
                topInset={navigationHeight}
                containerHeight={containerHeight}
                onItemPress={(spot) => selectSpot(spot, true)}
                onViewSpot={handleViewSpot}
                onClearPin={() => {
                    logger.log('clear_pin_button_pressed', {}, 'UI_EVENT');
                    setPinnedLocation(null);
                    setSearchMode('current');
                    setSelectedSpot(null);
                }}
            />
        </View>
    );
}

export default MapScreen;
