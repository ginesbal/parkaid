import React from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { getDistanceLabel } from '../../../../utils/parkingHelpers';
import { styles } from './styles';

const TYPE_FILTERS = [
    { key: 'all', label: 'All' },
    { key: 'on_street', label: 'Street' },
    { key: 'off_street', label: 'Lot' },
    { key: 'residential', label: 'Permit' },
];

// Four stops so the row fits a phone without hiding the widest option.
const DISTANCE_OPTIONS = [150, 250, 500, 1000];

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

// Type and search radius. Lives behind the Filters button on Home.
const FilterBar = ({ activeFilter, setActiveFilter, searchRadius, setSearchRadius, typeNote }) => (
    <View style={styles.filterPanel}>
        <OptionRow
            label="Parking type"
            options={TYPE_FILTERS.map((f) => f.key)}
            selected={activeFilter}
            onSelect={setActiveFilter}
            renderLabel={(key) => TYPE_FILTERS.find((f) => f.key === key).label}
        />
        {typeNote ? <Text style={styles.filterNote}>{typeNote}</Text> : null}
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
