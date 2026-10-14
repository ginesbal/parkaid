import { memo, useCallback, useState } from 'react';
import { Platform, Pressable, Text, View } from 'react-native';
import PlacesSearchBar from '../../../components/PlacesAutocomplete/PlacesSearchBar';
import { styles } from '../styles';

// Spoken as they read ("Lot"), so voice control can say what it sees; the
// hint says what the chip does.
const TYPE_FILTERS = [
    { type: 'all', label: 'All', hint: 'Shows all parking' },
    { type: 'on_street', label: 'Street', hint: 'Shows street parking only' },
    { type: 'off_street', label: 'Lot', hint: 'Shows parking lots only' },
    { type: 'residential', label: 'Permit', hint: 'Shows permit parking only' },
];

// The pills render ~29pt tall; extend the touch area to the 44pt minimum
// without making them visually heavier. Vertical only — horizontally the
// pills are 8pt apart and already ≥48pt wide, so slop there would overlap.
const CHIP_HIT_SLOP = { top: 8, bottom: 8 };
// Browsers ignore hitSlop; on the web, public/index.html extends the tap area
// of anything tagged hit="chip" by the same 8 above and below.
const WEB_CHIP_HIT = Platform.OS === 'web' ? { dataSet: { hit: 'chip' } } : null;

/**
 * MapHeader — search first, then the parking-type chips, always in view.
 * Dropping a search pin lives with the floating controls, in thumb reach.
 */
function MapHeader({
    isDetailActive,
    placingPin,
    filterType,
    setFilterType,
    onPlaceSelected,
    onSearchResultsChange,
    onSearchFocusChange,
}) {
    const [resultsOpen, setResultsOpen] = useState(false);

    const handleResultsVisibleChange = useCallback((open) => {
        setResultsOpen(open);
        onSearchResultsChange?.(open);
    }, [onSearchResultsChange]);

    // The chips step aside while a card is open, the pin is being placed, or
    // search results are showing. They fade but keep their space, so the
    // header — and the map padding measured from it — never reflows.
    const chipsMuted = isDetailActive || placingPin || resultsOpen;

    return (
        <View style={styles.headerBar}>
            <PlacesSearchBar
                onPlaceSelected={onPlaceSelected}
                onResultsVisibleChange={handleResultsVisibleChange}
                onFocusChange={onSearchFocusChange}
                style={styles.searchContainer}
            />

            <View
                style={[styles.typeChips, chipsMuted && styles.typeChipsMuted]}
                pointerEvents={chipsMuted ? 'none' : 'auto'}
                accessibilityElementsHidden={chipsMuted}
                importantForAccessibility={chipsMuted ? 'no-hide-descendants' : 'auto'}
            >
                {TYPE_FILTERS.map((f) => {
                    const isActive = filterType === f.type;
                    return (
                        <Pressable
                            key={f.type}
                            style={({ pressed }) => [
                                styles.miniChip,
                                isActive && styles.miniChipActive,
                                pressed && styles.filterChipPressed,
                            ]}
                            onPress={() => setFilterType(f.type)}
                            hitSlop={CHIP_HIT_SLOP}
                            {...WEB_CHIP_HIT}
                            accessibilityRole="button"
                            accessibilityLabel={f.label}
                            accessibilityHint={f.hint}
                            accessibilityState={{ selected: isActive }}
                        >
                            <Text style={[styles.miniChipText, isActive && styles.miniChipTextActive]}>
                                {f.label}
                            </Text>
                        </Pressable>
                    );
                })}
            </View>
        </View>
    );
}

export default memo(MapHeader);
