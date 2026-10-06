import { Pressable, Text } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { TOKENS } from '../../../../constants/theme';
import { styles } from './styles';

/**
 * MapFAB - Floating action button for map navigation
 */
const MapFAB = ({ onPress }) => {
    return (
        <Pressable
            style={({ pressed }) => [
                styles.mapFab,
                pressed && styles.mapFabPressed,
            ]}
            onPress={onPress}
            accessibilityRole="button"
            accessibilityLabel="View parking map"
        >
            <MaterialCommunityIcons
                name="map"
                size={20}
                color={TOKENS.onPrimary}
            />
            <Text style={styles.mapFabLabel}>Map</Text>
        </Pressable>
    );
};

export default MapFAB;
