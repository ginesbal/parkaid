import ScreenStatusBar from '../../components/ScreenStatusBar';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Animated, FlatList, LayoutAnimation, Linking, Platform, RefreshControl, Text, UIManager, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import BrandLoader from '../../components/BrandLoader';
import LiveStage from '../../components/LiveStage';
import Header from './components/Header';
import SpotRow from '../../components/SpotRow';
import EmptyState from './components/ParkingList/EmptyState';
import LoadingState from './components/ParkingList/LoadingState';

import { useLocationManager } from '../../hooks/useLocationManager';
import { useEntrance } from '../../hooks/useEntrance';
import { useParkingSpots } from '../../hooks/useParkingSpots';
import { useReduceMotion } from '../../hooks/useReduceMotion';

import { useFilters } from '../../context/FilterContext';
import { apiTypeFor, applyType } from '../../utils/filters';
import { describeLocation } from '../../utils/geo';
import { getGreeting } from '../../utils/greeting';
import { describeSaved } from '../../utils/loadStatus';
import { logger } from '../../utils/loggers';
import { permitLast, pickTopSpot, rankSpots, sortByValue } from '../../utils/spotPresentation';

import { DEFAULT_SEARCH_RADIUS } from '../../constants/parking';
import { TOKENS } from '../../constants/theme';
import { styles } from './HomeScreen.styles';

// Marks where permit-only blocks start in the list.
const PERMIT_HEADING = { heading: 'permit' };

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export default function HomeScreen({ navigation }) {
  // location & filter state
  const {
    location,
    isLoadingLocation,
    source: locationSource,
    savedAt: locationSavedAt,
    permission,
    locating,
    refreshLocation,
  } = useLocationManager();

  // A fresh fix each time Home opens (the hook asks at most once a minute).
  useEffect(() => navigation.addListener('focus', () => refreshLocation()), [navigation, refreshLocation]);

  // Where the list is measured from, when it is not the phone's location now.
  // A saved place is only named once the fresh fix has failed.
  const place = locating && locationSource === 'saved'
    ? null
    : describeLocation({ source: locationSource, savedAt: locationSavedAt, permission });
  const placeAction = {
    ask: { label: 'Turn on', onPress: () => refreshLocation({ force: true, ask: true }) },
    settings: { label: 'Open Settings', onPress: () => Linking.openSettings() },
    retry: { label: 'Try again', onPress: () => refreshLocation({ force: true }) },
  }[place?.action] ?? null;
  const fromDowntown = locationSource === 'default' || locationSource === 'outside';

  // Type and distance, shared with Map (context/FilterContext).
  const {
    type: activeFilter,
    setType: setActiveFilter,
    radius: searchRadius,
    setRadius: setSearchRadius,
  } = useFilters();

  // How the list is sorted: 'near' | 'value' — see ViewChips
  const [view, setView] = useState('near');
  const [filtersOpen, setFiltersOpen] = useState(false);

  const requestType = apiTypeFor(activeFilter);

  // Badge count for the Filters button.
  const filterCount =
    (activeFilter !== 'all' ? 1 : 0) +
    (searchRadius !== DEFAULT_SEARCH_RADIUS ? 1 : 0);

  // data fetching hook
  const { spots, loading, error, refetch, savedAt, stale } = useParkingSpots(location, searchRadius, requestType);

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

  // Nearest by walk (the cheaper first for the same walk), or cheapest first;
  // permit-only blocks after everywhere a visitor can park.
  const visibleSpots = useMemo(() => {
    const list = applyType(spots, activeFilter);
    if (view === 'value') return permitLast(sortByValue(list), activeFilter);
    return rankSpots(list, activeFilter);
  }, [spots, view, activeFilter]);

  const topPick = useMemo(
    () => (visibleSpots.length ? pickTopSpot(visibleSpots, activeFilter) : null),
    [visibleSpots, activeFilter]
  );
  const restSpots = useMemo(
    () => visibleSpots.filter((s) => s !== topPick),
    [visibleSpots, topPick]
  );
  // Permit-only blocks get their own heading, unless that is all the driver asked for.
  const { parkable, listData } = useMemo(() => {
    if (activeFilter === 'residential') return { parkable: restSpots, listData: restSpots };
    const open = restSpots.filter((s) => s.spot_type !== 'residential');
    const permits = restSpots.filter((s) => s.spot_type === 'residential');
    return { parkable: open, listData: permits.length ? [...open, PERMIT_HEADING, ...permits] : open };
  }, [restSpots, activeFilter]);

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

    navigation.navigate('Details', { spot });
  }, [navigation]);

  const handleViewChange = useCallback((next) => {
    logger.log('home_view_changed', { from: view, to: next });
    setView(next);
  }, [view]);


  const reduceMotion = useReduceMotion();
  const toggleFilters = useCallback(() => {
    if (!reduceMotion) LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setFiltersOpen((open) => !open);
  }, [reduceMotion]);

  const handleExpandSearch = () => {
    logger.log('expand_search', {
      oldRadius: searchRadius,
      newRadius: 1000,
      view
    });

    setSearchRadius(1000);
    // Parkade keeps its meaning; a wider radius is what finds one.
    if (activeFilter !== 'parkade') setActiveFilter('all');
  };

  // Pull to refresh and Retry: refetch past the cache; the spinner stops when
  // that request settles.
  const refreshStartedRef = useRef(false);
  const handleRefresh = useCallback(() => {
    if (!location) return;
    logger.log('home_refresh', {
      filter: requestType,
      radius: searchRadius
    });

    refreshStartedRef.current = false;
    setRefreshing(true);
    setLastRefresh(new Date());
    // Where you are now first, then the list for there.
    refreshLocation({ force: true }).finally(refetch);
  }, [location, requestType, searchRadius, refetch, refreshLocation]);

  useEffect(() => {
    if (!refreshing) return;
    if (loading) {
      refreshStartedRef.current = true;
      return;
    }
    if (refreshStartedRef.current) setRefreshing(false);
  }, [refreshing, loading]);

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

  // The live loader holds its spot only while the list is at rest at the
  // top (a pull to refresh moves it too).
  const [scrolled, setScrolled] = useState(false);

  // The loader hands over to the list with one soft rise, not a hard cut.
  // A saved list on screen ends it at once; the header then says "Updating…".
  const showLoader = isLoadingLocation || (!hasFetched && !error && !spots?.length);
  const [contentIn] = useEntrance(1, !showLoader);

  // initial loading state
  if (showLoader) {
    return <LoadingState searchRadius={searchRadius} phase={isLoadingLocation ? 'location' : 'spots'} />;
  }

  // One grouped inset list per section: the permit heading closes one
  // group and opens the next.
  const renderSpot = ({ item, index }) => (item === PERMIT_HEADING ? (
    <Text style={styles.listHeading} accessibilityRole="header">Permit holders only</Text>
  ) : (
    <SpotRow
      spot={item}
      onPress={handleSpotPress}
      chevron
      first={index === 0 || listData[index - 1] === PERMIT_HEADING}
      last={index === listData.length - 1 || listData[index + 1] === PERMIT_HEADING}
    />
  ));

  const emptyComponent = loading ? (
    <View style={styles.updating}>
      <BrandLoader size={56} label="Updating the list" delay={150} live suspended={scrolled} />
    </View>
  ) : (
    <EmptyState
      onExpandSearch={handleExpandSearch}
      onViewMap={handleMapPress}
      onRetry={handleRefresh}
      error={error}
      type={activeFilter}
      searchRadius={searchRadius}
    />
  );

  return (
    <>
      <ScreenStatusBar style="dark" />
      <SafeAreaView edges={['top', 'left', 'right']} style={styles.container}>
        <LiveStage>
          <Animated.View style={[styles.content, contentIn]}>
          <FlatList
            data={listData}
            renderItem={renderSpot}
            keyExtractor={(item) => (item === PERMIT_HEADING ? 'permit-heading' : String(item.id))}
            ListHeaderComponent={
              <Header
                greeting={greeting}
                statusMessage={place?.text}
                statusAction={placeAction}
                fromDowntown={fromDowntown}
                onSearchPress={handleSearchPress}
                view={view}
                onViewChange={handleViewChange}
                filtersOpen={filtersOpen}
                onToggleFilters={toggleFilters}
                filterCount={filterCount}
                activeFilter={activeFilter}
                setActiveFilter={setActiveFilter}
                searchRadius={searchRadius}
                setSearchRadius={setSearchRadius}
                topPick={topPick}
                onViewSpot={handleSpotPress}
                moreCount={parkable.length}
                savedNote={describeSaved({ savedAt, stale, updating: loading })}
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
            onScroll={(e) => setScrolled(Math.abs(e.nativeEvent.contentOffset.y) > 1)}
            scrollEventThrottle={16}
          />
          </Animated.View>
        </LiveStage>
      </SafeAreaView>
    </>
  );
}
