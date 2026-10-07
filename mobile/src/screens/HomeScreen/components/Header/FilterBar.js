import React, { useCallback } from 'react';
import { Pressable, Text, View } from 'react-native';
import { RADIUS_OPTIONS, metersToWalkMinutes } from '../../../../constants/parking';
import { getDistanceLabel } from '../../../../utils/parkingHelpers';
import { styles } from './styles';

const TYPE_FILTERS = [
    { key: 'all', label: 'All' },
    { key: 'on_street', label: 'Street' },
    { key: 'off_street', label: 'Lot' },
    { key: 'residential', label: 'Permit' },
];

const FilterBar = ({
    activeFilter,
    setActiveFilter,
    searchRadius,
    setSearchRadius,
}) => {
    const handleFilterPress = useCallback((key) => {
        setActiveFilter?.(key);
    }, [setActiveFilter]);

    const handleDistancePress = useCallback((distance) => {
        setSearchRadius?.(distance);
    }, [setSearchRadius]);

    return (
        <View style={styles.filterBar}>
            <View style={styles.filterRow}>
                {TYPE_FILTERS.map((filter) => {
                    const isActive = activeFilter === filter.key;
                    return (
                        <Pressable
                            key={filter.key}
                            onPress={() => handleFilterPress(filter.key)}
                            style={({ pressed }) => [
                                styles.filterChip,
                                isActive && styles.filterChipActive,
                                pressed && styles.filterChipPressed,
                            ]}
                            accessibilityRole="button"
                            accessibilityState={{ selected: isActive }}
                        >
                            <Text style={[
                                styles.filterChipText,
                                isActive && styles.filterChipTextActive
                            ]}>
                                {filter.label}
                            </Text>
                        </Pressable>
                    );
                })}
            </View>

            <View style={styles.distanceRow}>
                {/* Same word and spoken labels as the map's radius chips. */}
                <Text style={styles.distanceLabel}>Within</Text>
                <View style={styles.distanceOptions}>
                    {RADIUS_OPTIONS.map((option) => {
                        const isActive = searchRadius === option.value;
                        return (
                            <Pressable
                                key={option.value}
                                style={({ pressed }) => [
                                    styles.distanceOption,
                                    isActive && styles.distanceOptionActive,
                                    pressed && styles.distanceOptionPressed,
                                ]}
                                onPress={() => handleDistancePress(option.value)}
                                accessibilityRole="button"
                                accessibilityLabel={`Within ${getDistanceLabel(option.value)}, about a ${metersToWalkMinutes(option.value)} minute walk`}
                                accessibilityState={{ selected: isActive }}
                            >
                                <Text style={[
                                    styles.distanceOptionText,
                                    isActive && styles.distanceOptionTextActive
                                ]}>
                                    {option.label}
                                </Text>
                            </Pressable>
                        );
                    })}
                </View>
            </View>
        </View>
    );
};

export default React.memo(FilterBar);
