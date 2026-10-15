import { memo, useCallback, useEffect, useRef, useState } from 'react';
import { Platform, View } from 'react-native';
import TypeSwitch from '../../../components/Filters/TypeSwitch';
import PlacesSearchBar from '../../../components/PlacesAutocomplete/PlacesSearchBar';
import { styles } from '../styles';

/**
 * MapHeader — search first, then the parking-type switch, always in view.
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

    // The switch steps aside while a card is open, the pin is being placed,
    // or search results are showing. It fades but keeps its space, so the
    // header — and the map padding measured from it — never reflows. On the
    // web it's also made inert, so Tab can't land on it while it's hidden.
    const filtersMuted = isDetailActive || placingPin || resultsOpen;
    const filtersRef = useRef(null);
    useEffect(() => {
        if (Platform.OS === 'web' && filtersRef.current) filtersRef.current.inert = filtersMuted;
    }, [filtersMuted]);

    return (
        <View style={styles.headerBar}>
            <PlacesSearchBar
                onPlaceSelected={onPlaceSelected}
                onResultsVisibleChange={handleResultsVisibleChange}
                onFocusChange={onSearchFocusChange}
                style={styles.searchContainer}
            />

            <View
                ref={filtersRef}
                style={[styles.typeFilters, filtersMuted && styles.typeFiltersMuted]}
                pointerEvents={filtersMuted ? 'none' : 'auto'}
                accessibilityElementsHidden={filtersMuted}
                importantForAccessibility={filtersMuted ? 'no-hide-descendants' : 'auto'}
            >
                <TypeSwitch value={filterType} onChange={setFilterType} floating />
            </View>
        </View>
    );
}

export default memo(MapHeader);
