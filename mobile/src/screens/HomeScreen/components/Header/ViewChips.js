import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { styles } from './styles';

// How the list is sorted; they only re-order the same results. What kind of
// parking is shown is the Filters' job (Parking type).
export const HOME_VIEWS = [
    { key: 'near', label: 'Near me' },
    { key: 'value', label: 'Best value' },
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
                    <Text style={[styles.chipText, selected && styles.chipTextSelected]}>
                        {label}
                    </Text>
                </Pressable>
            );
        })}
    </View>
);

export default React.memo(ViewChips);
