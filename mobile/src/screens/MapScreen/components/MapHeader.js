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

function MapHeader({
    isDetailActive,
    placingPin,
    pinnedLocation,
    searchMode,
    onStartPlacing,
    filterType,
    setFilterType,
    onPlaceSelected,
}) {
    const [filtersExpanded, setFiltersExpanded] = useState(false);

    const handleFilterPress = useCallback((type) => {
        setFilterType(type);
    }, [setFilterType]);

    const toggleFilters = useCallback(() => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setFiltersExpanded(prev => !prev);
    }, []);

    // Only the type filter contributes to the badge now — the radius lives on
    // the map as an always-visible control, so it is never "hidden" state.
    const activeFilterCount = filterType !== 'all' ? 1 : 0;

    // Quick actions are suppressed while a detail card is open or while the
    // user is placing the search pin (the placement panel owns the screen then).
    const quickActionsMuted = isDetailActive || placingPin;
    const hasPin = !!pinnedLocation;

    return (
        <View style={styles.headerBar}>
            {/* Quick actions row — filter + pin buttons sit above the search
                bar, right-aligned. */}
            <View
                style={[
                    styles.quickActions,
                    quickActionsMuted && styles.quickActionsHidden,
                ]}
                pointerEvents={quickActionsMuted ? 'none' : 'auto'}
                accessibilityElementsHidden={quickActionsMuted}
                importantForAccessibility={quickActionsMuted ? 'no-hide-descendants' : 'auto'}
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

                {/* Set / move search pin — enters the reticle placement flow. */}
                <Pressable
                    style={({ pressed }) => [
                        styles.quickAction,
                        hasPin && searchMode === 'pinned' && styles.quickActionActive,
                        pressed && styles.quickActionPressed,
                    ]}
                    onPress={onStartPlacing}
                    accessibilityRole="button"
                    accessibilityLabel={hasPin ? 'Move search pin' : 'Set a search location'}
                >
                    <MaterialCommunityIcons
                        name={hasPin ? 'map-marker' : 'map-marker-plus'}
                        size={20}
                        color={hasPin && searchMode === 'pinned' ? '#fff' : TOKENS.primaryAlt}
                    />
                </Pressable>
            </View>

            {/* Search bar — full width, below the quick actions. */}
            <PlacesSearchBar
                onPlaceSelected={onPlaceSelected}
                style={styles.searchContainer}
            />

            {/* Expandable filters — parking type only */}
            {filtersExpanded && !isDetailActive && (
                <View style={styles.filtersInline}>
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
                </View>
            )}
        </View>
    );
}

export default memo(MapHeader);
