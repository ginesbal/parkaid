import { MaterialCommunityIcons } from '@expo/vector-icons';
import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { TOKENS } from '../../../../constants/theme';
import { styles } from './styles';

// One view at a time. Near me and Best value re-sort the same results;
// Covered narrows them to parkades.
export const HOME_VIEWS = [
    { key: 'near', label: 'Near me' },
    { key: 'value', label: 'Best value' },
    { key: 'covered', label: 'Covered' },
];

const ViewChips = ({ view, onChange }) => (
    <View style={styles.chipRow} accessibilityRole="radiogroup">
        {HOME_VIEWS.map(({ key, label }) => {
            const selected = view === key;
            return (
                <Pressable
                    key={key}
                    onPress={() => onChange(key)}
                    style={({ pressed }) => [
                        styles.chip,
                        selected && styles.chipSelected,
                        pressed && styles.pressed,
                    ]}
                    accessibilityRole="radio"
                    aria-checked={selected}
                >
                    {/* Check mark so selection never relies on colour alone */}
                    {selected ? (
                        <MaterialCommunityIcons name="check" size={16} color={TOKENS.primaryInk} />
                    ) : null}
                    <Text style={[styles.chipText, selected && styles.chipTextSelected]}>
                        {label}
                    </Text>
                </Pressable>
            );
        })}
    </View>
);

export default React.memo(ViewChips);
