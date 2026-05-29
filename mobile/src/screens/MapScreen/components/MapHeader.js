import { MaterialCommunityIcons } from '@expo/vector-icons';
import { memo, useCallback, useState } from 'react';
import { LayoutAnimation, Platform, Pressable, Text, UIManager, View } from 'react-native';
import PlacesSearchBar from '../../../components/PlacesAutocomplete/PlacesSearchBar';
import { TOKENS } from '../../../constants/theme';
import { styles } from '../styles';

// Enable LayoutAnimation on Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
}

const TYPE_FILTERS = [
    { type: 'all', label: 'All' },
    { type: 'on_street', label: 'Street' },
    { type: 'off_street', label: 'Lot' },
    { type: 'residential', label: 'Permit' },
];

const DISTANCE_PRESETS = [
    { value: 150, label: '150m' },
    { value: 500, label: '500m' },
    { value: 1000, label: '1km' },
];

function MapHeader({
    isDetailActive,
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
}) {
    const [filtersExpanded, setFiltersExpanded] = useState(false);

    const handleFilterPress = useCallback((type) => {
        setFilterType(type);
    }, [setFilterType]);

    const handleDistancePress = useCallback((distance) => {
        setSearchRadius(distance);
    }, [setSearchRadius]);

    const toggleFilters = useCallback(() => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setFiltersExpanded(prev => !prev);
    }, []);

    // Active filter count for the badge
    const activeFilterCount =
        (filterType !== 'all' ? 1 : 0) + (searchRadius !== 150 ? 1 : 0);

    return (
        <View style={styles.headerBar}>
            {/* Quick actions row — filter + pin buttons sit above the search
                bar, right-aligned. Hidden while the flippable detail card is
                open so the header stays minimal. */}
            <View
                style={[
                    styles.quickActions,
                    isDetailActive && styles.quickActionsHidden,
                ]}
                pointerEvents={isDetailActive ? 'none' : 'auto'}
                accessibilityElementsHidden={isDetailActive}
                importantForAccessibility={isDetailActive ? 'no-hide-descendants' : 'auto'}
            >
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
                        color={filtersExpanded ? '#fff' : TOKENS.primaryAlt}
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
                            color={searchMode === 'pinned' ? '#fff' : TOKENS.primaryAlt}
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
                style={styles.searchContainer}
            />

            {/* Expandable filters — single inline row */}
            {filtersExpanded && !isDetailActive && (
                <View style={styles.filtersInline}>
                    {/* Type chips */}
                    {TYPE_FILTERS.map(f => (
                        <Pressable
                            key={f.type}
                            style={({ pressed }) => [
                                styles.miniChip,
                                filterType === f.type && styles.miniChipActive,
                                pressed && styles.filterChipPressed,
                            ]}
                            onPress={() => handleFilterPress(f.type)}
                            accessibilityRole="button"
                            accessibilityState={{ selected: filterType === f.type }}
                        >
                            <Text style={[
                                styles.miniChipText,
                                filterType === f.type && styles.miniChipTextActive,
                            ]}>
                                {f.label}
                            </Text>
                        </Pressable>
                    ))}

                    {/* Divider dot */}
                    <View style={styles.chipDivider} />

                    {/* Distance chips */}
                    {DISTANCE_PRESETS.map(preset => (
                        <Pressable
                            key={preset.value}
                            style={({ pressed }) => [
                                styles.miniChip,
                                searchRadius === preset.value && styles.miniChipActive,
                                pressed && styles.filterChipPressed,
                            ]}
                            onPress={() => handleDistancePress(preset.value)}
                            accessibilityRole="button"
                            accessibilityState={{ selected: searchRadius === preset.value }}
                        >
                            <Text style={[
                                styles.miniChipText,
                                searchRadius === preset.value && styles.miniChipTextActive,
                            ]}>
                                {preset.label}
                            </Text>
                        </Pressable>
                    ))}
                </View>
            )}
        </View>
    );
}

export default memo(MapHeader);
