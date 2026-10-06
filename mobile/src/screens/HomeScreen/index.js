import { StatusBar } from 'expo-status-bar';
import React, { useState, useRef, useMemo, useCallback } from 'react';
import { ActivityIndicator, FlatList, RefreshControl, Animated, View, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import Header from './components/Header';
import MapFAB from './components/MapFAB';
import ParkingList from './components/ParkingList';
import EmptyState from './components/ParkingList/EmptyState';
import LoadingState from './components/ParkingList/LoadingState';

import { useFilterState } from '../../hooks/useFilterState';
import { useLocationManager } from '../../hooks/useLocationManager';
import { useParkingSpots } from '../../hooks/useParkingSpots';

import { logger } from '../../utils/loggers';
import { calculateQuickInfo, getDistanceLabel } from '../../utils/parkingHelpers';

import { RADIUS_OPTIONS } from '../../constants/parking';
import { TOKENS } from '../../constants/theme';
import { styles } from './HomeScreen.styles';

const WIDEST_RADIUS = RADIUS_OPTIONS[RADIUS_OPTIONS.length - 1].value;
// Never leave the pull-to-refresh spinner up if a refetch can't complete
// (the API itself gives up after 8s).
const REFRESH_TIMEOUT_MS = 10000;

export default function HomeScreen({ navigation }) {
  // location & filter state
  const { location, isLoadingLocation, locationError } = useLocationManager();

  const {
    activeFilter,
    setActiveFilter,
    searchRadius,
    setSearchRadius,
  } = useFilterState();

  // Bumped by pull-to-refresh and "Retry" to refetch, bypassing the cache.
  const [reloadKey, setReloadKey] = useState(0);

  // data fetching hook
  const { spots, loading, error, lastUpdated } = useParkingSpots(
    location,
    searchRadius,
    activeFilter,
    reloadKey
  );

  // local UI state
  const [refreshing, setRefreshing] = useState(false);
  const [lastRefresh, setLastRefresh] = useState(null);
  const refreshStartedAtRef = useRef(0);
  const refreshTimeoutRef = useRef(null);

  // animations (UI concern, not data concern)
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;

  // calculate stats from spots
  const quickInfo = useMemo(() => {
    return calculateQuickInfo(spots);
  }, [spots]);

  // first screen mount + key inputs snapshot
  React.useEffect(() => {
    logger.log('home_mount', {
      hasLocation: !!location,
      activeFilter,
      searchRadius
    });
  }, []);

  // log when list transitions from empty->has data
  const prevCountRef = React.useRef(0);
  React.useEffect(() => {
    const count = Array.isArray(spots) ? spots.length : 0;
    if (count > 0 && prevCountRef.current === 0) {
      logger.log('spots_loaded', {
        count,
        filter: activeFilter,
        radius: searchRadius
      });
    }
    prevCountRef.current = count;
  }, [spots, activeFilter, searchRadius]);

  // capture empty-state scenarios
  React.useEffect(() => {
    if (!loading && !refreshing && Array.isArray(spots) && spots.length === 0) {
      logger.log('spots_empty', {
        hasLocation: !!location,
        filter: activeFilter,
        radius: searchRadius,
        lastRefresh
      });
    }
  }, [loading, refreshing, spots, location, activeFilter, searchRadius, lastRefresh]);

  // navigation handlers
  const handleMapPress = () => {
    logger.log('nav_to_map_from_home', { source: 'fab_or_header' });
    navigation.navigate('Map');
  };

  const handleSpotPress = (spot) => {
    logger.log('spot_selected_from_home', {
      spotId: spot?.id,
      address: spot?.address
    });

    navigation.navigate('Map', {
      initialSpot: spot,
      fromList: true,
    });
  };

  // The empty state's next step. Widen first — keeping the user's type
  // filter — and only once at the widest radius offer to clear the filter.
  // It never shrinks the radius (it used to jump to 1 km, even from 2 km).
  const canWiden = searchRadius < WIDEST_RADIUS;
  const canShowAllTypes = activeFilter !== 'all';
  const expandLabel = canWiden
    ? `Search within ${getDistanceLabel(WIDEST_RADIUS)}`
    : canShowAllTypes
      ? 'Show all parking types'
      : null;
  const emptyHint = expandLabel
    ? 'Try a wider search, or switch to the map to look around the next block.'
    : `Nothing within ${getDistanceLabel(WIDEST_RADIUS)}. Switch to the map to search somewhere else.`;

  const handleExpandSearch = () => {
    if (canWiden) {
      logger.log('expand_search', { oldRadius: searchRadius, newRadius: WIDEST_RADIUS });
      setSearchRadius(WIDEST_RADIUS);
      return;
    }
    if (canShowAllTypes) {
      logger.log('expand_search', { clearedFilter: activeFilter });
      setActiveFilter('all');
    }
  };

  // Pull-to-refresh refetches for real (bypassing the response cache) and
  // the spinner stays up until that fetch has actually finished.
  const handleRefresh = useCallback(() => {
    logger.log('home_refresh', {
      filter: activeFilter,
      radius: searchRadius
    });

    refreshStartedAtRef.current = Date.now();
    setRefreshing(true);
    setLastRefresh(new Date());
    setReloadKey((key) => key + 1);

    clearTimeout(refreshTimeoutRef.current);
    refreshTimeoutRef.current = setTimeout(() => setRefreshing(false), REFRESH_TIMEOUT_MS);
  }, [activeFilter, searchRadius]);

  React.useEffect(() => {
    if (refreshing && lastUpdated && lastUpdated >= refreshStartedAtRef.current) {
      clearTimeout(refreshTimeoutRef.current);
      setRefreshing(false);
    }
  }, [refreshing, lastUpdated]);

  React.useEffect(() => () => clearTimeout(refreshTimeoutRef.current), []);

  // filter/radius changes
  React.useEffect(() => {
    if (activeFilter) {
      logger.log('filter_changed', { filter: activeFilter });
    }
  }, [activeFilter]);

  React.useEffect(() => {
    if (searchRadius) {
      logger.log('radius_changed', { radius: searchRadius });
    }
  }, [searchRadius]);

  // Full-screen loading only for the very first load. After that, changing
  // a filter or the radius keeps the header (and the chip just tapped) on
  // screen and shows progress in place instead of blanking everything.
  const isFirstLoad = isLoadingLocation || (loading && lastUpdated === null);
  const isUpdating = loading && !refreshing && !isFirstLoad;

  if (isFirstLoad) {
    logger.log('home_loading_state', {
      loading,
      refreshing,
      isLoadingLocation
    });
    return <LoadingState searchRadius={searchRadius} />;
  }

  // While new results load, dim the current ones so it's clear they're
  // about to change — without moving anything.
  const renderSpot = ({ item }) => (
    <View style={isUpdating ? listStyles.updating : null}>
      <ParkingList.Item
        spot={item}
        onPress={() => handleSpotPress(item)}
        fadeAnim={fadeAnim}
        slideAnim={slideAnim}
      />
    </View>
  );

  // Inset hairline between rows — begins where the address begins
  // (padding 20 + walk block 56 + gap 10 = 86), matching the map's bottom sheet.
  const renderSeparator = () => <View style={listStyles.rowSeparator} />;

  return (
    <>
      <StatusBar style="dark" />
      <SafeAreaView edges={['top']} style={{ backgroundColor: TOKENS.surface }} />
      {/* No 'bottom' edge: the tab bar already covers the home indicator,
          and bottom tabs gives screens the raw insets — adding it again
          left a blank strip above the tab bar. */}
      <SafeAreaView edges={['left', 'right']} style={styles.container}>
        <FlatList
          data={spots}
          renderItem={renderSpot}
          extraData={isUpdating}
          accessibilityState={{ busy: isUpdating }}
          keyExtractor={(item) => String(item.id)}
          ItemSeparatorComponent={renderSeparator}
          ListHeaderComponent={
            <Header
              location={location}
              spots={spots}
              quickInfo={quickInfo}
              activeFilter={activeFilter}
              setActiveFilter={setActiveFilter}
              searchRadius={searchRadius}
              setSearchRadius={setSearchRadius}
              fadeAnim={fadeAnim}
              slideAnim={slideAnim}
              onLocationPress={handleMapPress}
              // Only the location notice: a failed load already explains
              // itself, with a way out, in the empty state below.
              statusMessage={locationError}
            />
          }
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={TOKENS.primary}
              colors={[TOKENS.primary]}
            />
          }
          ListEmptyComponent={
            // Loading with nothing on screen yet: a quiet spinner, not
            // "Nothing nearby" — that would be an answer we don't have.
            loading ? (
              <View style={listStyles.inlineLoading}>
                <ActivityIndicator color={TOKENS.primary} accessibilityLabel="Looking for spots" />
              </View>
            ) : (
              <EmptyState
                onExpandSearch={handleExpandSearch}
                onViewMap={handleMapPress}
                onRetry={handleRefresh}
                hasError={Boolean(error)}
                title={`No spots within ${getDistanceLabel(searchRadius)}`}
                expandLabel={expandLabel}
                hint={emptyHint}
              />
            )
          }
          contentContainerStyle={Array.isArray(spots) && spots.length === 0 ? styles.emptyList : null}
        />

        <MapFAB onPress={handleMapPress} />
      </SafeAreaView>
    </>
  );
}

const listStyles = StyleSheet.create({
  rowSeparator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: TOKENS.divider,
    marginLeft: 86,
  },
  updating: {
    opacity: 0.45,
  },
  inlineLoading: {
    paddingVertical: 48,
    alignItems: 'center',
  },
});
