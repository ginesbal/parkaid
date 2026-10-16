import { StatusBar } from 'expo-status-bar';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, FlatList, LayoutAnimation, Platform, RefreshControl, UIManager, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import Header from './components/Header';
import ParkingList from './components/ParkingList';
import EmptyState from './components/ParkingList/EmptyState';
import LoadingState from './components/ParkingList/LoadingState';

import { useFilterState } from '../../hooks/useFilterState';
import { useLocationManager } from '../../hooks/useLocationManager';
import { useParkingSpots } from '../../hooks/useParkingSpots';

import { getGreeting } from '../../utils/greeting';
import { logger } from '../../utils/loggers';
import { isCovered, sortByDistance, sortByValue } from '../../utils/spotPresentation';

import { DEFAULT_SEARCH_RADIUS } from '../../constants/parking';
import { TOKENS } from '../../constants/theme';
import { styles } from './HomeScreen.styles';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

// Permit-only blocks are a poor first suggestion unless the driver asked for them.
function pickTopSpot(spots, activeFilter) {
  if (activeFilter === 'residential') return spots[0];
  return spots.find((s) => s.spot_type !== 'residential') || spots[0];
}

export default function HomeScreen({ navigation }) {
  // location & filter state
  const { location, isLoadingLocation, locationError } = useLocationManager();

  const {
    activeFilter,
    setActiveFilter,
    searchRadius,
    setSearchRadius,
  } = useFilterState();

  // 'near' | 'value' | 'covered' — see ViewChips
  const [view, setView] = useState('near');
  const [filtersOpen, setFiltersOpen] = useState(false);

  // Covered asks the API for off-street only, then keeps the parkades.
  const requestType = view === 'covered' ? 'off_street' : activeFilter;

  // Badge count for the Filters button; the type does not count while Covered overrides it.
  const filterCount =
    (view !== 'covered' && activeFilter !== 'all' ? 1 : 0) +
    (searchRadius !== DEFAULT_SEARCH_RADIUS ? 1 : 0);

  // data fetching hook
  const { spots, loading, error } = useParkingSpots(location, searchRadius, requestType);

  // local UI state
  const [refreshing, setRefreshing] = useState(false);
  const [lastRefresh, setLastRefresh] = useState(null);

  // Full-screen loading only until the first answer. After that the header
  // stays put and the list updates in place.
  const [hasFetched, setHasFetched] = useState(false);
  const wasLoadingRef = useRef(false);
  useEffect(() => {
    if (wasLoadingRef.current && !loading) setHasFetched(true);
    wasLoadingRef.current = loading;
  }, [loading]);

  const visibleSpots = useMemo(() => {
    const list = Array.isArray(spots) ? spots : [];
    if (view === 'covered') return sortByDistance(list.filter(isCovered));
    if (view === 'value') return sortByValue(list);
    return sortByDistance(list);
  }, [spots, view]);

  const topPick = useMemo(
    () => (visibleSpots.length ? pickTopSpot(visibleSpots, activeFilter) : null),
    [visibleSpots, activeFilter]
  );
  const restSpots = useMemo(
    () => visibleSpots.filter((s) => s !== topPick),
    [visibleSpots, topPick]
  );

  // Re-read on each render; a screen left open past noon should say so.
  const greeting = getGreeting();

  // first screen mount + key inputs snapshot
  useEffect(() => {
    logger.log('home_mount', {
      hasLocation: !!location,
      activeFilter,
      searchRadius
    });
  }, []);

  // log when list transitions from empty->has data
  const prevCountRef = useRef(0);
  useEffect(() => {
    const count = Array.isArray(spots) ? spots.length : 0;
    if (count > 0 && prevCountRef.current === 0) {
      logger.log('spots_loaded', {
        count,
        filter: requestType,
        radius: searchRadius
      });
    }
    prevCountRef.current = count;
  }, [spots, requestType, searchRadius]);

  // capture empty-state scenarios
  useEffect(() => {
    if (hasFetched && !loading && !refreshing && visibleSpots.length === 0) {
      logger.log('spots_empty', {
        hasLocation: !!location,
        view,
        filter: requestType,
        radius: searchRadius,
        lastRefresh
      });
    }
  }, [hasFetched, loading, refreshing, visibleSpots.length, location, view, requestType, searchRadius, lastRefresh]);

  // navigation handlers
  const handleMapPress = () => {
    logger.log('nav_to_map_from_home', { source: 'empty_state' });
    navigation.navigate('Map');
  };

  const handleSearchPress = () => {
    logger.log('nav_to_map_from_home', { source: 'search' });
    navigation.navigate('Map', { focusSearch: true });
  };

  const handleSpotPress = useCallback((spot) => {
    logger.log('spot_selected_from_home', {
      spotId: spot?.id,
      address: spot?.address
    });

    navigation.navigate('Map', {
      initialSpot: spot,
      fromList: true,
    });
  }, [navigation]);

  const handleViewChange = useCallback((next) => {
    logger.log('home_view_changed', { from: view, to: next });
    setView(next);
  }, [view]);

  // Picking a type in Filters leaves Covered, which overrides the type.
  const handleTypeChange = useCallback((type) => {
    setActiveFilter(type);
    if (view === 'covered') setView('near');
  }, [view, setActiveFilter]);

  const toggleFilters = useCallback(() => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setFiltersOpen((open) => !open);
  }, []);

  const handleExpandSearch = () => {
    logger.log('expand_search', {
      oldRadius: searchRadius,
      newRadius: 1000,
      view
    });

    setSearchRadius(1000);
    // Covered keeps its meaning; a wider radius is what finds a parkade.
    if (view !== 'covered') setActiveFilter('all');
  };

  const handleRefresh = useCallback(() => {
    logger.log('home_refresh', {
      filter: requestType,
      radius: searchRadius
    });

    setRefreshing(true);
    setLastRefresh(new Date());

    // reset refreshing after delay
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  }, [requestType, searchRadius]);

  // filter/radius changes
  useEffect(() => {
    if (activeFilter) {
      logger.log('filter_changed', { filter: activeFilter });
    }
  }, [activeFilter]);

  useEffect(() => {
    if (searchRadius) {
      logger.log('radius_changed', { radius: searchRadius });
    }
  }, [searchRadius]);

  // initial loading state
  if (isLoadingLocation || (!hasFetched && !error)) {
    return <LoadingState searchRadius={searchRadius} />;
  }

  const renderSpot = ({ item }) => (
    <ParkingList.Item spot={item} onPress={handleSpotPress} />
  );

  const emptyComponent = loading ? (
    <View style={styles.updating}>
      <ActivityIndicator color={TOKENS.primary} accessibilityLabel="Loading parking" />
    </View>
  ) : (
    <EmptyState
      onExpandSearch={handleExpandSearch}
      onViewMap={handleMapPress}
      onRetry={handleRefresh}
      errorMessage={error}
      view={view}
      searchRadius={searchRadius}
    />
  );

  return (
    <>
      <StatusBar style="dark" />
      <SafeAreaView edges={['top', 'left', 'right']} style={styles.container}>
        <FlatList
          data={restSpots}
          renderItem={renderSpot}
          keyExtractor={(item) => String(item.id)}
          ListHeaderComponent={
            <Header
              greeting={greeting}
              statusMessage={error || locationError}
              statusTone={error ? 'warning' : 'info'}
              onSearchPress={handleSearchPress}
              view={view}
              onViewChange={handleViewChange}
              filtersOpen={filtersOpen}
              onToggleFilters={toggleFilters}
              filterCount={filterCount}
              activeFilter={activeFilter}
              setActiveFilter={handleTypeChange}
              searchRadius={searchRadius}
              setSearchRadius={setSearchRadius}
              topPick={topPick}
              onViewSpot={handleSpotPress}
              moreCount={restSpots.length}
              isUpdating={loading}
            />
          }
          ListEmptyComponent={topPick ? null : emptyComponent}
          ListFooterComponent={<View style={styles.footer} />}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={TOKENS.primary}
              colors={[TOKENS.primary]}
            />
          }
          contentContainerStyle={visibleSpots.length === 0 ? styles.emptyList : null}
          keyboardShouldPersistTaps="handled"
        />
      </SafeAreaView>
    </>
  );
}
