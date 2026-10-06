import { MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import * as Location from 'expo-location';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
    Animated,
    Keyboard,
    Linking,
    Pressable,
    StatusBar,
    Text,
    View,
} from 'react-native';
import MapView, { PROVIDER_GOOGLE } from 'react-native-maps';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// shared components
import FlippableParkingCard from '../../components/ParkingCard/FlippableParkingCard';

// app constants/services
import { DEFAULT_LOCATION } from '../../constants/config';
import { DEFAULT_SEARCH_RADIUS, FETCH_RADIUS } from '../../constants/parking';
import { STORAGE_KEYS } from '../../constants/session';
import { TOKENS } from '../../constants/theme';
import { getTimerSpot } from '../../utils/spotInfo';

// logs
import { logger } from '../../utils/loggers';

// files specific to this screen
import { useParkingSpots } from '../../hooks/useParkingSpots';
import MapHeader from './components/MapHeader';
import MapOverlays from './components/MapOverlays';
import MapReticle from './components/MapReticle';
import ParkingBottomSheet from './components/ParkingBottomSheet';
import { SCREEN_HEIGHT, SCREEN_WIDTH, SHEET_BOTTOM_OFFSET } from './constants';
import { styles } from './styles';
import { centerCamera, getMarkerScreenPosition } from './utils/camera';
import { getCurrentPrice } from './utils/pricing';

function MapScreen({ route, navigation }) {
    const insets = useSafeAreaInsets();
    // Compact header: ~70px content + safe area inset (collapsed filters)
    const [navigationHeight, setNavigationHeight] = useState(70 + insets.top);
    const [sheetPeekHeight, setSheetPeekHeight] = useState(108);

    // All layout below is in this screen's own coordinates. React Navigation
    // lays tab screens out *above* the tab bar, so the screen is shorter than
    // the window by the tab bar's height. We measure it on layout; the tab
    // bar height only seeds the first estimate.
    const tabBarHeight = useBottomTabBarHeight();
    const [containerHeight, setContainerHeight] = useState(SCREEN_HEIGHT - tabBarHeight);

    const CARD_ESTIMATED_HEIGHT = 220;
    const SURFACE_STACK_GAP = 12;
    // Distances up from the screen's bottom edge.
    const sheetTop = SHEET_BOTTOM_OFFSET + sheetPeekHeight;   // collapsed sheet's top edge
    const FLOATING_CONTROLS_BOTTOM = sheetTop + 12;             // recenter + pin controls rest here
    const BOTTOM_UI_OFFSET = sheetTop + 16;                     // map padding keeps content clear of the sheet
    const detailCardTopBoundary = navigationHeight + SURFACE_STACK_GAP;
    const detailCardBottomBoundary = containerHeight - BOTTOM_UI_OFFSET - SURFACE_STACK_GAP;

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
    // Mirror of placingPin for the region-change handlers, which are created
    // once and would otherwise close over a stale value.
    const placingPinRef = useRef(false);
    const reticleLiftedRef = useRef(false);

    // animations
    const controlsOpacity = useRef(new Animated.Value(1)).current;
    const controlsTranslateY = useRef(new Animated.Value(0)).current;
    // Drives the screen-fixed reticle: 0 dropped (settled), 1 lifted (moving).
    const reticleLift = useRef(new Animated.Value(0)).current;

    // data state
    const [region, setRegion] = useState(DEFAULT_LOCATION);
    const [userLocation, setUserLocation] = useState(null);
    const [filterType, setFilterType] = useState('all');
    const [searchRadius, setSearchRadius] = useState(DEFAULT_SEARCH_RADIUS);
    const [selectedSpot, setSelectedSpot] = useState(null);
    // Bumped by "Try again" to refetch the same search after a failed load.
    const [reloadKey, setReloadKey] = useState(0);
    const [isSearchFocused, setIsSearchFocused] = useState(false);
    // Camera calls are no-ops until the native map is ready.
    const [mapReady, setMapReady] = useState(false);

    // pin state
    const [pinnedLocation, setPinnedLocation] = useState(null);
    const [searchMode, setSearchMode] = useState('current'); // 'current' | 'pinned'
    const [placingPin, setPlacingPin] = useState(false);

    // flippable card state
    const [flippableCardVisible, setFlippableCardVisible] = useState(false);
    const [flippableCardPosition, setFlippableCardPosition] = useState({ x: 0, y: 0 });
    const [flippableCardSpot, setFlippableCardSpot] = useState(null);

    useEffect(() => {
        placingPinRef.current = placingPin;
    }, [placingPin]);

    // `region` updates on every map settle. Callbacks that only need it at
    // call time read it from this ref, so their identity stays stable and the
    // memoized children they're passed to (header, markers, sheet) don't
    // re-render on every pan.
    const regionRef = useRef(region);
    useEffect(() => {
        regionRef.current = region;
    }, [region]);

    // Where the API search is centered. While placing the pin we follow the
    // map center (updated on settle); otherwise the pinned or current location.
    const searchLocation = useMemo(() => {
        if (placingPin) {
            return { latitude: region.latitude, longitude: region.longitude };
        }
        return (searchMode === 'pinned' && pinnedLocation) ? pinnedLocation : userLocation;
    }, [placingPin, region.latitude, region.longitude, searchMode, pinnedLocation, userLocation]);

    // The radius ring is only drawn for a settled search, so it tracks the
    // pinned/current center (never the live map center).
    const circleCenter = useMemo(() => (
        (searchMode === 'pinned' && pinnedLocation) ? pinnedLocation : userLocation
    ), [searchMode, pinnedLocation, userLocation]);

    // Fetch once at the largest preset, then narrow client-side as the user
    // switches presets. Changing the radius is instant and never refetches.
    const {
        spots: allSpots,
        loading: spotsLoading,
        error: spotsError,
    } = useParkingSpots(searchLocation, FETCH_RADIUS, filterType, reloadKey);

    const handleRetry = useCallback(() => {
        logger.log('spots_retry_pressed', {}, 'UI_EVENT');
        setReloadKey((k) => k + 1);
    }, []);
    const spots = useMemo(() => (
        Array.isArray(allSpots)
            ? allSpots.filter(s => (typeof s.distance === 'number' ? s.distance : Infinity) <= searchRadius)
            : []
    ), [allSpots, searchRadius]);

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


    const showControls = useCallback(() => {
        Animated.parallel([
            Animated.timing(controlsOpacity, {
                toValue: 1,
                duration: 200,
                useNativeDriver: true
            }),
            Animated.timing(controlsTranslateY, {
                toValue: 0,
                duration: 200,
                useNativeDriver: true
            }),
        ]).start();
    }, [controlsOpacity, controlsTranslateY]);

    const hideControls = useCallback(() => {
        Animated.parallel([
            Animated.timing(controlsOpacity, {
                toValue: 0,
                duration: 200,
                useNativeDriver: true
            }),
            Animated.timing(controlsTranslateY, {
                toValue: -50,
                duration: 200,
                useNativeDriver: true
            }),
        ]).start();
    }, [controlsOpacity, controlsTranslateY]);

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

    // ===== Reticle placement flow =====

    // Enter placement, centering the map on the most relevant existing point.
    const startPlacing = useCallback(() => {
        const target =
            (searchMode === 'pinned' && pinnedLocation) ? pinnedLocation : (userLocation || regionRef.current);

        setSelectedSpot(null);
        setFlippableCardVisible(false);
        bottomSheetRef.current?.dismiss();
        setPlacingPin(true);
        logger.log('pin_placement_started', { from: searchMode }, 'UI_EVENT');

        if (target) {
            mapRef.current?.animateCamera(
                { center: { latitude: target.latitude, longitude: target.longitude } },
                { duration: 220 }
            );
        }
    }, [pinnedLocation, searchMode, userLocation]);

    // Lock the current map center as the pinned search location.
    const confirmPlacement = useCallback(() => {
        const center = {
            latitude: region.latitude,
            longitude: region.longitude,
            latitudeDelta: region.latitudeDelta ?? 0.01,
            longitudeDelta: region.longitudeDelta ?? 0.01,
        };
        setPinnedLocation(center);
        setSearchMode('pinned');
        setPlacingPin(false);
        // important: record the confirmed pin + mode shift
        logger.log('pin_placed', { lat: center.latitude, lng: center.longitude }, 'UI_EVENT');
        logger.log('search_mode_changed', { to: 'pinned' }, 'INFO');
    }, [region]);

    // Abandon placement, returning to whatever search was active before.
    const cancelPlacement = useCallback(() => {
        setPlacingPin(false);
        if (!pinnedLocation) setSearchMode('current');
        logger.log('pin_placement_cancelled', {}, 'UI_EVENT');
    }, [pinnedLocation]);

    // Long-press is a power-user shortcut straight into placement at a point.
    const handleMapLongPress = useCallback((event) => {
        const { coordinate } = event.nativeEvent;
        setSelectedSpot(null);
        setFlippableCardVisible(false);
        bottomSheetRef.current?.dismiss();
        setPlacingPin(true);
        mapRef.current?.animateCamera({ center: coordinate }, { duration: 200 });
        logger.log('pin_placement_started', { from: 'long_press' }, 'UI_EVENT');
    }, []);

    // While placing, lift the reticle as the map starts moving...
    const handleRegionChange = useCallback(() => {
        if (!placingPinRef.current || reticleLiftedRef.current) return;
        reticleLiftedRef.current = true;
        Animated.spring(reticleLift, {
            toValue: 1,
            tension: 120,
            friction: 12,
            useNativeDriver: true,
        }).start();
    }, [reticleLift]);

    // ...and drop it (plus refresh the search center) when it settles.
    const handleRegionChangeComplete = useCallback((nextRegion) => {
        setRegion(nextRegion);
        if (placingPinRef.current) {
            reticleLiftedRef.current = false;
            Animated.spring(reticleLift, {
                toValue: 0,
                tension: 120,
                friction: 10,
                useNativeDriver: true,
            }).start();
        }
    }, [reticleLift]);

    // Stable across pans (reads region via ref) — it's passed to every map
    // marker, so a new identity here would re-render all of them.
    const selectSpot = useCallback(async (spot, fromList = false) => {
        // important: deep snapshot of the chosen spot for diagnostics
        logger.logSpotData(spot, `Selected from ${fromList ? 'LIST' : 'MAP'}`);
        setSelectedSpot(spot);
        setFlippableCardVisible(false);
        bottomSheetRef.current?.dismiss();

        // Remember the last public spot opened — the Park tab offers it as
        // "Use this spot", so its rate and time limit come along for free.
        const timerSpot = getTimerSpot(spot);
        if (timerSpot) {
            AsyncStorage.setItem(STORAGE_KEYS.LAST_SPOT, JSON.stringify(timerSpot)).catch(() => {});
        }

        if (spot?.coordinates) {
            const lat = spot.coordinates.coordinates[1];
            const lng = spot.coordinates.coordinates[0];

            await centerCamera(mapRef, regionRef.current, lat, lng, 140);
            // important: confirm camera move for traceability
            logger.log('camera_centered_on_spot', { id: spot?.id, lat, lng }, 'INFO');

            setTimeout(async () => {
                const delay = fromList ? 400 : 200;
                setTimeout(async () => {
                    const screenPos = await getMarkerScreenPosition(mapRef, spot);
                    const yCap = Math.max(
                        detailCardTopBoundary,
                        detailCardBottomBoundary - CARD_ESTIMATED_HEIGHT
                    );

                    if (screenPos) {
                        setFlippableCardPosition({
                            x: screenPos.x,
                            y: Math.min(screenPos.y, yCap),
                        });
                        setFlippableCardSpot(spot);
                        setFlippableCardVisible(true);
                    } else {
                        setFlippableCardPosition({
                            x: SCREEN_WIDTH / 2,
                            y: Math.min(containerHeight / 3, yCap),
                        });
                        setFlippableCardSpot(spot);
                        setFlippableCardVisible(true);
                    }
                }, delay);
            }, 0);
        }
    }, [detailCardTopBoundary, detailCardBottomBoundary]);

    // selectSpot already collapses the sheet.
    const handleListItemPress = useCallback((spot) => {
        selectSpot(spot, true);
    }, [selectSpot]);

    // Tapping a spot on Home navigates here with it as `initialSpot`. Show it
    // (center + card) once the map can move, then clear the param so coming
    // back to this tab later doesn't re-open it.
    const initialSpot = route?.params?.initialSpot;
    useEffect(() => {
        if (!initialSpot || !mapReady) return;
        selectSpot(initialSpot, true);
        navigation?.setParams({ initialSpot: undefined, fromList: undefined });
    }, [initialSpot, mapReady, navigation, selectSpot]);

    const handleClearPin = useCallback(() => {
        logger.log('clear_pin_button_pressed', {}, 'UI_EVENT');
        setPinnedLocation(null);
        setSearchMode('current');
        setSelectedSpot(null);
        setFlippableCardVisible(false);
    }, []);

    const onNavigate = (spot) => {
        if (!spot) return;
        const lat = spot?.coordinates?.coordinates?.[1];
        const lng = spot?.coordinates?.coordinates?.[0];
        if (typeof lat === 'number' && typeof lng === 'number') {
            // important: record external handoff to maps
            logger.log('open_external_navigation', { lat, lng, provider: 'google' }, 'UI_EVENT');
            Linking.openURL(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`)
                .catch(() => logger.log('open_external_navigation_failed', { lat, lng }, 'WARN'));
        }
    };

    // "Park here" — hand the open spot to the Park tab's timer.
    const handleParkHere = useCallback(() => {
        const timerSpot = getTimerSpot(flippableCardSpot);
        if (!timerSpot) return;
        logger.log('park_here_pressed', { spotId: timerSpot.id }, 'UI_EVENT');
        setFlippableCardVisible(false);
        setSelectedSpot(null);
        navigation?.navigate('Park', { spot: timerSpot });
    }, [flippableCardSpot, navigation]);

    const dynamicStyles = useMemo(() => ({
        topNavigation: { ...styles.topNavigation, paddingTop: insets.top + 4 },
    }), [insets.top]);

    const handleContainerLayout = useCallback((event) => {
        const measuredHeight = Math.round(event.nativeEvent.layout.height);
        if (measuredHeight <= 0) return;
        setContainerHeight((currentHeight) => (
            Math.abs(currentHeight - measuredHeight) > 1 ? measuredHeight : currentHeight
        ));
    }, []);

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
        setFlippableCardVisible(false);
    }, [isSearchFocused]);

    const handleMapPanDrag = useCallback(() => {
        handleMapInteraction();
        setFlippableCardVisible(false);
    }, [handleMapInteraction]);

    // Selecting a place from search is an explicit, precise choice — pin it
    // directly without entering the reticle flow.
    const handlePlaceSelected = useCallback((place) => {
        if (place?.lat && place?.lng) {
            const newRegion = {
                latitude: place.lat,
                longitude: place.lng,
                latitudeDelta: 0.005,
                longitudeDelta: 0.005,
            };
            setRegion(newRegion);
            mapRef.current?.animateToRegion(newRegion, 300);
            setPinnedLocation(newRegion);
            setSearchMode('pinned');
            setPlacingPin(false);
            logger.log('search_mode_changed', { to: 'pinned' }, 'INFO');
        }
    }, []);

    // Radius preset tapped in the bottom sheet. Filtering is client-side and
    // instant; we also gently zoom so the whole search circle stays visible.
    // Skipped while placing the pin so the reticle target never moves.
    const handleRadiusChange = useCallback((nextRadius) => {
        setSearchRadius(nextRadius);
        logger.log('radius_changed', { radius: nextRadius }, 'UI_EVENT');

        if (placingPinRef.current) return;
        const center = (searchMode === 'pinned' && pinnedLocation) ? pinnedLocation : userLocation;
        if (!center) return;

        // Fit the circle's diameter with ~30% breathing room; longitude
        // degrees shrink with latitude, so widen accordingly.
        const latitudeDelta = Math.max(0.005, (nextRadius * 2.6) / 111320);
        const longitudeDelta = latitudeDelta / Math.cos((center.latitude * Math.PI) / 180);
        mapRef.current?.animateToRegion({
            latitude: center.latitude,
            longitude: center.longitude,
            latitudeDelta,
            longitudeDelta,
        }, 250);
    }, [searchMode, pinnedLocation, userLocation]);

    // The reticle points at the center of the visible band (between the header
    // and the bottom UI). mapPadding makes the reported region center align
    // with this same point, so map center == reticle target.
    const reticleX = SCREEN_WIDTH / 2;
    const reticleY = navigationHeight + (containerHeight - navigationHeight - BOTTOM_UI_OFFSET) / 2;

    return (
        <View style={styles.container} onLayout={handleContainerLayout}>
            <StatusBar barStyle="dark-content" backgroundColor={TOKENS.surface} />

            {/* map — rendered FIRST so iOS hitTest routes taps on later siblings
                (header, FAB, bottom sheet) to those overlays instead of leaking
                through to the map's onPress. */}
            <MapView
                ref={mapRef}
                style={styles.map}
                provider={PROVIDER_GOOGLE}
                initialRegion={region}
                onRegionChange={handleRegionChange}
                onRegionChangeComplete={handleRegionChangeComplete}
                onMapReady={() => setMapReady(true)}
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
                    bottom: BOTTOM_UI_OFFSET,
                }}
            >
                <MapOverlays
                    searchCenter={circleCenter}
                    searchRadius={searchRadius}
                    searchMode={searchMode}
                    pinnedLocation={pinnedLocation}
                    placingPin={placingPin}
                    spots={spots}
                    selectedSpot={selectedSpot}
                    onSelectSpot={selectSpot}
                />
            </MapView>

            {/* screen-fixed reticle — only while placing */}
            {placingPin && (
                <MapReticle lift={reticleLift} x={reticleX} y={reticleY} />
            )}

            {/* header — rendered AFTER the map so it sits on top for both
                painting and iOS touch routing. */}
            <View style={dynamicStyles.topNavigation} onLayout={handleNavigationLayout}>
                <MapHeader
                    isDetailActive={flippableCardVisible}
                    placingPin={placingPin}
                    pinnedLocation={pinnedLocation}
                    searchMode={searchMode}
                    onStartPlacing={startPlacing}
                    filterType={filterType}
                    setFilterType={setFilterType}
                    onPlaceSelected={handlePlaceSelected}
                />
            </View>

            {/* floating recenter button — hidden while placing the pin */}
            {!placingPin && (
                <Animated.View
                    style={[
                        styles.fabContainer,
                        {
                            opacity: controlsOpacity,
                            transform: [{ translateY: Animated.multiply(controlsTranslateY, -1) }],
                            bottom: FLOATING_CONTROLS_BOTTOM,
                        }
                    ]}
                    pointerEvents="auto"
                >
                    <Pressable
                        style={({ pressed }) => [styles.fab, styles.fabPrimary, pressed && styles.fabPressed]}
                        accessibilityRole="button"
                        accessibilityLabel={
                            searchMode === 'pinned'
                                ? 'Center map on your pinned location'
                                : 'Center map on your location'
                        }
                        onPress={() => {
                            logger.log('ui_recenter_pressed', { mode: searchMode }, 'UI_EVENT');

                            const targetLocation =
                                (searchMode === 'pinned' && pinnedLocation) ? pinnedLocation : userLocation;

                            if (targetLocation) {
                                mapRef.current?.animateCamera(
                                    { center: { latitude: targetLocation.latitude, longitude: targetLocation.longitude } },
                                    { duration: 180 }
                                );
                                setSelectedSpot(null);
                                setFlippableCardVisible(false);
                            }
                        }}
                    >
                        <MaterialCommunityIcons
                            name={searchMode === 'pinned' ? 'map-marker' : 'crosshairs-gps'}
                            size={22}
                            color={TOKENS.onPrimary}
                        />
                    </Pressable>
                </Animated.View>
            )}

            {/* placement controls — shown while setting the search pin */}
            {placingPin && (
                <View
                    style={[styles.placementDock, { bottom: FLOATING_CONTROLS_BOTTOM }]}
                    pointerEvents="box-none"
                >
                    <View style={styles.placementHintPill}>
                        <Text style={styles.placementHintText}>
                            Move the map to position the pin
                        </Text>
                    </View>

                    <View style={styles.placementActions}>
                        <Pressable
                            style={({ pressed }) => [
                                styles.placementBtn,
                                styles.placementBtnGhost,
                                pressed && styles.placementBtnPressed,
                            ]}
                            onPress={cancelPlacement}
                            accessibilityRole="button"
                            accessibilityLabel="Cancel setting search location"
                        >
                            <Text style={styles.placementBtnGhostText}>Cancel</Text>
                        </Pressable>

                        <Pressable
                            style={({ pressed }) => [
                                styles.placementBtn,
                                styles.placementBtnPrimary,
                                pressed && styles.placementBtnPressed,
                            ]}
                            onPress={confirmPlacement}
                            accessibilityRole="button"
                            accessibilityLabel="Search this area"
                        >
                            <MaterialCommunityIcons name="map-marker-check" size={18} color={TOKENS.onPrimary} />
                            <Text style={styles.placementBtnPrimaryText}>Search here</Text>
                        </Pressable>
                    </View>
                </View>
            )}

            {/* parking bottom sheet */}
            <ParkingBottomSheet
                ref={bottomSheetRef}
                spots={spots}
                selectedSpot={selectedSpot}
                searchMode={searchMode}
                searchRadius={searchRadius}
                onRadiusChange={handleRadiusChange}
                loading={spotsLoading}
                error={spotsError}
                onRetry={handleRetry}
                getCurrentPrice={getCurrentPrice}
                onPeekHeightChange={setSheetPeekHeight}
                containerHeight={containerHeight}
                topInset={navigationHeight}
                onItemPress={handleListItemPress}
                onClearPin={handleClearPin}
            />

            {/* flippable card */}
            <FlippableParkingCard
                visible={flippableCardVisible}
                spot={flippableCardSpot}
                position={flippableCardPosition}
                topBoundary={detailCardTopBoundary}
                bottomBoundary={detailCardBottomBoundary}
                onClose={() => {
                    setFlippableCardVisible(false);
                    setSelectedSpot(null);
                }}
                onNavigate={() => onNavigate(flippableCardSpot)}
                onParkHere={handleParkHere}
            />
        </View>


    );
}

export default MapScreen;
