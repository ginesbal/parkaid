import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Pressable, Text, View } from 'react-native';
import { TOKENS } from '../../../../constants/theme';
import { styles } from './styles';

/**
 * LocationSection - Minimal location display (Redesigned for clarity)
 */
const LocationSection = ({ locationName, onPress }) => {
    return (
        <Pressable
            style={({ pressed }) => [
                styles.locationSection,
                pressed && styles.locationSectionPressed,
            ]}
            onPress={onPress}
            accessibilityRole="button"
            accessibilityLabel={`Current area, ${locationName}`}
            accessibilityHint="Opens the map"
        >
            {/* Decorative: on the web an icon is a font glyph, which would
                otherwise count as text in the button's name. */}
            <MaterialCommunityIcons
                name="map-marker"
                size={18}
                color={TOKENS.primary}
                style={styles.locationIcon}
                aria-hidden
            />

            <View style={styles.locationInfo}>
                <Text style={styles.locationLabel}>Current area</Text>
                <Text style={styles.locationText} numberOfLines={1}>
                    {locationName}
                </Text>
            </View>

            <MaterialCommunityIcons
                name="chevron-right"
                size={18}
                color={TOKENS.primary}
                aria-hidden
            />
        </Pressable>
    );
};

export default LocationSection;
