import { MaterialCommunityIcons } from '@expo/vector-icons';
import React from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { SELECTED } from '../../../../constants/theme';
import { DISTANCE_OPTIONS, TYPE_OPTIONS, getTypeLabel } from '../../../../utils/filters';
import { getDistanceLabel } from '../../../../utils/parkingHelpers';
import { styles } from './styles';

function OptionRow({ label, options, selected, onSelect, renderLabel }) {
    return (
        <View style={styles.filterGroup}>
            <Text style={styles.filterGroupLabel}>{label}</Text>
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.filterOptions}
                accessibilityRole="radiogroup"
                accessibilityLabel={label}
            >
                {options.map((value) => {
                    const isSelected = selected === value;
                    return (
                        <Pressable
                            key={value}
                            onPress={() => onSelect?.(value)}
                            style={({ pressed }) => [
                                styles.filterOption,
                                isSelected && styles.filterOptionSelected,
                                pressed && styles.pressed,
                            ]}
                            accessibilityRole="radio"
                            aria-checked={isSelected}
                        >
                            {isSelected ? <MaterialCommunityIcons name="check" size={16} color={SELECTED.icon} /> : null}
                            <Text style={[styles.filterOptionText, isSelected && styles.filterOptionTextSelected]}>
                                {renderLabel(value)}
                            </Text>
                        </Pressable>
                    );
                })}
            </ScrollView>
        </View>
    );
}

// Type and search radius, shared with Map. Lives behind the Filters button on Home.
const FilterBar = ({ activeFilter, setActiveFilter, searchRadius, setSearchRadius }) => (
    <View style={styles.filterPanel}>
        <OptionRow
            label="Parking type"
            options={TYPE_OPTIONS.map((f) => f.key)}
            selected={activeFilter}
            onSelect={setActiveFilter}
            renderLabel={getTypeLabel}
        />
        <OptionRow
            label="Distance"
            options={DISTANCE_OPTIONS}
            selected={searchRadius}
            onSelect={setSearchRadius}
            renderLabel={getDistanceLabel}
        />
    </View>
);

export default React.memo(FilterBar);
