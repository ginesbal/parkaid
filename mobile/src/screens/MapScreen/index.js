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

// logs
import { logger } from '../../utils/loggers';

// files specific to this screen
import { useParkingSpots } from '../../hooks/useParkingSpots';
import MapHeader from './components/MapHeader';
import MapOverlays from './components/MapOverlays';
import ParkingBottomSheet from './components/ParkingBottomSheet';
import { SCREEN_HEIGHT, SCREEN_WIDTH } from './constants';
import { styles } from './styles';
import { centerCamera, getMarkerScreenPosition } from './utils/camera';
import { getCurrentPrice } from './utils/pricing';

function MapScreen() {
    const insets = useSafeAreaInsets();
    // Compact header: ~70px content + safe area inset (collapsed filters)
    const [navigationHeight, setNavigationHeight] = useState(70 + insets.top);
    const [sheetPeekHeight, setSheetPeekHeight] = useState(108);

    // Get ACTUAL tab bar height from React Navigation (includes padding + safe areas)
    const tabBarHeight = useBottomTabBarHeight();
    const CARD_ESTIMATED_HEIGHT = 220;
    const SURFACE_STACK_GAP = 12;
    const BOTTOM_UI_OFFSET = tabBarHeight + sheetPeekHeight + 16;
    const detailCardTopBoundary = navigationHeight + SURFACE_STACK_GAP;
    const detailCardBottomBoundary = SCREEN_HEIGHT - BOTTOM_UI_OFFSET - SURFACE_STACK_GAP;

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
    const selectedAnim = useRef(new Animated.Value(0)).current;
    const pinDropAnim = useRef(new Animated.Value(0)).current;

    // data state
    const [region, setRegion] = useState(DEFAULT_LOCATION);
    const [userLocation, setUserLocation] = useState(null);
    const [filterType, setFilterType] = useState('all');
    const [searchRadius, setSearchRadius] = useState(150);
    const [selectedSpot, setSelectedSpot] = useState(null);
    const [isSearchFocused, setIsSearchFocused] = useState(false);

    // pin state
    const [pinnedLocation, setPinnedLocation] = useState(null);
    const [searchMode, setSearchMode] = useState('current'); // 'current' | 'pinned'
    const [showPinInstructions, setShowPinInstructions] = useState(false);

    // flippable card state
    const [flippableCardVisible, setFlippableCardVisible] = useState(false);
    const [flippableCardPosition, setFlippableCardPosition] = useState({ x: 0, y: 0 });
    const [flippableCardSpot, setFlippableCardSpot] = useState(null);

    // calculate search spots
    const searchLocation = (searchMode === 'pinned' && pinnedLocation) ? pinnedLocation : userLocation;

    const { spots } = useParkingSpots(
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

    // long press to drop pin and switch mode
    const handleMapLongPress = (event) => {
        const { coordinate } = event.nativeEvent;
        setPinnedLocation({
            latitude: coordinate.latitude,
            longitude: coordinate.longitude,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
        });

        pinDropAnim.setValue(0);
        Animated.spring(pinDropAnim, {
            toValue: 1,
            tension: 40,
            friction: 6,
            useNativeDriver: true,
        }).start();

        setSearchMode('pinned');
        setShowPinInstructions(false);
        // important: record pin placement and mode shift
        logger.log('Pin dropped', coordinate, 'UI_EVENT');
        logger.log('search_mode_changed', { to: 'pinned' }, 'INFO');
    };

    const selectSpot = async (spot, fromList = false) => {
        // important: deep snapshot of the chosen spot for diagnostics
        logger.logSpotData(spot, `Selected from ${fromList ? 'LIST' : 'MAP'}`);
        setSelectedSpot(spot);
        setFlippableCardVisible(false);
        bottomSheetRef.current?.dismiss();

        if (spot?.coordinates) {
            const lat = spot.coordinates.coordinates[1];
            const lng = spot.coordinates.coordinates[0];

            await centerCamera(mapRef, region, lat, lng, 140);
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
                            y: Math.min(SCREEN_HEIGHT / 3, yCap),
                        });
                        setFlippableCardSpot(spot);
                        setFlippableCardVisible(true);
                    }
                }, delay);
            }, 0);
        }

        selectedAnim.setValue(0);
        Animated.spring(selectedAnim, {
            toValue: 1,
            tension: 88,
            friction: 8,
            useNativeDriver: true,
        }).start();
    };

    const onNavigate = (spot) => {
        if (!spot) return;
        const lat = spot?.coordinates?.coordinates?.[1];
        const lng = spot?.coordinates?.coordinates?.[0];
        if (typeof lat === 'number' && typeof lng === 'number') {
            // important: record external handoff to maps
            logger.log('open_external_navigation', { lat, lng, provider: 'google' }, 'UI_EVENT');
            Linking.openURL(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`);
        }
    };

    const searchCenter = useMemo(() => (
        (searchMode === 'pinned' && pinnedLocation) ? pinnedLocation : userLocation
    ), [pinnedLocation, searchMode, userLocation]);

    const selScale = selectedAnim.interpolate({
        inputRange: [0, 0.5, 1],
        outputRange: [0.92, 1.12, 1]
    });
    const selTranslateY = selectedAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [6, 0]
    });

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
        setFlippableCardVisible(false);
    }, [isSearchFocused]);

    const handleMapPanDrag = useCallback(() => {
        handleMapInteraction();
        setFlippableCardVisible(false);
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
            mapRef.current?.animateToRegion(newRegion, 300);
            setPinnedLocation(newRegion);
            setSearchMode('pinned');
            logger.log('search_mode_changed', { to: 'pinned' }, 'INFO');
        }
    }, []);

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#fff" />

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
                    bottom: BOTTOM_UI_OFFSET,
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
                    selScale={selScale}
                    selTranslateY={selTranslateY}
                    onSelectSpot={selectSpot}
                />
            </MapView>

            {/* header — rendered AFTER the map so it sits on top for both
                painting and iOS touch routing. */}
            <View style={dynamicStyles.topNavigation} onLayout={handleNavigationLayout}>
                <MapHeader
                    isSearchFocused={isSearchFocused}
                    isDetailActive={flippableCardVisible}
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
                        color="#fff"
                    />
                </Pressable>
            </Animated.View>

            {/* parking bottom sheet */}
            <ParkingBottomSheet
                ref={bottomSheetRef}
                spots={spots}
                selectedSpot={selectedSpot}
                searchMode={searchMode}
                getCurrentPrice={getCurrentPrice}
                onPeekHeightChange={setSheetPeekHeight}
                tabBarHeight={tabBarHeight}
                topInset={navigationHeight}
                onItemPress={(spot) => {
                    selectSpot(spot, true);
                    bottomSheetRef.current?.dismiss();
                }}
                onClearPin={() => {
                    logger.log('clear_pin_button_pressed', {}, 'UI_EVENT');
                    setPinnedLocation(null);
                    setSearchMode('current');
                    setSelectedSpot(null);
                    setFlippableCardVisible(false);
                }}
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
            />
        </View>


    );
}

export default MapScreen;
