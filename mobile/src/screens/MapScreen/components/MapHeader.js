import { MaterialCommunityIcons } from '@expo/vector-icons';
import { memo, useCallback, useState } from 'react';
import { LayoutAnimation, Platform, Pressable, Text, UIManager, View } from 'react-native';
import PlacesSearchBar from '../../../components/PlacesAutocomplete/PlacesSearchBar';
import { DEFAULT_SEARCH_RADIUS } from '../../../constants/parking';
import { SELECTED, TOKENS } from '../../../constants/theme';
import { useReduceMotion } from '../../../hooks/useReduceMotion';
import { DISTANCE_OPTIONS, TYPE_OPTIONS } from '../../../utils/filters';
import { getDistanceLabel } from '../../../utils/parkingHelpers';
import { styles } from '../styles';

// Enable LayoutAnimation on Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
}

// Each chip is 36 pt tall; this makes its touch target 44 pt.
const CHIP_SLOP = { top: 4, bottom: 4 };

function MapHeader({
    pinnedLocation,
    showPinInstructions,
    setShowPinInstructions,
    searchMode,
    setSearchMode,
    filterType,
    setFilterType,
    searchRadius,
    setSearchRadius,
    onPlaceSelected,
    searchFocusSignal,
}) {
    const [filtersExpanded, setFiltersExpanded] = useState(false);

    const handleFilterPress = useCallback((type) => {
        setFilterType(type);
    }, [setFilterType]);

    const handleDistancePress = useCallback((distance) => {
        setSearchRadius(distance);
    }, [setSearchRadius]);

    const reduceMotion = useReduceMotion();
    const toggleFilters = useCallback(() => {
        if (!reduceMotion) LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setFiltersExpanded(prev => !prev);
    }, [reduceMotion]);

    // Active filter count for the badge
    const activeFilterCount =
        (filterType !== 'all' ? 1 : 0) + (searchRadius !== DEFAULT_SEARCH_RADIUS ? 1 : 0);

    return (
        <View style={styles.headerBar}>
            {/* Quick actions row — filter + pin buttons sit above the search
                bar, right-aligned. */}
            <View style={styles.quickActions}>
                {/* Filter toggle */}
                <Pressable
                    style={({ pressed }) => [
                        styles.quickAction,
                        filtersExpanded && styles.quickActionActive,
                        pressed && styles.quickActionPressed,
                    ]}
                    onPress={toggleFilters}
                    accessibilityRole="button"
                    accessibilityLabel={filtersExpanded ? 'Hide filters' : 'Show filters'}
                >
                    <MaterialCommunityIcons
                        name="tune-vertical"
                        size={20}
                        color={filtersExpanded ? SELECTED.icon : TOKENS.primaryAlt}
                    />
                    {activeFilterCount > 0 && !filtersExpanded && (
                        <View style={styles.filterBadge}>
                            <Text style={styles.filterBadgeText}>{activeFilterCount}</Text>
                        </View>
                    )}
                </Pressable>

                {/* Pin / location toggle */}
                {pinnedLocation ? (
                    <Pressable
                        style={({ pressed }) => [
                            styles.quickAction,
                            searchMode === 'pinned' && styles.quickActionActive,
                            pressed && styles.quickActionPressed,
                        ]}
                        onPress={() => setSearchMode(searchMode === 'pinned' ? 'current' : 'pinned')}
                        accessibilityRole="button"
                        accessibilityLabel={searchMode === 'pinned' ? 'Switch to current location' : 'Use pinned location'}
                    >
                        <MaterialCommunityIcons
                            name="map-marker"
                            size={20}
                            color={searchMode === 'pinned' ? SELECTED.icon : TOKENS.primaryAlt}
                        />
                    </Pressable>
                ) : (
                    <Pressable
                        style={({ pressed }) => [
                            styles.quickAction,
                            pressed && styles.quickActionPressed,
                        ]}
                        onPress={() => setShowPinInstructions(!showPinInstructions)}
                        accessibilityRole="button"
                        accessibilityLabel="Drop a pin on the map"
                    >
                        <MaterialCommunityIcons
                            name="map-marker-plus"
                            size={20}
                            color={TOKENS.primaryAlt}
                        />
                    </Pressable>
                )}
            </View>

            {/* Search bar — full width, below the quick actions. */}
            <PlacesSearchBar
                onPlaceSelected={onPlaceSelected}
                focusSignal={searchFocusSignal}
                style={styles.searchContainer}
            />

            {/* Expandable filters — single inline row */}
            {filtersExpanded && (
                <View style={styles.filtersInline}>
                    {/* Type chips */}
                    {TYPE_OPTIONS.map(f => (
                        <Pressable
                            key={f.key}
                            style={({ pressed }) => [
                                styles.miniChip,
                                filterType === f.key && styles.miniChipActive,
                                pressed && styles.filterChipPressed,
                            ]}
                            onPress={() => handleFilterPress(f.key)}
                            hitSlop={CHIP_SLOP}
                            accessibilityRole="button"
                            aria-selected={filterType === f.key}
                        >
                            <Text style={[
                                styles.miniChipText,
                                filterType === f.key && styles.miniChipTextActive,
                            ]}>
                                {f.label}
                            </Text>
                        </Pressable>
                    ))}

                    {/* Divider dot */}
                    <View style={styles.chipDivider} />

                    {/* Distance chips */}
                    {DISTANCE_OPTIONS.map(meters => (
                        <Pressable
                            key={meters}
                            style={({ pressed }) => [
                                styles.miniChip,
                                searchRadius === meters && styles.miniChipActive,
                                pressed && styles.filterChipPressed,
                            ]}
                            onPress={() => handleDistancePress(meters)}
                            hitSlop={CHIP_SLOP}
                            accessibilityRole="button"
                            aria-selected={searchRadius === meters}
                        >
                            <Text style={[
                                styles.miniChipText,
                                searchRadius === meters && styles.miniChipTextActive,
                            ]}>
                                {getDistanceLabel(meters)}
                            </Text>
                        </Pressable>
                    ))}
                </View>
            )}
        </View>
    );
}

export default memo(MapHeader);
