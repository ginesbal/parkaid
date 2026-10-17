import { MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import * as Location from 'expo-location';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
    Animated,
    Keyboard,
    Pressable,
    Text,
    View,
} from 'react-native';
import MapView, { PROVIDER_GOOGLE } from 'react-native-maps';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// app constants/services
import ScreenStatusBar from '../../components/ScreenStatusBar';
import { DEFAULT_LOCATION } from '../../constants/config';
import { MOTION } from '../../constants/theme';

// logs
import { logger } from '../../utils/loggers';
import { pickTopSpot, sortByDistance } from '../../utils/spotPresentation';

// files specific to this screen
import { useParkingSpots } from '../../hooks/useParkingSpots';
import { useReduceMotion } from '../../hooks/useReduceMotion';
import MapHeader from './components/MapHeader';
import MapOverlays from './components/MapOverlays';
import ParkingBottomSheet from './components/ParkingBottomSheet';
import { styles } from './styles';
import { centerCamera } from './utils/camera';

function MapScreen({ route, navigation }) {
    const insets = useSafeAreaInsets();
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
    const lastMapInteraction = useRef(null);
    const hideControlsTimer = useRef(null);
    // Tracks the last time the search input became focused. Used to suppress
    // the spurious MapView.onPress that Google Maps' native gesture recognizer
    // fires on iOS when the user taps the search bar (the native recognizer
    // fires in parallel with RN's touch delivery to the TextInput).
    const searchFocusAtRef = useRef(0);

    // animations
    const controlsOpacity = useRef(new Animated.Value(1)).current;
    const controlsTranslateY = useRef(new Animated.Value(0)).current;
    const pinDropAnim = useRef(new Animated.Value(0)).current;

    // data state
    const [region, setRegion] = useState(DEFAULT_LOCATION);
    const [userLocation, setUserLocation] = useState(null);
    const [filterType, setFilterType] = useState('all');
    const [searchRadius, setSearchRadius] = useState(150);
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

    const { spots, loading: spotsLoading } = useParkingSpots(
        searchLocation,
        searchRadius,
        filterType
    );
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

        return () => {
            if (hideControlsTimer.current) clearTimeout(hideControlsTimer.current);
        };
    }, []);


    // Map controls fade; they also slide unless reduce motion is on.
    const reduceMotion = useReduceMotion();
    const fadeControls = useCallback((visible) => {
        const timing = (value, toValue) => Animated.timing(value, {
            toValue,
            duration: MOTION.duration.base,
            easing: MOTION.easing,
            useNativeDriver: true,
        });
        Animated.parallel([
            timing(controlsOpacity, visible ? 1 : 0),
            timing(controlsTranslateY, visible || reduceMotion ? 0 : -50),
        ]).start();
    }, [controlsOpacity, controlsTranslateY, reduceMotion]);

    // Camera moves are big motion; under reduce motion they jump instead.
    const cameraMs = useCallback((ms) => (reduceMotion ? 0 : ms), [reduceMotion]);

    const showControls = useCallback(() => fadeControls(true), [fadeControls]);
    const hideControls = useCallback(() => fadeControls(false), [fadeControls]);

    const handleMapInteraction = useCallback(() => {
        lastMapInteraction.current = Date.now();
        showControls();
        if (hideControlsTimer.current) clearTimeout(hideControlsTimer.current);
        hideControlsTimer.current = setTimeout(() => {
            if (Date.now() - lastMapInteraction.current >= 3000) {
                hideControls();
            }
        }, 3000);
    }, [hideControls, showControls]);

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
    // featured card in the sheet's peek. "View parking" there opens Details.
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

    // Selected spot, else the closest worthwhile suggestion.
    const featuredSpot = useMemo(
        () => selectedSpot || pickTopSpot(sortByDistance(spots || []), filterType),
        [selectedSpot, spots, filterType]
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

    const handleMapPress = useCallback(() => {
        // Google Maps iOS SDK fires its native tap recognizer in parallel with
        // RN's touch delivery, so tapping the search bar also triggers this
        // onPress. If the search was focused within the last 400ms, assume the
        // onPress is that echo and ignore it — otherwise the keyboard would
        // dismiss the instant it appears.
        const dtSinceFocus = Date.now() - searchFocusAtRef.current;
        if (dtSinceFocus < 400) return;
        if (isSearchFocused) Keyboard.dismiss();
        setSelectedSpot(null);
    }, [isSearchFocused]);

    const handleMapPanDrag = useCallback(() => {
        handleMapInteraction();
    }, [handleMapInteraction]);

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
            setRegion(newRegion);
            mapRef.current?.animateToRegion(newRegion, cameraMs(MOTION.duration.slow));
            setPinnedLocation(newRegion);
            setSearchMode('pinned');
            logger.log('search_mode_changed', { to: 'pinned' }, 'INFO');
        }
    }, [cameraMs]);

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
                onRegionChangeComplete={setRegion}
                onPanDrag={handleMapPanDrag}
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

            {/* floating recenter button */}
            <Animated.View
                style={[
                    styles.fabContainer,
                    {
                        opacity: controlsOpacity,
                        transform: [{ translateY: Animated.multiply(controlsTranslateY, -1) }],
                        bottom: BOTTOM_UI_OFFSET - 4,
                    }
                ]}
                pointerEvents="auto"
            >
                <Pressable
                    style={({ pressed }) => [styles.fab, styles.fabPrimary, pressed && styles.fabPressed]}
                    onPress={() => {
                        logger.log('ui_recenter_pressed', { mode: searchMode }, 'UI_EVENT');

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
            </Animated.View>

            {/* parking bottom sheet */}
            <ParkingBottomSheet
                ref={bottomSheetRef}
                spots={spots}
                // Waiting for a location counts as loading, not as "no spots".
                loading={spotsLoading || !searchLocation}
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
